/**
 * Supabase / Postgres connection pool.
 * DATABASE_URL comes from: Supabase project -> Settings -> Database -> Connection string (URI).
 * Use the "Transaction pooler" URI (port 6543) if deploying somewhere serverless;
 * the direct connection (port 5432) is fine for a normal always-on Node server.
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

pool.on('error', (err) => console.error('Unexpected Postgres pool error:', err));

module.exports = pool;
