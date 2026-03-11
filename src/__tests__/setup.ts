import { beforeAll, afterAll, beforeEach } from "vitest";

let prisma: Awaited<ReturnType<typeof getPrisma>>;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

beforeAll(async () => {
  prisma = await getPrisma();
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.collectionDoc.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.docVersion.deleteMany();
  await prisma.doc.deleteMany();
  await prisma.accountApiKey.deleteMany();
  await prisma.loginToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.collectionDoc.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.docVersion.deleteMany();
  await prisma.doc.deleteMany();
  await prisma.accountApiKey.deleteMany();
  await prisma.loginToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
