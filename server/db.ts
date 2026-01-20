import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Make DATABASE_URL optional for local development
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Running with in-memory storage. Data will not persist between restarts.",
  );
}

// Create connection pool with better retry and timeout settings
export const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // For local PostgreSQL, disable SSL
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
}) : null;

if (pool) {
  pool.on('error', (err: any) => {
    console.error('Unexpected error on idle client', err);
  });
}

// Initialize drizzle with our pool and schema (only if pool exists)
export const db = pool ? drizzle(pool, { schema }) : null;

// Helper function to check database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  if (!pool) {
    console.log('No database connection available (DATABASE_URL not set)');
    return false;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    if (client) client.release();
  }
};
