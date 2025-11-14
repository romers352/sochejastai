import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function parseArg(name, def) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1];
  return def;
}

async function main() {
  const host = parseArg('host');
  const port = parseArg('port');
  const user = parseArg('user');
  const password = parseArg('password');
  const database = parseArg('database');
  const sslCaPath = parseArg('ssl-ca', 'aiven_ca.pem');

  if (!host || !port || !user || !password || !database) {
    console.error('Missing required args. Usage: node scripts/apply-aiven-schema.mjs --host <host> --port <port> --user <user> --password <password> --database <db> [--ssl-ca <path>]');
    process.exit(1);
  }

  let ssl = undefined;
  try {
    const ca = fs.readFileSync(path.resolve(sslCaPath));
    ssl = { ca };
    console.log(`Using SSL CA: ${sslCaPath}`);
  } catch (e) {
    console.warn('SSL CA not found or unreadable, continuing without explicit CA...');
  }

  const conn = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
    database,
    ssl,
  });

  const schemaFile = path.join(process.cwd(), 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaFile, 'utf-8');

  // Split statements on semicolon followed by newline boundaries
  const stmts = sql
    .split(/;\s*[\r\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length);

  console.log(`Applying ${stmts.length} schema statements to ${database}...`);
  for (const s of stmts) {
    try {
      await conn.query(s);
      console.log('Applied:', s.slice(0, 100).replace(/\s+/g, ' '));
    } catch (e) {
      console.error('Failed:', s.slice(0, 100).replace(/\s+/g, ' '));
      console.error('  Error:', e.message);
      // continue to next statement
    }
  }

  await conn.end();
  console.log('Schema application complete.');
}

main().catch((e) => {
  console.error('Fatal error applying schema:', e);
  process.exit(1);
});