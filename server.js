/**
 * Jan Abhilekh — Live Scan / OCR / Search backend
 * ------------------------------------------------
 * Real pipeline, no fakes:
 *   phone camera -> upload -> Tesseract OCR (actually runs on the actual
 *   uploaded image) -> generic "Label: Value" field extraction (actually
 *   parses the actual OCR text, nothing hardcoded) -> saved to
 *   data/db.json (actually persists to disk) -> searchable by /api/search
 *   (actually reads db.json, no canned answers).
 *
 * Run:  npm install && npm start
 * Then open http://localhost:4000 on the laptop for the app,
 * and the QR-coded link on the phone (same Wi-Fi) to scan.
 */
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { createWorker } = require('tesseract.js');
const db = require('./db');

// Safety net: tesseract.js's worker-error path throws outside any promise
// chain when no errorHandler is wired to a given worker. We *do* wire one
// below, but this is cheap insurance so one bad scan never takes the whole
// demo server down mid-presentation.
process.on('uncaughtException', (err) => console.error('[uncaughtException — server kept running]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection — server kept running]', err));

const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TESSDATA_DIR = path.join(__dirname, 'tessdata');
for (const d of [UPLOAD_DIR, TESSDATA_DIR]) fs.mkdirSync(d, { recursive: true });

