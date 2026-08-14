# Switch to Supabase — one-time setup

## 1. Create the project
- supabase.com → New project → pick a region close to Nashik (e.g. ap-south-1) → set a DB password (save it).

## 2. Create the tables
- Project → SQL Editor → New query → paste everything in `db/schema.sql` → Run.

## 3. Get the connection string
- Project → Settings → Database → Connection string → **URI** tab.
- Copy it. Replace `[YOUR-PASSWORD]` in the string with your real DB password.

## 4. Configure the app
```bash
cp .env.example .env
# paste the URI into DATABASE_URL=
```

## 5. Install + run
```bash
npm install
npm run setup     # OCR language data (unrelated to DB, still needed once)
npm start
```
First run auto-seeds the 25 demo citizens into Supabase (only if the table is empty — safe to restart without duplicating data).

## Any other device
Same 4 steps, same `.env` (copy the file over, or re-paste the same DATABASE_URL) — no local DB install, no data re-seeding, same live data every time.
