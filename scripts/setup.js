/**
 * Run this ONCE while you have internet, before the hackathon demo.
 * It downloads and caches the Tesseract OCR language data locally so the
 * live scan works even on flaky venue Wi-Fi.
 */
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

const TESSDATA_DIR = path.join(__dirname, '..', 'tessdata');
fs.mkdirSync(TESSDATA_DIR, { recursive: true });

(async () => {
  console.log('Downloading + caching English OCR language data into ./tessdata ...');
  const worker = await createWorker('eng', 1, {
    cachePath: TESSDATA_DIR, // downloads from tesseract.js's default CDN, caches here
    logger: (m) => console.log(`  ${m.status} ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`),
    errorHandler: (err) => console.error('  worker error:', err)
  });
  await worker.terminate();
  console.log('\nDone. OCR data is cached locally — safe to run offline now.');
})().catch((err) => {
  console.error('Setup failed:', err.message);
  console.error('Make sure this machine has internet access, then re-run: npm run setup');
  process.exit(1);
});
