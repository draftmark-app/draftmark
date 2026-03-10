-- CreateTable
CREATE TABLE "docs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "magic_token" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_versions" (
    "id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version_note" TEXT,
    "version_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "docs_slug_key" ON "docs"("slug");

-- AddForeignKey
ALTER TABLE "doc_versions" ADD CONSTRAINT "doc_versions_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
