import crypto from "node:crypto";
import { getPostgresPool, runDatabaseMigrations } from "../src/db/postgres";
import { hashPassword } from "../src/server/security";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required; refusing to provision an in-memory-only account.");
  }

  const email = process.env.REDHACK_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.REDHACK_BOOTSTRAP_PASSWORD;
  const fullName = process.env.REDHACK_BOOTSTRAP_NAME?.trim() || "RedHack Administrator";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Set REDHACK_BOOTSTRAP_EMAIL to a valid email address.");
  }
  if (!password || password.length < 14 || password.length > 1024) {
    throw new Error("Set REDHACK_BOOTSTRAP_PASSWORD to a unique password of 14–1024 characters.");
  }

  const migration = await runDatabaseMigrations();
  if (!migration.success) {
    throw new Error(`Database migrations failed: ${migration.message}`);
  }

  const pool = getPostgresPool();
  if (!pool) throw new Error("PostgreSQL pool unavailable.");

  const { hash, salt } = hashPassword(password);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO organizations (id, name, slug, plan)
       VALUES ('org-defense-corp', 'RedHack Defense', 'redhack-defense', 'enterprise')
       ON CONFLICT (id) DO NOTHING`
    );
    await client.query(
      `INSERT INTO workspaces (id, organization_id, name, environment, scope_policy, is_active)
       VALUES ('ws-prod-defense', 'org-defense-corp', 'Production Defense', 'production',
               '{"authorizedSubnets":[],"authorizedDomains":[],"excludedAssets":[]}'::jsonb, TRUE)
       ON CONFLICT (id) DO NOTHING`
    );
    await client.query(
      `INSERT INTO roles (id, name, description, is_system_role)
       VALUES ('role-admin', 'Security Administrator', 'Initial platform administrator', TRUE)
       ON CONFLICT (id) DO NOTHING`
    );

    const userId = crypto.randomUUID();
    const inserted = await client.query(
      `INSERT INTO users
         (id, email, full_name, role_id, default_organization_id, default_workspace_id,
          is_active, password_hash, password_salt)
       VALUES ($1, $2, $3, 'role-admin', 'org-defense-corp', 'ws-prod-defense', TRUE, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [userId, email, fullName, hash, salt]
    );

    if (inserted.rowCount !== 1) {
      throw new Error("A user with this email already exists; no credentials were changed.");
    }

    await client.query(
      `INSERT INTO user_workspace_memberships (user_id, workspace_id, role_id)
       VALUES ($1, 'ws-prod-defense', 'role-admin')
       ON CONFLICT (user_id, workspace_id) DO NOTHING`,
      [userId],
    );

    await client.query("COMMIT");
    process.stdout.write(`Provisioned administrator account ${email}. The password was stored only as a salted PBKDF2 hash.\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown provisioning error";
  process.stderr.write(`User provisioning failed: ${message}\n`);
  process.exitCode = 1;
});
