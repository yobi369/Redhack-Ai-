// ============================================================================
// REDHACK AI v2.1 - Production Security Utilities & Cryptographic Controls
// ============================================================================

import crypto from "crypto";
import { isIP } from "node:net";

/**
 * Hosting platforms may set VERCEL_ENV independently of NODE_ENV.
 * Treat a Vercel production deployment as production even if NODE_ENV is absent.
 */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV?.toLowerCase() === "production" ||
    process.env.VERCEL_ENV?.toLowerCase() === "production"
  );
}

const INSECURE_PLACEHOLDER_SECRETS = new Set([
  "redhack-production-enterprise-secret-salt-2026",
  "replace-with-cryptographically-secure-random-string-in-production",
  "secret",
  "changeme",
  "123456",
  "password",
]);

let _ephemeralDevelopmentSecret: string | null = null;

/**
 * Returns a cryptographically validated JWT secret.
 * In a production runtime, an explicit, strong secret (>= 32 chars) is strictly enforced.
 * In testing and development, an ephemeral process-bound random key is generated if unset.
 */
export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  const isProduction = isProductionRuntime();

  if (isProduction) {
    if (!envSecret || envSecret.length < 32 || INSECURE_PLACEHOLDER_SECRETS.has(envSecret)) {
      throw new Error(
        "FATAL CONFIGURATION ERROR: In production mode (NODE_ENV=production), JWT_SECRET must be supplied externally via environment variable and must be at least 32 characters long. Insecure or default placeholder secrets are rejected."
      );
    }
    return envSecret;
  }

  if (envSecret && envSecret.length >= 16 && !INSECURE_PLACEHOLDER_SECRETS.has(envSecret)) {
    return envSecret;
  }

  // Ephemeral key for local dev / tests: generated once per process runtime
  if (!_ephemeralDevelopmentSecret) {
    _ephemeralDevelopmentSecret = crypto.randomBytes(32).toString("hex");
  }
  return _ephemeralDevelopmentSecret;
}

/**
 * Rotates the ephemeral secret (used for testing session/token invalidation)
 */
export function rotateDevelopmentSecret(): void {
  _ephemeralDevelopmentSecret = crypto.randomBytes(32).toString("hex");
}

const TOKEN_TTL_SECONDS = 3600 * 8; // 8 hours

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  workspaceId: string;
  permissions: string[];
  exp: number;
  iat: number;
}

/**
 * Production PBKDF2 Password Hashing
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  // Validate the stored representation before deriving or comparing. Invalid or
  // corrupted database values must produce a normal authentication failure.
  if (!/^[a-f0-9]{128}$/i.test(hash) || !/^[a-f0-9]{32}$/i.test(salt)) return false;

  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  const expectedHash = Buffer.from(hash, "hex");
  return expectedHash.length === checkHash.length && crypto.timingSafeEqual(expectedHash, checkHash);
}

/**
 * Cryptographically Signed Tamper-Proof Token
 */
export function signAuthToken(payload: Omit<AuthTokenPayload, "exp" | "iat">): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_SECONDS;
  const fullPayload: AuthTokenPayload = { ...payload, iat, exp };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const secret = getJwtSecret();
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string): { valid: boolean; payload?: AuthTokenPayload; error?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed token structure" };
    }

    const [header, body, signature] = parts;
    const parsedHeader: unknown = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (
      !parsedHeader ||
      typeof parsedHeader !== "object" ||
      (parsedHeader as { alg?: unknown }).alg !== "HS256" ||
      (parsedHeader as { typ?: unknown }).typ !== "JWT"
    ) {
      return { valid: false, error: "Unsupported token header" };
    }

    const secret = getJwtSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    const actualSignatureBytes = Buffer.from(signature);
    const expectedSignatureBytes = Buffer.from(expectedSignature);

    if (
      actualSignatureBytes.length !== expectedSignatureBytes.length ||
      !crypto.timingSafeEqual(actualSignatureBytes, expectedSignatureBytes)
    ) {
      return { valid: false, error: "Invalid signature" };
    }

    const parsedPayload: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
      return { valid: false, error: "Invalid token payload" };
    }
    const payload = parsedPayload as AuthTokenPayload;
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.organizationId !== "string" ||
      typeof payload.workspaceId !== "string" ||
      !Array.isArray(payload.permissions) ||
      !payload.permissions.every((permission) => typeof permission === "string") ||
      !Number.isFinite(payload.exp) ||
      !Number.isFinite(payload.iat)
    ) {
      return { valid: false, error: "Invalid token payload claims" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return { valid: false, error: "Token expired" };
    }
    if (payload.iat > now + 60 || payload.exp <= payload.iat) {
      return { valid: false, error: "Invalid token time claims" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || "Token verification failed" };
  }
}

