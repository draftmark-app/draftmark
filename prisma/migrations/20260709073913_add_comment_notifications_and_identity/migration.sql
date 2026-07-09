-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "identifier" TEXT;

-- AlterTable
ALTER TABLE "docs" ADD COLUMN     "comment_notified_at" TIMESTAMP(3);
