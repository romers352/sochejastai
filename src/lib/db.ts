import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "192.250.235.148",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "sochejastai",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl:
    process.env.MYSQL_SSL === "1"
      ? {
          rejectUnauthorized: true,
          ca: process.env.MYSQL_CA || undefined,
        }
      : undefined,
  multipleStatements: false,
});

export default pool;