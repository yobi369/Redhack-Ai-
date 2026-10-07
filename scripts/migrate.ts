// ============================================================================
// REDHACK AI v2.1 - Database Migration CLI Runner
// ============================================================================

import dotenv from "dotenv";
import { runDatabaseMigrations, checkDatabaseHealth } from "../src/db/postgres";

dotenv.config();

async function main() {
  console.log("\n=======================================================");
  console.log("   REDHACK AI v2.1 ENTERPRISE DATABASE MIGRATION CLI   ");
  console.log("=======================================================\n");

  const health = await checkDatabaseHealth();
  console.log(`Database Driver : ${health.driver}`);
  console.log(`Configured      : ${health.isConfigured ? "YES" : "NO"}`);
  console.log(`Connected       : ${health.isConnected ? "YES" : "NO"}`);

  if (!health.isConnected) {
    console.error(`\n[ERROR] Unable to connect to PostgreSQL: ${health.lastError}`);
    console.log("Please check your DATABASE_URL in .env before executing migrations.\n");
    process.exit(1);
  }

  console.log("\nExecuting schema migrations...");
  const result = await runDatabaseMigrations();

  if (result.success) {
    console.log(`[SUCCESS] ${result.message}`);
    process.exit(0);
  } else {
    console.error(`[FAILURE] ${result.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
