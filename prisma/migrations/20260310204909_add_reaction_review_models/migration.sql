-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL DEFAULT 'anonymous',
    "identifier" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reactions_doc_id_emoji_identifier_key" ON "reactions"("doc_id", "emoji", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_doc_id_identifier_key" ON "reviews"("doc_id", "identifier");

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
