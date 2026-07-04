import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "./identity";

/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * State is a process-local Map, which is the right fit for this app's
 * single-instance (Hetzner) deployment: no extra infra, no per-request DB
 * write. If the app is ever scaled horizontally, this needs to move to a
 * shared store (Postgres/Redis) — counts would otherwise be per-instance.
 * Counters reset on deploy, which is acceptable for abuse mitigation.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/** Pure limiter: returns whether `key` is within `limit` per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  // Opportunistic cleanup so the map can't grow unbounded.
  if (store.size > 10_000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { ok: true };
}

/** Test-only: clear all buckets. */
export function __resetRateLimit() {
  store.clear();
}

/**
 * Enforce a per-IP limit for a named bucket. Returns a 429 NextResponse when
 * exceeded, or null when the request may proceed. Disabled when
 * RATE_LIMIT_DISABLED is set (used by the integration test server).
 */
export function enforceRateLimit(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  // Explicit "1" only — avoids a footgun where RATE_LIMIT_DISABLED="0"/"false"
  // silently turns off a security control.
  if (process.env.RATE_LIMIT_DISABLED === "1") return null;

  const ip = getClientIp(request);
  const result = rateLimit(`${bucket}:${ip}`, limit, windowMs);
  if (result.ok) return null;

  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
  );
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Central place for the per-IP limits, so they're easy to see and tune. */
export const LIMITS = {
  createDoc: { bucket: "create-doc", limit: 30, windowMs: 10 * MINUTE },
  createCollection: { bucket: "create-collection", limit: 30, windowMs: 10 * MINUTE },
  register: { bucket: "register", limit: 5, windowMs: HOUR },
  login: { bucket: "login", limit: 10, windowMs: HOUR },
  comment: { bucket: "comment", limit: 60, windowMs: 10 * MINUTE },
  commentBatch: { bucket: "comment-batch", limit: 20, windowMs: 10 * MINUTE },
  react: { bucket: "react", limit: 100, windowMs: 10 * MINUTE },
  review: { bucket: "review", limit: 60, windowMs: 10 * MINUTE },
} as const;
