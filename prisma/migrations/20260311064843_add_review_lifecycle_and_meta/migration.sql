-- AlterTable
ALTER TABLE "docs" ADD COLUMN     "expected_reviews" INTEGER,
ADD COLUMN     "meta" JSONB DEFAULT 'null',
ADD COLUMN     "review_deadline" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open';
