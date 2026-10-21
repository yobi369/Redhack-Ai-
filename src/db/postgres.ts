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

      let appliedCount = 0;

      // Apply the baseline only once. Incremental migrations below must still run on
      // databases where the baseline is already installed.
      const baseline = await client.query(
        "SELECT version FROM schema_migrations WHERE version = '001_baseline_v2'"
      );
      if (baseline.rows.length === 0) {
        console.log("[MIGRATIONS] Applying baseline schema 001_baseline_v2...");
        await client.query(schemaSql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ('001_baseline_v2')");
        appliedCount += 1;
      }

      const credentialsMigration = await client.query(
        "SELECT version FROM schema_migrations WHERE version = '002_user_password_credentials'"
      );
      if (credentialsMigration.rows.length === 0) {
        console.log("[MIGRATIONS] Applying migration 002_user_password_credentials...");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash CHAR(128)");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt CHAR(32)");
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ('002_user_password_credentials')"
        );
        appliedCount += 1;
      }

      const tenantDataMigration = await client.query(
        "SELECT version FROM schema_migrations WHERE version = '003_tenant_scoped_domain_data'"
      );
      if (tenantDataMigration.rows.length === 0) {
        console.log("[MIGRATIONS] Applying migration 003_tenant_scoped_domain_data...");
        await client.query("BEGIN");
        try {
          await client.query(`
            ALTER TABLE findings ADD COLUMN IF NOT EXISTS evidence TEXT NOT NULL DEFAULT '';
            ALTER TABLE findings ADD COLUMN IF NOT EXISTS asset_name VARCHAR(255);
            ALTER TABLE findings ADD COLUMN IF NOT EXISTS asset_exposure VARCHAR(50);
            ALTER TABLE findings ADD COLUMN IF NOT EXISTS audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb;
            ALTER TABLE incidents ADD COLUMN IF NOT EXISTS related_alert_ids TEXT[] NOT NULL DEFAULT '{}';
            ALTER TABLE incidents ADD COLUMN IF NOT EXISTS affected_asset_ids TEXT[] NOT NULL DEFAULT '{}';
            CREATE INDEX IF NOT EXISTS idx_findings_workspace_created ON findings(workspace_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_incidents_workspace_created ON incidents(workspace_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_evidence_workspace_created ON evidence(workspace_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_memberships_workspace_user ON user_workspace_memberships(workspace_id, user_id);
            INSERT INTO user_workspace_memberships (user_id, workspace_id, role_id)
            SELECT u.id, u.default_workspace_id, u.role_id
              FROM users u
              JOIN workspaces w ON w.id = u.default_workspace_id
             WHERE u.is_active = TRUE AND u.default_workspace_id IS NOT NULL
            ON CONFLICT (user_id, workspace_id) DO NOTHING;
          `);
          await client.query("INSERT INTO schema_migrations (version) VALUES ('003_tenant_scoped_domain_data')");
          await client.query("COMMIT");
          appliedCount += 1;
        } catch (migrationError) {
          await client.query("ROLLBACK");
          throw migrationError;
        }
      }

      return {
        success: true,
        appliedCount,
        message: appliedCount > 0
          ? `Applied ${appliedCount} database migration(s) successfully.`
          : "Database schema is up to date (003_tenant_scoped_domain_data already applied).",
      };
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
