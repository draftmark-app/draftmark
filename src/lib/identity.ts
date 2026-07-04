import { NextRequest } from "next/server";
import { hashToken } from "./tokens";

/**
 * Best-effort client IP, trusting the proxies we actually run behind.
 * In production, traffic arrives via Cloudflare (which sets and overwrites
 * `cf-connecting-ip`, so it can't be spoofed) then kamal-proxy (which forwards
 * `x-forwarded-for`). Falls back to a constant when no proxy header is present
 * (e.g. local dev), which collapses such requests to a single identity.
 */
export function getClientIp(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xr = request.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

/**
 * Server-derived dedup identity for anonymous feedback (reactions/reviews).
 *
 * The client-supplied `identifier` must NOT be trusted: it lives in
 * localStorage, so anyone can clear it (or POST directly) to mint unlimited
 * fresh identities, inflating counts and flipping `review_complete`. We derive
 * the dedup key from the request origin (IP + User-Agent) instead, keyed with
 * a server secret so the stored value is opaque and can't be pre-computed to
 * occupy another visitor's slot.
 *
 * Tradeoff: visitors sharing an IP + browser (office NAT) collapse to one
 * identity. Acceptable for a lightweight, account-less feedback signal.
 */
export function feedbackIdentity(request: NextRequest): string {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const secret = process.env.JWT_SECRET ?? "";
  return "anon:" + hashToken(`${ip}|${ua}|${secret}`);
}
