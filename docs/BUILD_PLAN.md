# Draftmark Build Plan

## Session 1 — Foundation
- [x] Choose and set up ORM (Prisma or Drizzle) + PostgreSQL connection
- [x] DB schema: Doc, DocVersion models
- [x] Slug generation (nanoid, 8 chars, URL-safe)
- [x] Magic token + API key generation (hashed storage)
- [x] API: `POST /api/v1/docs` (no auth, returns slug, url, magic_token, api_key)
- [x] API: `GET /api/v1/docs/:slug` (public: no auth, private: api_key or magic_token)
- [x] API: `PATCH /api/v1/docs/:slug` (requires magic_token, creates new DocVersion)
- [x] API: `DELETE /api/v1/docs/:slug` (requires magic_token)
- [x] UI: Create doc page (textarea, title, visibility toggle, Source/Preview tabs)
- [x] UI: Doc created success page (show URL, magic_token, api_key)
- [x] UI: View doc page (react-markdown + rehype-highlight, Source/Preview tabs)
- [x] UI: Title extraction from first H1 if blank

## Session 2 — Comments
- [x] DB schema: Comment model
- [x] API: `POST /api/v1/docs/:slug/comments` (no auth for public, api_key for private)
- [x] API: `GET /api/v1/docs/:slug/comments` (filterable by `?status=open`)
- [x] API: `PATCH /api/v1/docs/:slug/comments/:id` (resolve/dismiss, requires api_key)
- [x] UI: General comments section (bottom of doc)
- [x] UI: Line numbers on rendered content
- [x] UI: Inline comment — click line to open comment input
- [x] UI: Inline comment display (open/resolved states, version tag)
- [x] UI: Anonymous author (optional name field, defaults to "anonymous")

## Session 3 — Social + Access
- [x] DB schema: Reaction, Review models
- [x] API: `POST /api/v1/docs/:slug/reactions` (dedup per emoji per identifier)
- [x] API: `GET /api/v1/docs/:slug/reviews`
- [x] API: `POST /api/v1/docs/:slug/reviews` (dedup per identifier)
- [x] UI: Reactions bar (thumbs_up, check, thinking, cross)
- [x] UI: Reviews section (reviewer badges, "mark as reviewed" button)
- [x] UI: Private doc token prompt screen
- [x] UI: Edit doc page (auth via magic_token, version note, Source/Preview tabs)
- [x] UI: Delete doc confirmation
- [x] View count increment on page view

## Session 4 — Collections + Polish
- [x] DB schema: Collection, CollectionDoc models
- [x] API: `POST /api/v1/collections`
- [x] API: `GET /api/v1/collections/:slug`
- [x] API: `PATCH /api/v1/collections/:slug` (add/remove/reorder docs)
- [x] API: `DELETE /api/v1/collections/:slug`
- [x] UI: Collection view (sidebar with doc list, labels, stats)
- [x] UI: Cross-document reference links in comments
- [x] Mermaid.js diagram rendering (client-side)
- [x] Landing page integration (link to create page)
- [x] Stats bar on doc view (views, comments, reviews counts)
