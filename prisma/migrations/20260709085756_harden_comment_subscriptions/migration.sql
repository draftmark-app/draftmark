/*
  Warnings:

  - Added the required column `doc_id` to the `comment_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Made the column `confirm_token` on table `comment_subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "comment_subscriptions" ADD COLUMN     "doc_id" TEXT NOT NULL,
ALTER COLUMN "confirm_token" SET NOT NULL;

-- CreateIndex
CREATE INDEX "comment_subscriptions_email_idx" ON "comment_subscriptions"("email");

-- Partial unique index: at most one *unconfirmed* subscription per (doc, email).
-- Makes the anti-bomb guard atomic — concurrent creates collide (P2002) instead
-- of both slipping past a read-then-write check. Confirmed rows are exempt, so a
-- confirmed subscriber can still start a fresh pending sub after unsubscribing.
CREATE UNIQUE INDEX "comment_subscriptions_pending_doc_email_key"
  ON "comment_subscriptions" ("doc_id", "email")
  WHERE "confirmed_at" IS NULL;
