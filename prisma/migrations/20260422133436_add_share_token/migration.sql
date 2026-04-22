/*
  Warnings:

  - A unique constraint covering the columns `[share_token]` on the table `docs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "docs" ADD COLUMN     "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "docs_share_token_key" ON "docs"("share_token");
