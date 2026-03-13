/**
 * One-off script to generate stakeholder views for existing docs.
 *
 * Usage (production):
 *   npx tsx scripts/generate-views.ts
 *
 * Requires OPENROUTER_API_KEY and DATABASE_URL in environment.
 * Skips docs that already have views in meta.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { generateStakeholderViews } from "@/lib/openrouter";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const docs = await prisma.doc.findMany({
    select: { slug: true, title: true, content: true, meta: true },
  });

  console.log(`Found ${docs.length} docs`);

  let generated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const meta = doc.meta as Record<string, unknown> | null;
    if (meta?.views) {
      console.log(`  [skip] ${doc.slug} — already has views`);
      skipped++;
      continue;
    }

    console.log(`  [gen]  ${doc.slug} — "${doc.title || "Untitled"}"...`);

    try {
      const views = await generateStakeholderViews(doc.content, doc.title);
      if (!views) {
        console.log(`         ⚠ no views generated`);
        continue;
      }

      const existingMeta = meta ?? {};
      await prisma.doc.update({
        where: { slug: doc.slug },
        data: { meta: { ...existingMeta, views } },
      });

      const viewTypes = Object.keys(views).join(", ");
      console.log(`         ✓ ${viewTypes}`);
      generated++;

      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`         ✗ error:`, err);
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
