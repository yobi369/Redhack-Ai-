/**
 * Canonical Vercel API entrypoint.
 *
 * The checked-in api/index.js is a generated bundle and can become stale when
 * source-only security fixes are committed without rebuilding it. Route all API
 * traffic through this TypeScript entrypoint so Vercel bundles the current
 * server.ts and its current authentication, readiness, and tenant controls.
 */
import app from "../server";

export default app;
