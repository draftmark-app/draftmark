// Coerce a nullable integer field from untrusted request input. Accepts
// numbers and numeric strings (e.g. "3" from a CLI that stringifies), treats
// null/undefined/"" as absent, and rejects anything non-integer with a message.
// Prevents a bad value (e.g. selection text mistakenly sent in anchor_ref)
// from reaching Prisma and throwing an unhandled 500 — callers return 400.
export function parseNullableInt(
  value: unknown,
  field: string
): { value: number | null } | { error: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) {
    return { error: `${field} must be an integer` };
  }
  return { value: n };
}
