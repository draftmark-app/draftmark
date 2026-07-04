import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, __resetRateLimit } from "@/lib/ratelimit";

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimit());

  it("allows requests up to the limit, then blocks", () => {
    const key = "bucket:1.2.3.4";
    expect(rateLimit(key, 3, 60_000, 1000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000, 1000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000, 1000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000, 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks different keys independently", () => {
    expect(rateLimit("bucket:a", 1, 60_000, 1000).ok).toBe(true);
    expect(rateLimit("bucket:a", 1, 60_000, 1000).ok).toBe(false);
    // Different IP in the same bucket is unaffected.
    expect(rateLimit("bucket:b", 1, 60_000, 1000).ok).toBe(true);
  });

  it("resets after the window elapses", () => {
    const key = "bucket:9.9.9.9";
    expect(rateLimit(key, 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit(key, 1, 1000, 1500).ok).toBe(false); // still within window
    expect(rateLimit(key, 1, 1000, 2001).ok).toBe(true); // window elapsed
  });
});