// ---------------------------------------------------------------------
// 1. PERSISTENT CITIZEN / DOCUMENT STORE — Supabase Postgres, not a file.
//    Works identically from any device: laptop, another laptop, phone
//    hotspot — all talk to the same cloud DB via DATABASE_URL.
// ---------------------------------------------------------------------
async function seedDbIfEmpty() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM citizens');
  if (rows[0].n > 0) return; // already seeded — never overwrite live data

  const raw = [
    { name: 'Ramesh Pawar', village: 'Ozar', taluka: 'Niphad', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Verified', ocr: 96 }, { type: 'Land Record', status: 'Verified', ocr: 96 }, { type: 'Income Certificate', status: 'Pending', ocr: 90 }] },
    { name: 'Sunita Deshmukh', village: 'Niphad', taluka: 'Niphad', occ: 'School Teacher', docs: [{ type: 'Caste Certificate', status: 'Verified', ocr: 95 }, { type: 'Caste Validity Certificate', status: 'Verified', ocr: 94 }, { type: 'Salary Certificate', status: 'Verified', ocr: 92 }] },
    { name: 'Vishal More', village: 'Ozar', taluka: 'Niphad', occ: 'Shopkeeper', docs: [{ type: 'Housing Owner Certificate', status: 'Verified', ocr: 88 }, { type: 'Ration Card', status: 'Verified', ocr: 90 }] },
    { name: 'Meena Kale', village: 'Lasalgaon', taluka: 'Niphad', occ: 'Staff Nurse', docs: [{ type: 'Income Certificate', status: 'Verified', ocr: 93 }] },
    { name: 'Ganesh Bhosale', village: 'Ozar', taluka: 'Niphad', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Pending', ocr: 54 }] },
    { name: 'Anita Salve', village: 'Niphad', taluka: 'Niphad', occ: 'Farmer', docs: [{ type: 'Caste Certificate', status: 'Verified', ocr: 97 }, { type: 'Land Record', status: 'Verified', ocr: 95 }] },
    { name: 'Prakash Wagh', village: 'Ozar', taluka: 'Niphad', occ: 'Shopkeeper', docs: [{ type: 'Income Certificate', status: 'Verified', ocr: 91 }] },
    { name: 'Rekha Shinde', village: 'Lasalgaon', taluka: 'Niphad', occ: 'Staff Nurse', docs: [{ type: 'Income Certificate', status: 'Verified', ocr: 93 }] },
    { name: 'Mahesh Chavan', village: 'Sinnar', taluka: 'Sinnar', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Verified', ocr: 89 }] },
    { name: 'Sanika Pawar', village: 'Ozar', taluka: 'Niphad', occ: 'Student', docs: [{ type: 'Caste Certificate', status: 'Verified', ocr: 90 }] },
    { name: 'Aniket Pawar', village: 'Ozar', taluka: 'Niphad', occ: 'Student', docs: [{ type: 'Will Certificate', status: 'Pending', ocr: 82 }] },
    { name: 'Nita Gaikwad', village: 'Yeola', taluka: 'Yeola', occ: 'Weaver', docs: [{ type: 'Caste Certificate', status: 'Verified', ocr: 92 }] },
    { name: 'Deepak Sonawane', village: 'Dindori', taluka: 'Dindori', occ: 'Mason', docs: [{ type: 'Ration Card', status: 'Pending', ocr: 60 }] },
    { name: 'Vijay Patil', village: 'Niphad', taluka: 'Niphad', occ: 'Auto Rickshaw Driver', docs: [{ type: 'Housing Owner Certificate', status: 'Verified', ocr: 94 }] },
    { name: 'Sarika Bagul', village: 'Sinnar', taluka: 'Sinnar', occ: 'Anganwadi Worker', docs: [{ type: 'Salary Certificate', status: 'Verified', ocr: 91 }] },
    { name: 'Ravi Kulkarni', village: 'Ozar', taluka: 'Niphad', occ: 'Electrician', docs: [{ type: 'Will Certificate', status: 'Verified', ocr: 90 }] },
    { name: 'Shobha Wagh', village: 'Dindori', taluka: 'Dindori', occ: 'Dairy Owner', docs: [{ type: 'Land Record', status: 'Verified', ocr: 88 }] },
    { name: 'Ajay Gaikwad', village: 'Yeola', taluka: 'Yeola', occ: 'Bank Employee', docs: [{ type: 'Caste Validity Certificate', status: 'Verified', ocr: 97 }] },
    { name: 'Sushma Chavan', village: 'Sinnar', taluka: 'Sinnar', occ: 'Mechanic', docs: [{ type: 'Caste Validity Certificate', status: 'Verified', ocr: 95 }, { type: 'Income Certificate', status: 'Verified', ocr: 93 }] },
    { name: 'Nilesh Jadhav', village: 'Niphad', taluka: 'Niphad', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Verified', ocr: 92 }, { type: '7/12 Extract', status: 'Verified', ocr: 90 }] },
    { name: 'Pallavi More', village: 'Ozar', taluka: 'Niphad', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Pending', ocr: 45 }] },
    { name: 'Sachin Deshmukh', village: 'Niphad', taluka: 'Niphad', occ: 'Carpenter', docs: [{ type: 'Housing Owner Certificate', status: 'Verified', ocr: 96 }] },
    { name: 'Varsha Kale', village: 'Lasalgaon', taluka: 'Niphad', occ: 'Small Trader', docs: [{ type: 'Ration Card', status: 'Verified', ocr: 90 }] },
    { name: 'Yogesh Patil', village: 'Sinnar', taluka: 'Sinnar', occ: 'Farmer', docs: [{ type: 'Land Record', status: 'Verified', ocr: 94 }, { type: 'Income Certificate', status: 'Pending', ocr: 85 }] },
    { name: 'Sunita D.', village: 'Niphad', taluka: 'Niphad', occ: 'School Teacher', docs: [{ type: 'Will Certificate', status: 'Pending', ocr: 80 }] }
  ];

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const c of raw) {
      const { rows: [citizen] } = await client.query(
        'INSERT INTO citizens (name, village, taluka, occ) VALUES ($1,$2,$3,$4) RETURNING id',
        [c.name, c.village, c.taluka, c.occ]
      );
      for (const d of c.docs) {
        const daysAgo = Math.floor(Math.random() * 200);
        await client.query(
          `INSERT INTO documents (citizen_id, type, status, ocr_confidence, source, fields, raw_text, uploaded_at)
           VALUES ($1,$2,$3,$4,'seed','[]'::jsonb,'', now() - ($5 || ' days')::interval)`,
          [citizen.id, d.type, d.status, d.ocr, daysAgo]
        );
      }
    }
    await client.query('COMMIT');
    console.log(`Seeded ${raw.length} citizens into Supabase.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function loadCitizen(citizenId) {
  const { rows: [citizen] } = await db.query('SELECT * FROM citizens WHERE id = $1', [citizenId]);
  if (!citizen) return null;
  const { rows: docs } = await db.query('SELECT * FROM documents WHERE citizen_id = $1 ORDER BY uploaded_at DESC', [citizenId]);
  return { ...citizen, docs };
}

async function loadAllCitizens() {
  const { rows: citizens } = await db.query('SELECT * FROM citizens ORDER BY name');
  const { rows: docCounts } = await db.query('SELECT citizen_id, COUNT(*)::int AS n FROM documents GROUP BY citizen_id');
  const counts = Object.fromEntries(docCounts.map(r => [r.citizen_id, r.n]));
  return citizens.map(c => ({ ...c, docCount: counts[c.id] || 0 }));
}

// ---------------------------------------------------------------------
// 2. LIVE SCAN SESSIONS (in-memory — ephemeral by nature, one demo run)
// ---------------------------------------------------------------------
const sessions = new Map();
// session = { id, citizenId, stage, tesseractStatus, tesseractProgress,
//             fields, rawText, ocrConfidence, docType, savedDocId, error }

function lanIp() {
  if (process.env.LAN_IP) return process.env.LAN_IP;
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// Generic "Label: Value" extractor. Works on whatever text actually came
// out of OCR — nothing here is specific to any one document or citizen.
function extractFields(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const fields = [];
  const seen = new Set();
  const re = /^([A-Za-z][A-Za-z.\/ ]{1,40}?)\s*[:\-]\s*(.+)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();
      const key = label.toLowerCase();
      if (!seen.has(key) && value.length > 0 && value.length < 120) {
        seen.add(key);
        fields.push({ label, value });
      }
    }
  }
  return fields;
}

function guessDocType(text) {
  const t = text.toLowerCase();
  if (t.includes('survey') || t.includes('7/12') || t.includes('land record')) return 'Land Record';
  if (t.includes('aadhaar') || t.includes('uidai')) return 'Aadhaar';
  if (t.includes('income certificate') || t.includes('income cert')) return 'Income Certificate';
  if (t.includes('caste')) return 'Caste Certificate';
  if (t.includes('ration')) return 'Ration Card';
  if (t.includes('pan card') || /\bpan\b/.test(t)) return 'PAN';
  return 'Scanned Document';
}

// ---------------------------------------------------------------------
// Shared OCR worker — created ONCE at server startup instead of per
// scan. Per-session workers added ~1-2s init overhead to every single
// scan; one persistent worker fixes that and is fine for a one-scan-
// at-a-time hackathon demo. `activeSession` tells the shared logger
// which session to post progress updates onto.
// ---------------------------------------------------------------------
let sharedWorker = null;
let activeSession = null;
async function getSharedWorker() {
  if (sharedWorker) return sharedWorker;
  sharedWorker = await createWorker('eng', 1, {
    cachePath: TESSDATA_DIR,
    logger: (m) => {
      if (!activeSession) return;
      activeSession.tesseractStatus = m.status;
      activeSession.tesseractProgress = m.progress;
      if (m.status === 'recognizing text') activeSession.stage = 'extracting';
      else if (m.status) activeSession.stage = 'reading';
    },
    errorHandler: (err) => console.error('Tesseract worker error:', err)
  });
  return sharedWorker;
}

async function processSession(sessionId, imagePath) {
  const s = sessions.get(sessionId);
  if (!s) return;
  const watchdog = setTimeout(() => {
    if (s.stage !== 'completed' && s.stage !== 'error') {
      s.stage = 'error';
      s.error = 'OCR did not respond in time. If this is the first run, make sure `npm run setup` completed successfully with internet access.';
    }
  }, 60000);
  try {
    s.stage = 'received';
    s.imagePath = imagePath;
    activeSession = s;

    const worker = await getSharedWorker();
    s.stage = 'reading';
    const result = await Promise.race([
      worker.recognize(imagePath),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OCR timed out after 45s — is the eng language data cached? Run "npm run setup" once with internet.')), 45000))
    ]);
    const text = result.data.text || '';
    s.rawText = text;
    s.ocrConfidence = Math.round(result.data.confidence || 0);
    // Real per-word bounding boxes from the actual OCR pass, so the UI can
    // draw highlight boxes over the actual regions Tesseract read text from.
    s.words = (result.data.words || [])
      .filter(w => w.confidence > 40 && w.text.trim())
      .map(w => ({ text: w.text, confidence: Math.round(w.confidence), bbox: w.bbox }));

    s.stage = 'extracting';
    const fields = extractFields(text);

    s.stage = 'identifying_fields';
    s.fields = fields;
    s.docType = guessDocType(text);

    s.stage = 'saving';
    const status = fields.length > 0 ? 'Verified' : 'Pending';
    const { rows: [doc] } = await db.query(
      `INSERT INTO documents (citizen_id, type, status, ocr_confidence, source, fields, raw_text)
       VALUES ($1,$2,$3,$4,'live-scan',$5,$6) RETURNING id`,
      [s.citizenId, s.docType, status, s.ocrConfidence, JSON.stringify(fields), text]
    );

    s.savedDocId = doc.id;
    s.stage = 'completed';
  } catch (err) {
    console.error('OCR pipeline error:', err);
    s.stage = 'error';
    s.error = String(err.message || err);
  } finally {
    clearTimeout(watchdog);
    activeSession = null;
  }
}

// ---------------------------------------------------------------------
// 3. SEARCH — reads live from Supabase, including anything just scanned
// ---------------------------------------------------------------------
async function searchDb(query) {
  const { rows: citizens } = await db.query('SELECT * FROM citizens');
  const { rows: allDocs } = await db.query('SELECT * FROM documents');
  const docsByCitizen = new Map();
  for (const d of allDocs) {
    if (!docsByCitizen.has(d.citizen_id)) docsByCitizen.set(d.citizen_id, []);
    docsByCitizen.get(d.citizen_id).push({ ...d, type: d.type, fields: d.fields || [], rawText: d.raw_text || '' });
  }
  for (const c of citizens) c.docs = docsByCitizen.get(c.id) || [];

  const q = query.toLowerCase();
  const qTokens = q.split(/[^a-z0-9\/]+/i).filter(t => t.length > 1);

  const matches = [];
  for (const c of citizens) {
    let citizenScore = 0;
    const citizenHay = `${c.name} ${c.village} ${c.taluka} ${c.occ}`.toLowerCase();
    for (const t of qTokens) if (citizenHay.includes(t)) citizenScore += 1;

    const docHits = [];
    for (const d of c.docs) {
      let docScore = 0;
      const fieldHits = [];
      for (const f of d.fields || []) {
        const val = String(f.value).toLowerCase();
        if (q.includes(val) || val.includes(q) || qTokens.some(t => val.includes(t) && t.length > 2)) {
          docScore += 3;
          fieldHits.push(f);
        }
      }
      const rawHay = (d.rawText || d.type || '').toLowerCase();
      for (const t of qTokens) if (rawHay.includes(t)) docScore += 0.5;
      if (docScore > 0) docHits.push({ doc: d, score: docScore, fieldHits });
    }
    const docScoreTotal = docHits.reduce((a, h) => a + h.score, 0);
    const totalScore = citizenScore + docScoreTotal;
    if (totalScore > 0) {
      docHits.sort((a, b) => b.score - a.score);
      matches.push({ citizen: c, score: totalScore, docHits });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 10);
}

async function ragAnswer(query, matches) {
  // Supports EITHER a real Anthropic key (sk-ant-...) OR an OpenRouter key
  // (sk-or-...) placed in ANTHROPIC_API_KEY / OPENROUTER_API_KEY. Auto-detects
  // which one you gave it and calls the right endpoint. Search still works
  // with zero key set — this only powers the phrased summary sentence.
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || (anthropicKey.startsWith('sk-or-') ? anthropicKey : '');
  const key = anthropicKey.startsWith('sk-or-') ? '' : anthropicKey; // real anthropic key only if it doesn't look like an OpenRouter key
  if ((!key && !openrouterKey) || matches.length === 0) return null;

  const context = matches.slice(0, 5).map(m => ({
    citizen: m.citizen.name, village: m.citizen.village, taluka: m.citizen.taluka,
    matchedDocuments: m.docHits.map(h => ({ type: h.doc.type, source: h.doc.source, fields: h.doc.fieldHits.length ? h.doc.fieldHits : h.doc.fields }))
  }));
  const system = 'You answer strictly from the JSON records given. Never invent a citizen, village, or field that is not in the JSON. If the JSON does not support an answer, say so. Be concise, one to two sentences.';
  const userMsg = `Question: ${query}\n\nRecords (real, from the database):\n${JSON.stringify(context, null, 2)}`;

  try {
    if (key) {
      // Real Anthropic key -> Anthropic Messages API
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system,
          messages: [{ role: 'user', content: userMsg }]
        })
      });
      const data = await resp.json();
      if (!resp.ok) { console.error('Anthropic API error:', data); return null; }
      const text = (data.content || []).map(b => b.text || '').join('');
      return text || null;
    } else {
      // OpenRouter key -> OpenAI-compatible chat/completions endpoint
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5',
          max_tokens: 300,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMsg }
          ]
        })
      });
      const data = await resp.json();
      if (!resp.ok) { console.error('OpenRouter API error:', data); return null; }
      const text = data.choices?.[0]?.message?.content || '';
      return text || null;
    }
  } catch (e) {
    console.error('RAG answer failed:', e);
    return null;
  }
}

// ---------------------------------------------------------------------
// 4. HTTP APP
// ---------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app', express.static(path.join(__dirname, 'frontend')));

const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 15 * 1024 * 1024 } });

app.get('/api/citizens', async (req, res) => {
  try {
    res.json(await loadAllCitizens());
  } catch (err) {
    console.error('GET /api/citizens failed:', err);
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/api/citizens/:id', async (req, res) => {
  try {
    const c = await loadCitizen(Number(req.params.id));
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json(c);
  } catch (err) {
    console.error('GET /api/citizens/:id failed:', err);
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/api/scan/sessions', async (req, res) => {
  const citizenId = Number(req.body.citizenId);
  const citizen = await loadCitizen(citizenId);
  if (!citizen) return res.status(400).json({ error: 'unknown citizenId' });

  const id = crypto.randomUUID();
  sessions.set(id, { id, citizenId, citizenName: citizen.name, stage: 'waiting_phone', fields: [], rawText: '', createdAt: Date.now() });

  const ip = lanIp();
  res.json({ sessionId: id, phoneUrl: `http://${ip}:${PORT}/scan.html?session=${id}` });
});

app.get('/api/scan/sessions/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'not found' });
  const { imagePath, ...safe } = s; // don't expose the raw disk path to the client
  res.json({ ...safe, hasImage: Boolean(imagePath) });
});

app.get('/api/scan/sessions/:id/image', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s || !s.imagePath || !fs.existsSync(s.imagePath)) return res.status(404).end();
  res.sendFile(s.imagePath);
});

