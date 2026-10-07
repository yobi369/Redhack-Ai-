// ============================================================================
// REDHACK AI v2.1 - Production Security Utilities & Cryptographic Controls
// ============================================================================

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "redhack-production-enterprise-secret-salt-2026";
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
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
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
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string): { valid: boolean; payload?: AuthTokenPayload; error?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed token structure" };
    }

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    const validSig = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!validSig) {
      return { valid: false, error: "Invalid signature" };
    }

    const payload: AuthTokenPayload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: "Token expired" };
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
 * SSRF Prevention Validator
 * Prohibits SSRF attacks targeting cloud metadata (169.254.169.254), loopback (127.0.0.1), and unauthorized RFC1918 subnets
 */
export function validateSafeUrl(rawUrl: string, allowedInternalHosts: string[] = []): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: "Unsupported protocol. Only HTTP and HTTPS are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check AWS/GCP/Azure link-local metadata address
    if (hostname === "169.254.169.254" || hostname.startsWith("169.254.")) {
      return { safe: false, reason: "Access to cloud instance metadata service (169.254.x.x) is strictly blocked." };
    }

    // Check localhost / loopback
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.startsWith("127.")) {
      if (!allowedInternalHosts.includes(hostname)) {
        return { safe: false, reason: "Access to loopback interface is forbidden." };
      }
    }

    // Check private subnets unless explicitly permitted
    const isPrivate =
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isPrivate && !allowedInternalHosts.includes(hostname)) {
      return { safe: false, reason: "Access to unapproved internal subnet is blocked by SSRF defense." };
    }

    return { safe: true };
  } catch (e: any) {
    return { safe: false, reason: "Malformed or unparseable target URL." };
  }
}

/**
 * Prompt Injection Screening
 * Detects adversarial jailbreaks, system prompt extractions, and instruction overriding
 */
export function detectPromptInjection(input: string): { suspicious: boolean; confidence: number; triggeredPattern?: string } {
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
