// ============================================================================
// REDHACK AI v2.1 - Production PostgreSQL Connection Pool & Migration Engine
// ============================================================================

import { Pool, PoolClient } from "pg";
import fs from "fs";
import path from "path";

let pool: Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export interface DatabaseStatus {
  driver: "postgres" | "in-memory-fallback";
  isConfigured: boolean;
  isConnected: boolean;
  poolTotalCount: number;
  poolIdleCount: number;
  poolWaitingCount: number;
  lastError: string | null;
}

export function getPostgresPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

    pool = new Pool({
      connectionString,
      max: 20, // Max concurrent connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    pool.on("error", (err) => {
      console.error("[POSTGRES POOL ERROR]", err);
      lastError = err.message;
      isConnected = false;
    });
  }

  return pool;
}

/**
 * Health check that attempts a live ping on PostgreSQL
 */
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  const p = getPostgresPool();

  if (!p) {
    return {
      driver: "in-memory-fallback",
      isConfigured: false,
      isConnected: false,
      poolTotalCount: 0,
      poolIdleCount: 0,
      poolWaitingCount: 0,
      lastError: "DATABASE_URL not configured. Running on isolated in-memory enterprise store.",
    };
  }

  try {
    const client = await p.connect();
    try {
      const res = await client.query("SELECT 1 AS ping, NOW() AS server_time");
      isConnected = res.rows.length > 0;
      lastError = null;
    } finally {
      client.release();
    }

    return {
      driver: "postgres",
      isConfigured: true,
      isConnected: true,
      poolTotalCount: p.totalCount,
      poolIdleCount: p.idleCount,
      poolWaitingCount: p.waitingCount,
      lastError: null,
    };
  } catch (err: any) {
    isConnected = false;
    lastError = err.message;
    return {
      driver: "postgres",
      isConfigured: true,
      isConnected: false,
      poolTotalCount: p.totalCount,
      poolIdleCount: p.idleCount,
      poolWaitingCount: p.waitingCount,
      lastError: err.message,
    };
  }
}

/**
 * Transaction Runner Helper with automatic rollback
 */
export async function withPostgresTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPostgresPool();
  if (!p) {
    throw new Error("Cannot run transaction: PostgreSQL is not connected.");
  }

  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Database Migration Runner: Executes schema.sql idempotently
 */
export async function runDatabaseMigrations(): Promise<{ success: boolean; appliedCount: number; message: string }> {
  const p = getPostgresPool();
  if (!p) {
    return {
      success: false,
      appliedCount: 0,
      message: "DATABASE_URL is not set. Migrations skipped (in-memory mode).",
    };
  }

  try {
    const client = await p.connect();
    try {
      // Ensure migrations table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(128) PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Read schema.sql
      const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      const schemaSql = fs.readFileSync(schemaPath, "utf8");

      // Check if baseline schema is already applied
      const checkRes = await client.query(
        "SELECT version FROM schema_migrations WHERE version = '001_baseline_v2'"
      );

      if (checkRes.rows.length === 0) {
        console.log("[MIGRATIONS] Applying baseline schema 001_baseline_v2...");
        await client.query(schemaSql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ('001_baseline_v2')"
        );
        return {
          success: true,
          appliedCount: 1,
          message: "Baseline PostgreSQL schema (21 tables, indexes & constraints) applied successfully.",
        };
      } else {
        return {
          success: true,
          appliedCount: 0,
          message: "Database schema is up to date (001_baseline_v2 already applied).",
        };
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[MIGRATION ERROR]", err);
    return {
      success: false,
      appliedCount: 0,
      message: `Migration failed: ${err.message}`,
    };
  }
}
