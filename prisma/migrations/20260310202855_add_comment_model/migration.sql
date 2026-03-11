-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'anonymous',
    "anchor_type" TEXT,
    "anchor_ref" INTEGER,
    "doc_version" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "cross_ref_slug" TEXT,
    "cross_ref_line" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
