-- Retract SEO slugs from docs that are already private so they no longer
-- resolve on the public SEO routes (/public/[seoSlug] and its OG image).
-- Forward code clears seo_slug on the public->private transition; this
-- backfills rows that were made private before that change shipped.
UPDATE "docs" SET "seo_slug" = NULL WHERE "visibility" = 'private';
