-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "author_type" TEXT NOT NULL DEFAULT 'human';

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "reviewer_type" TEXT NOT NULL DEFAULT 'human';
