# Jan Abhilekh — Live Scan / OCR / Search (real, not a demo animation)

What this actually does, end to end:

1. You pick a citizen on the laptop → server creates a scan session.
2. QR code / link opens a page on your **phone's own browser** (same Wi-Fi).
3. Phone camera captures the physical document → uploads the real photo.
4. Server runs **real Tesseract OCR** on that exact photo.
5. A generic `Label: Value` parser extracts fields from the **actual OCR text**
   — nothing is hardcoded, it works on whatever the document actually says.
6. The document + extracted fields are written to `data/db.json` (a real file,
   persists across restarts).
7. AI Search queries that same file — including anything you just scanned —
   and returns real matches with the field that matched.

## One-time setup (do this before the hackathon, while you have internet)

```bash
cd scan-feature
npm install
npm run setup      # downloads + caches OCR language data locally
                    # so the live demo doesn't depend on venue Wi-Fi
```

## Run it

```bash
npm start
```

Then open **`http://localhost:4000/app/`** on the laptop — that's the full
Jan Abhilekh frontend with the live scan wired in.

The phone needs to be on the **same Wi-Fi** as the laptop. The server
auto-detects the laptop's LAN IP for the QR code; if that guess is wrong on
your network, force it:

```bash
LAN_IP=192.168.1.23 npm start
```

(find your real IP with `ipconfig getifaddr en0` on Mac, or `ipconfig` on
Windows).

## Optional: real LLM-phrased search answers

Search works with zero configuration (deterministic field/keyword matching
against the real saved data). If you also want the answer sentence phrased
by Claude — still 100% grounded in the real matched records, never invented —
set an API key before starting the server:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

## Demo script (matches the judge walkthrough)

1. **Scan Document** → pick a citizen (e.g. a real one, or use the demo
   fictional dataset already seeded).
2. Scan the QR with your phone → snap the physical document → send.
3. Watch the laptop screen: stage list advances for real (Received → Reading
   → Extracting → Identifying Fields → Saving → Completed), driven by actual
   Tesseract progress events, not a timer.
4. Extracted fields + OCR confidence appear once OCR genuinely finishes.
5. "Saved to `<citizen>` → Documents" panel shows the citizen's real document
   list, including the one you just scanned.
6. Go to **AI Search**, ask e.g. *"Which citizen has survey number 142/2A?"*
   (or whatever field value is actually on the document you scanned) — the
   answer comes from the real saved record, tagged **Live backend**.

## Important honesty note

If the backend isn't running, the frontend says so plainly (a
"Backend not reachable" banner on Scan Document, an **offline / cached
dataset** badge on AI Search) rather than silently falling back to fake
data. Judges should never see a state that looks live but isn't.

## What's real vs. what's out of scope

**Real:** phone→laptop transfer, OCR, field extraction, persistence, search,
the stage animation (tied to actual backend state).

**Out of scope / unchanged:** the separate static "Citizen Profile" page in
the original app was already hardcoded to one fixed demo citizen everywhere
in the codebase (not id-aware) — that's a pre-existing limitation of the
prototype, not something this feature introduces. The "saved to citizen →
Documents" confirmation is shown for real inside the Scan Document view
instead. Happy to wire the Profile page for real too if you want it next.

## Troubleshooting

- **"Backend not reachable"** on the citizen dropdown → the Node server
  isn't running, or you opened the HTML file directly instead of via
  `http://localhost:4000/app/`.
- **OCR session stuck / errors after ~60s** → language data isn't cached and
  there's no internet right now. Run `npm run setup` again with internet,
  then retry.
- **Phone can't reach the link** → phone and laptop must be on the same
  Wi-Fi; try the `LAN_IP` override above.
