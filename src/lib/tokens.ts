import { randomBytes, createHash, timingSafeEqual } from "crypto";

export function generateToken(prefix: string): string {
  const raw = randomBytes(32).toString("base64url");
  return `${prefix}_${raw}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time string comparison for secrets that are stored unhashed (e.g. the
 * share token). Both sides are SHA-256'd first so the compared buffers are always
 * 32 bytes — this keeps the comparison constant-time and leaks neither length nor
 * content via early return. Hashed secrets (magic token, API keys) don't need this
 * since their stored form is already a fixed-length digest.
 */
export function safeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function generateMagicToken(): string {
  return generateToken("tok");
}

export function generateApiKey(): string {
  return generateToken("key");
}

export function generateLoginToken(): string {
  return generateToken("login");
}

export function generateAccountApiKey(): string {
  return generateToken("acct");
}

export function generateShareToken(): string {
  return generateToken("share");
}
