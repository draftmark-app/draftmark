-- Indexes backing the hot read paths: dashboard doc lists (userId + updatedAt),
-- the public explore feed (visibility + createdAt), latest-version lookups, and
-- the comment feed (per-doc, optionally filtered by status).
CREATE INDEX "docs_user_id_updated_at_idx" ON "docs"("user_id", "updated_at");
CREATE INDEX "docs_visibility_created_at_idx" ON "docs"("visibility", "created_at");
CREATE INDEX "doc_versions_doc_id_version_number_idx" ON "doc_versions"("doc_id", "version_number");
CREATE INDEX "comments_doc_id_created_at_idx" ON "comments"("doc_id", "created_at");
CREATE INDEX "comments_doc_id_status_idx" ON "comments"("doc_id", "status");
