#!/usr/bin/env node
import mysql from "mysql2/promise";
import fs from "fs";

function getArg(name, fallback) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function truthy(v) {
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

async function main() {
  const host = getArg("host", process.env.MYSQL_HOST);
  const port = Number(getArg("port", process.env.MYSQL_PORT || 3306));
  const user = getArg("user", process.env.MYSQL_USER);
  const password = getArg("password", process.env.MYSQL_PASSWORD);
  const database = getArg("database", process.env.MYSQL_DATABASE);
  const sslCAPath = getArg("ssl-ca", process.env.MYSQL_CA);
  const useSSL = truthy(getArg("ssl", process.env.MYSQL_SSL));

  if (!host || !user || !database) {
    console.error("Missing connection info. Provide --host, --user, --password, --database (and optionally --port, --ssl, --ssl-ca). Or set MYSQL_* env vars.");
    process.exit(1);
  }

  const ssl = useSSL
    ? {
        rejectUnauthorized: true,
        ca: sslCAPath && fs.existsSync(sslCAPath) ? fs.readFileSync(sslCAPath, "utf-8") : undefined,
      }
    : undefined;

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    ssl,
  });

  try {
    const [tables] = await pool.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      [database]
    );

    const tableNames = tables.map((t) => t.TABLE_NAME);
    if (tableNames.length === 0) {
      console.log(`No tables found in schema '${database}'.`);
      process.exit(0);
    }

    console.log(`Database: ${database}`);
    console.log(`Host: ${host}:${port}`);
    console.log("Tables and row counts:");

    for (const name of tableNames) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS c FROM \`${name}\``);
        const count = rows && rows[0] ? rows[0].c : 0;
        console.log(`- ${name} => ${count}`);
      } catch (err) {
        console.log(`- ${name} => (count failed: ${err?.message || "error"})`);
      }
    }

    await pool.end();
  } catch (err) {
    console.error("Failed to list tables:", err?.message || err);
    process.exit(1);
  }
}

main();