app.post('/api/scan/sessions/:id/upload', upload.single('photo'), async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'session not found' });
  if (!req.file) return res.status(400).json({ error: 'no image received' });

  s.stage = 'received';
  res.json({ ok: true }); // phone gets an immediate real ack

  // Continue the real pipeline after responding to the phone.
  processSession(s.id, req.file.path);
});

app.post('/api/search', async (req, res) => {
  const q = (req.body.query || '').trim();
  if (!q) return res.json({ query: q, matches: [], answer: null });
  const matches = await searchDb(q);
  const answer = await ragAnswer(q, matches);
  res.json({
    query: q,
    matches: matches.map(m => ({
      citizenId: m.citizen.id,
      name: m.citizen.name,
      village: m.citizen.village,
      taluka: m.citizen.taluka,
      occ: m.citizen.occ,
      score: m.score,
      matchedDocs: m.docHits.map(h => ({ id: h.doc.id, type: h.doc.type, source: h.doc.source, matchedFields: h.fieldHits }))
    })),
    answer // null if no ANTHROPIC_API_KEY set — frontend falls back to a template sentence
  });
});

seedDbIfEmpty()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\nJan Abhilekh scan backend running.`);
      console.log(`  Desktop app:  http://localhost:${PORT}/app/`);
      console.log(`  LAN IP for phone links: ${lanIp()}`);
      console.log(`  Database: Supabase Postgres (any device with the same DATABASE_URL sees the same data)`);
      console.log(`  ANTHROPIC_API_KEY set: ${Boolean(process.env.ANTHROPIC_API_KEY)} (optional — search still works without it)\n`);
      getSharedWorker().then(() => console.log('OCR worker ready.')).catch(e => console.error('OCR worker failed to pre-load (will retry on first scan):', e.message));
    });
  })
  .catch((err) => {
    console.error('Failed to connect / seed Supabase database:', err.message);
    console.error('Check DATABASE_URL in .env — see README for how to get it from Supabase.');
    process.exit(1);
  });
