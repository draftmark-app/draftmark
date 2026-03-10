import { describe, it, expect } from "vitest";
import {
  generateMagicToken,
  generateApiKey,
  hashToken,
} from "@/lib/tokens";

describe("generateMagicToken", () => {
  it("starts with tok_ prefix", () => {
    expect(generateMagicToken()).toMatch(/^tok_/);
  });

  it("generates unique tokens", () => {
    const a = generateMagicToken();
    const b = generateMagicToken();
    expect(a).not.toBe(b);
  });
});

describe("generateApiKey", () => {
  it("starts with key_ prefix", () => {
    expect(generateApiKey()).toMatch(/^key_/);
  });
});

describe("hashToken", () => {
  it("returns a 64-char hex string", () => {
    const hash = hashToken("tok_test123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic", () => {
    const a = hashToken("tok_test123");
    const b = hashToken("tok_test123");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = hashToken("tok_aaa");
    const b = hashToken("tok_bbb");
    expect(a).not.toBe(b);
  });
});
