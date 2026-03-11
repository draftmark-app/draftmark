import { randomBytes, createHash } from "crypto";

export function generateToken(prefix: string): string {
  const raw = randomBytes(32).toString("base64url");
  return `${prefix}_${raw}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
