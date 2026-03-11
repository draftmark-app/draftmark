import { nanoid } from "nanoid";
import { prisma } from "./prisma";

export function generateSlug(): string {
  return nanoid(8);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function generateSeoSlug(title: string, nanoidSlug: string): Promise<string> {
  const base = slugify(title);
  if (!base) return nanoidSlug;

  // Try the base slug first
  const existing = await prisma.doc.findUnique({
    where: { seoSlug: base },
    select: { slug: true },
  });

  if (!existing || existing.slug === nanoidSlug) return base;

  // Collision — append first 4 chars of nanoid
  const suffixed = `${base}-${nanoidSlug.slice(0, 4).toLowerCase()}`;
  const existing2 = await prisma.doc.findUnique({
    where: { seoSlug: suffixed },
    select: { slug: true },
  });

  if (!existing2 || existing2.slug === nanoidSlug) return suffixed;

  // Extremely unlikely — use full nanoid
  return `${base}-${nanoidSlug.toLowerCase()}`;
}
