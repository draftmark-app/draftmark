# Draftmark Build Plan

## Session 1 — Foundation
- [ ] Choose and set up ORM (Prisma or Drizzle) + PostgreSQL connection
- [ ] DB schema: Doc, DocVersion models
- [ ] Slug generation (nanoid, 8 chars, URL-safe)
- [ ] Magic token + API key generation (hashed storage)
- [ ] API: `POST /api/v1/docs` (no auth, returns slug, url, magic_token, api_key)
- [ ] API: `GET /api/v1/docs/:slug` (public: no auth, private: api_key or magic_token)
- [ ] API: `PATCH /api/v1/docs/:slug` (requires magic_token, creates new DocVersion)
- [ ] API: `DELETE /api/v1/docs/:slug` (requires magic_token)
- [ ] UI: Create doc page (textarea, title, visibility toggle, Source/Preview tabs)
- [ ] UI: Doc created success page (show URL, magic_token, api_key)
- [ ] UI: View doc page (react-markdown + rehype-highlight, Source/Preview tabs)
- [ ] UI: Title extraction from first H1 if blank

## Session 2 — Comments
- [ ] DB schema: Comment model
- [ ] API: `POST /api/v1/docs/:slug/comments` (no auth for public, api_key for private)
- [ ] API: `GET /api/v1/docs/:slug/comments` (filterable by `?status=open`)
- [ ] API: `PATCH /api/v1/docs/:slug/comments/:id` (resolve/dismiss, requires api_key)
- [ ] UI: General comments section (bottom of doc)
- [ ] UI: Line numbers on rendered content
- [ ] UI: Inline comment — click line to open comment input
- [ ] UI: Inline comment display (open/resolved states, version tag)
- [ ] UI: Anonymous author (optional name field, defaults to "anonymous")

## Session 3 — Social + Access
- [ ] DB schema: Reaction, Review models
- [ ] API: `POST /api/v1/docs/:slug/reactions` (dedup per emoji per identifier)
- [ ] API: `GET /api/v1/docs/:slug/reviews`
- [ ] API: `POST /api/v1/docs/:slug/reviews` (dedup per identifier)
- [ ] UI: Reactions bar (thumbs_up, check, thinking, cross)
- [ ] UI: Reviews section (reviewer badges, "mark as reviewed" button)
- [ ] UI: Private doc token prompt screen
- [ ] UI: Edit doc page (auth via magic_token, version note, Source/Preview tabs)
- [ ] UI: Delete doc confirmation
- [ ] View count increment on page view

## Session 4 — Collections + Polish
- [ ] DB schema: Collection, CollectionDoc models
- [ ] API: `POST /api/v1/collections`
- [ ] API: `GET /api/v1/collections/:slug`
- [ ] API: `PATCH /api/v1/collections/:slug` (add/remove/reorder docs)
- [ ] API: `DELETE /api/v1/collections/:slug`
- [ ] UI: Collection view (sidebar with doc list, labels, stats)
- [ ] UI: Cross-document reference links in comments
- [ ] Mermaid.js diagram rendering (client-side)
- [ ] Landing page integration (link to create page)
- [ ] Stats bar on doc view (views, comments, reviews counts)
