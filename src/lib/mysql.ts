import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getMysqlPool(): mysql.Pool {
  if (pool) return pool;

  const host = process.env["MYSQL_HOST"] || "gateway01.eu-central-1.prod.aws.tidbcloud.com";
  const portStr = process.env["MYSQL_PORT"];
  const port = portStr ? parseInt(portStr, 10) : 4000;
  const user = process.env["MYSQL_USER"] || "33cM6nMUdvz3FPR.root";
  const password = process.env["MYSQL_PASSWORD"] || "";
  const database = process.env["MYSQL_DATABASE"] || "irina_cosmetic";
  const ssl = { minVersion: "TLSv1.2", rejectUnauthorized: true };

  const isServerless = !!(process.env["VERCEL"] || process.env["NOW_REGION"]);

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl,
    waitForConnections: true,
    connectionLimit: isServerless ? 3 : 10,
    maxIdle: isServerless ? 2 : 10,
    idleTimeout: isServerless ? 15000 : 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const connectionPool = getMysqlPool();
  const [rows] = await connectionPool.execute(sql, params);
  return JSON.parse(JSON.stringify(rows)) as T;
}
