import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { commentIdentity, feedbackIdentity } from "@/lib/identity";

function req(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://draftmark.app/api/v1/docs/abc/comments", {
    headers,
  });
}

describe("commentIdentity", () => {
  it("uses the account id for authenticated callers", () => {
    const id = commentIdentity(req(), { id: "user_123" });
    expect(id).toBe("acct:user_123");
  });

  it("falls back to the anonymous IP-derived identity when unauthenticated", () => {
    const id = commentIdentity(req({ "cf-connecting-ip": "203.0.113.7" }), null);
    expect(id).toMatch(/^anon:/);
    // Stable for the same IP, so replies to your own comments resolve on return.
    const again = commentIdentity(req({ "cf-connecting-ip": "203.0.113.7" }), null);
    expect(again).toBe(id);
  });

  it("distinguishes different anonymous IPs", () => {
    const a = commentIdentity(req({ "cf-connecting-ip": "203.0.113.7" }), null);
    const b = commentIdentity(req({ "cf-connecting-ip": "198.51.100.2" }), null);
    expect(a).not.toBe(b);
  });

  it("matches feedbackIdentity for the anonymous path (same dedup identity)", () => {
    const r = req({ "cf-connecting-ip": "203.0.113.7" });
    expect(commentIdentity(r, null)).toBe(feedbackIdentity(r));
  });

  it("returns null instead of throwing when the server secret is missing", () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      expect(commentIdentity(req({ "cf-connecting-ip": "203.0.113.7" }), null)).toBeNull();
    } finally {
      process.env.JWT_SECRET = original;
    }
  });
});
