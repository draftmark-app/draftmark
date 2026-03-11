/*
  Warnings:

  - A unique constraint covering the columns `[seo_slug]` on the table `docs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "docs" ADD COLUMN     "seo_slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "docs_seo_slug_key" ON "docs"("seo_slug");
