-- Sets curated SEO meta descriptions on 9 public docs.
--
-- Requires the `meta.seoDescription` support added in src/lib/seo.ts — the
-- public/share routes prefer this value over the auto-generated (truncated)
-- description once it is present.
--
-- SAFE TO REVIEW BEFORE APPLYING: this runs inside a transaction and prints a
-- match report first. Nothing is committed until you type COMMIT. It MERGES the
-- key into existing `meta` (does not overwrite other keys like `agent`/`source_file`).
--
-- Usage (psql against production):
--   \i scripts/seo-descriptions.sql
-- Review the "MATCH REPORT" output, then run COMMIT;  (or ROLLBACK; to abort)
--
-- NOTE on slug #9: the requested URL was
--   /public/perennial-garden-plan-zone 6b-partial-shade
-- which contains a space. A stored seo_slug can never contain a space —
-- src/lib/slug.ts (slugify) collapses whitespace to hyphens — so the reachable
-- form is the hyphenated one below. If that is not the real slug, the scope
-- guard will abort at "found 8" (see below); fix the slug and re-run.

BEGIN;

-- Requested (seo_slug, description) pairs. Dollar-quoted to avoid escaping the
-- apostrophes in "Draftmark's".
CREATE TEMP TABLE _seo_desc (seo_slug text PRIMARY KEY, description text) ON COMMIT DROP;
INSERT INTO _seo_desc (seo_slug, description) VALUES
  ('api-test-draft',
   $desc$A test draft demonstrating Draftmark's API capabilities: creation, markdown support, comments, reactions, and reviews. Created programmatically.$desc$),
  ('q3-2026-portfolio-rebalancing-plan',
   $desc$Q3 2026 portfolio rebalancing plan to adjust asset allocation, focusing on tax-efficient strategies and risk considerations for US equities, international, and fixed income.$desc$),
  ('api-rate-limiting-strategy',
   $desc$Outlines Draftmark's API rate limiting strategy using a token bucket algorithm to ensure fair usage, prevent abuse, and maintain service availability and performance.$desc$),
  ('database-migration-plan-postgres-tidb',
   $desc$Detailed plan for migrating Draftmark's primary PostgreSQL database to TiDB, a distributed SQL database, aimed at improving scalability, performance, and disaster recovery.$desc$),
  ('home-espresso-setup-budget-build',
   $desc$A budget-friendly guide to building a home espresso setup (under $1000), focusing on essential equipment like grinders and manual machines for cafe-quality results.$desc$),
  ('marathon-training-plan-sub-330',
   $desc$16-week training plan to achieve a sub 3:30 marathon time, including easy runs, tempo runs, intervals, long runs, and strength work for consistent runners.$desc$),
  ('passive-house-renovation-1960s-ranch',
   $desc$Plan to transform a 1960s ranch into a Passive House certified dwelling, focusing on superinsulation, air sealing, high-performance windows, and energy efficiency.$desc$),
  ('sourdough-troubleshooting-guide',
   $desc$A comprehensive guide to troubleshooting common problems with sourdough starters and bread baking, offering solutions for activity, smell, mold, hooch, dense crumb, and oven spring.$desc$),
  -- slug #9: hyphen-normalized form (see NOTE above).
  ('perennial-garden-plan-zone-6b-partial-shade',
   $desc$Perennial garden plan for Zone 6b with partial shade, designed for low-maintenance, multi-season interest using layered drifts and a cool color palette.$desc$);

-- MATCH REPORT: which requested slugs exist as public docs?
\echo '=== MATCH REPORT (matched = will be updated) ==='
SELECT s.seo_slug,
       (d.id IS NOT NULL) AS matched,
       d.visibility,
       length(s.description) AS desc_len
FROM _seo_desc s
LEFT JOIN docs d ON d.seo_slug = s.seo_slug
ORDER BY matched DESC, s.seo_slug;

-- SAFETY GUARDS: abort loudly rather than silently mutate an unexpected set of
-- rows. Because this is wrapped in a transaction, a RAISE rolls everything back.
DO $guard$
DECLARE
  matched   int;
  bad_shape int;
BEGIN
  SELECT count(*) INTO matched
  FROM docs d JOIN _seo_desc s ON s.seo_slug = d.seo_slug
  WHERE d.visibility = 'public';

  IF matched <> 9 THEN
    RAISE EXCEPTION
      'Expected 9 matched public docs, found %. Check the match report above (likely the perennial-garden slug). Aborting without changes.', matched;
  END IF;

  -- The `meta || jsonb_build_object(...)` merge only preserves data when meta is
  -- null or an object. An array/scalar meta would be clobbered into a bad shape.
  SELECT count(*) INTO bad_shape
  FROM docs d JOIN _seo_desc s ON s.seo_slug = d.seo_slug
  WHERE d.visibility = 'public'
    AND d.meta IS NOT NULL
    AND jsonb_typeof(d.meta) <> 'object';

  IF bad_shape > 0 THEN
    RAISE EXCEPTION
      '% matched doc(s) have non-object meta; the merge would corrupt them. Aborting.', bad_shape;
  END IF;
END
$guard$;

-- Apply: merge seoDescription into existing meta for matched public docs only.
UPDATE docs d
SET meta = COALESCE(d.meta, '{}'::jsonb)
           || jsonb_build_object('seoDescription', s.description)
FROM _seo_desc s
WHERE d.seo_slug = s.seo_slug
  AND d.visibility = 'public';

\echo '=== POST-UPDATE VERIFICATION ==='
SELECT d.seo_slug, d.meta->>'seoDescription' AS seo_description
FROM docs d
JOIN _seo_desc s ON s.seo_slug = d.seo_slug
ORDER BY d.seo_slug;

-- Review the two reports above.
--   COMMIT;    -- to persist
--   ROLLBACK;  -- to abort (default if the session ends without COMMIT)