/**
 * API Key Generation & Hashing (Never store raw API keys)
 */
export function generateApiKey(prefix = "rhk_live"): { rawKey: string; keyHash: string; keyPrefix: string } {
  const entropy = crypto.randomBytes(24).toString("hex");
  const rawKey = `${prefix}_${entropy}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * SSRF URL preflight validator.
 *
 * This is deliberately only a preflight check: a caller performing network I/O
 * must also resolve DNS, reject every non-public resolved address, pin the
 * vetted address for the connection, and repeat validation after redirects.
 * Do not treat this helper alone as a complete SSRF boundary.
 */
export function validateSafeUrl(
  rawUrl: string,
  allowedInternalHosts: string[] = []
): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: "Unsupported protocol. Only HTTP and HTTPS are permitted." };
    }

    if (parsed.username || parsed.password) {
      return { safe: false, reason: "URLs containing embedded credentials are not permitted." };
    }

    // Normalize absolute DNS names and IPv6 URL bracket notation before checks.
    const normalizeHost = (value: string): string => {
      let normalized = value.toLowerCase();
      if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);
      if (normalized.startsWith("[") && normalized.endsWith("]")) {
        normalized = normalized.slice(1, -1);
      }
      return normalized;
    };
    const hostname = normalizeHost(parsed.hostname);
    const hostForIpCheck = hostname;
    const explicitAllow = allowedInternalHosts.some((host) => normalizeHost(host) === hostForIpCheck);

    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      if (!explicitAllow) {
        return {
          safe: false,
          reason: "Local or internal hostnames are blocked by SSRF preflight.",
        };
      }
    }

    const ipVersion = isIP(hostForIpCheck);
    if (ipVersion === 6) {
      // Fail closed for IPv6 literals until the network-fetch layer has a
      // vetted, tested global-unicast classifier and address pinning.
      if (!explicitAllow) {
        return {
          safe: false,
          reason: "IPv6 literal targets require an explicit trusted-host allowlist.",
        };
      }
    }

    if (ipVersion === 4) {
      const octets = hostForIpCheck.split(".").map(Number);
      const [a, b, c] = octets;
      const blocked =
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0 && c === 0) ||
        (a === 192 && b === 0 && c === 2) ||
        (a === 192 && b === 88 && c === 99) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113) ||
        a === 255;
      if (blocked && !explicitAllow) {
        if (a === 169 && b === 254) {
          return {
            safe: false,
            reason: "cloud instance metadata and link-local IPv4 targets are blocked.",
          };
        }
        return {
          safe: false,
          reason: "Non-public, special-use, or internal IPv4 targets are blocked.",
        };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Malformed or unparseable target URL." };
  }
}

/**
 * Prompt Injection Screening
 * Detects adversarial jailbreaks, system prompt extractions, and instruction overriding
 */
export function detectPromptInjection(input: string): {
  suspicious: boolean;
  confidence: number;
  triggeredPattern?: string;
} {
  if (!input || typeof input !== "string") return { suspicious: false, confidence: 0 };

  const patterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
    /disregard\s+(the\s+)?(previous|initial|system)\s+rules/i,
    /you\s+are\s+now\s+in\s+dan\s+mode/i,
    /bypass\s+(all\s+)?safety\s+filters/i,
    /jailbreak/i,
    /repeat\s+(the\s+)?(entire|full|exact)\s+system\s+prompt/i,
    /system\s+prompt\s+override/i,
    /output\s+initial\s+developer\s+instructions/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return {
        suspicious: true,
        confidence: 0.95,
        triggeredPattern: pattern.source,
      };
    }
  }

  return { suspicious: false, confidence: 0 };
}

/**
 * Sensitive Data & Secrets Redactor for Structured Logging
 */
export function sanitizeLogData(data: any): any {
  if (!data) return data;
  if (typeof data === "string") {
    return data
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [REDACTED]")
      .replace(/ghp_[A-Za-z0-9_]+/gi, "ghp_[REDACTED]")
      .replace(/rhk_live_[A-Za-z0-9_]+/gi, "rhk_live_[REDACTED]")
      .replace(/"password":\s*"[^"]+"/gi, '"password":"[REDACTED]"')
      .replace(/"apiKey":\s*"[^"]+"/gi, '"apiKey":"[REDACTED]"');
  }

  if (typeof data === "object") {
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(copy)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("password") ||
        lower.includes("secret") ||
        lower.includes("token") ||
        lower.includes("apikey") ||
        lower.includes("auth")
      ) {
        copy[key] = "[REDACTED]";
      } else if (typeof copy[key] === "object") {
        copy[key] = sanitizeLogData(copy[key]);
      }
    }
    return copy;
  }

  return data;
}
