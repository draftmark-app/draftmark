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

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

/**
 * Server-derived dedup identity for ANONYMOUS feedback (reactions/reviews).
 *
 * The client-supplied `identifier` must NOT be trusted: it lives in
 * localStorage, so anyone can clear it (or POST directly) to mint unlimited
 * fresh identities, inflating counts and flipping `review_complete`.
 *
 * We key on the client IP only — deliberately NOT User-Agent, which is also
 * client-controlled and would reopen the same spoof (one IP, many UAs → many
 * identities). Keyed with a required server secret so the stored value is
 * opaque and can't be pre-computed to occupy another visitor's slot.
 *
 * Authenticated callers are deduped by their account id at the call site (see
 * the reaction/review routes), which is both stronger and avoids collapsing
 * many agents behind one IP. This anonymous path trades NAT collapse (an
 * office behind one egress IP counts once) for spoof resistance — the right
 * call for an account-less abuse signal.
 */
export function feedbackIdentity(request: NextRequest): string {
  const ip = getClientIp(request);
  return "anon:" + hashToken(`${ip}|${requireSecret()}`);
}
