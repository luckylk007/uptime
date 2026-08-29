import mysql from "mysql2/promise";

// MySQL connection pool � reads from environment variables
// Never hardcode credentials here
const pool = mysql.createPool({
  host: (process.env.MYSQL_HOST || "localhost").trim(),
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: (process.env.MYSQL_USER || "root").trim(),
  password: process.env.MYSQL_PASSWORD || "",
  database: (process.env.MYSQL_DATABASE || "uptimepro").trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: "+00:00",
  charset: "utf8mb4",
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

export default pool;

/**
 * Helper: run a parameterized query safely (prevents SQL injection).
 * Always use placeholders (?), never string concatenation.
 */
export async function query<T = any>(
  sql: string,
  values?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, values);
  return rows as T[];
}

/**
 * Helper: run query and return first row or null.
 */
export async function queryOne<T = any>(
  sql: string,
  values?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}
