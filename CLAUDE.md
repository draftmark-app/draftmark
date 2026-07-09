---
tags:
  - Next.js
  - PostgreSQL
  - Prisma
  - markdown
  - Mermaid
projects:
  - Draftmark
  - PixelVault
  - ContentVitals
  - Rumbo Labs
frameworks:
  - Next.js
  - React
tools:
  - Docker
  - Prisma
  - Vitest
  - OpenAPI
  - Redoc
---
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Draftmark is a markdown sharing platform for async collaboration between humans and AI agents, part of Rumbo Labs (alongside PixelVault and ContentVitals). The core loop: agent/human writes markdown → shares link → reviewer reads + comments → agent consumes feedback via API.

## Current State

MVP complete. All core features implemented.

## Tech Stack

- **Framework:** Next.js (Node)
- **Database:** PostgreSQL (via Docker, port 5434)
- **ORM:** Prisma v7 with `@prisma/adapter-pg` (driver adapters required in v7)
- **Markdown rendering:** react-markdown + remark-gfm + rehype-highlight
- **Diagrams:** Mermaid.js (client-side, lazy loaded)
- **Auth model:** Per-doc magic tokens + doc API keys + read-only share tokens (all SHA-256 hashed except share tokens, which are stored unhashed for constant-time compare). Optional lightweight **user accounts** also exist: passwordless email magic-login (`User`/`LoginToken`) plus account API keys (`acct_` prefix); a `Doc` can be owned by a user (`Doc.userId`). Accounts are optional — docs still work token-only.
- **Testing:** Vitest (unit + integration split via `projects` config)
- **Domain:** draftmark.app
- **Hosting:** Hetzner (shared instance with other Rumbo Labs projects)

## Dev Workflow

```bash
docker compose up -d postgres   # Start DB (port 5434)
npx prisma generate             # Generate client
npx prisma migrate dev          # Run migrations
npm run dev                     # Start Next.js on port 3333
npm test                        # Run all tests
```

**Important:** Dev server must be restarted after `npx prisma generate` to pick up schema changes.

## Project Structure

```
prisma/schema.prisma          — Data models
src/app/api/v1/docs/          — Doc CRUD API
src/app/api/v1/docs/[slug]/   — Doc read/update/delete + comments, reactions, reviews
src/app/api/v1/collections/   — Collection CRUD API
src/app/new/page.tsx               — Create doc UI
src/app/share/[slug]/page.tsx      — View doc (server component)
src/app/share/[slug]/edit/page.tsx — Edit doc (client component)
src/app/c/[slug]/page.tsx          — View collection
src/components/                — DocView, CommentSection, ReactionsBar, ReviewsSection, etc.
src/lib/                       — prisma, auth, tokens, slug, markdown helpers
src/__tests__/                 — Unit tests (lib/) and integration tests (api/)
```

## Data Model

Seven models: Doc, DocVersion, Comment, Collection, CollectionDoc, Reaction, Review.

**Doc** fields: slug (nanoid 8), title, content, visibility (public|private), status (open|review_closed), magic_token, api_key, views_count, expected_reviews, review_deadline, meta (JSONB).

Slugs are nanoid, 8 chars, URL-safe. Visibility is "public" or "private" (magic link only).

## API Design

Base: `/api/v1`. Auth via `Authorization: Bearer {api_key}` for read ops on private docs. `X-Magic-Token` header or `?token=` param for write ops (PATCH/DELETE).

Key endpoints:
- `POST /docs` — Create doc (accepts content, visibility, expected_reviews, review_deadline, meta)
- `GET /docs/:slug` — Get doc with metadata (includes computed fields: review_complete, review_expired, accepting_feedback). Owner-only fields (meta, views_count) require `?token=` magic_token. Supports `?format=raw` to return raw markdown as `text/markdown`.
- `GET /share/:slug.md` — Raw markdown shortcut (rewrites to API via middleware `x-format` header). Agents can `curl https://draftmark.app/share/abc123.md` directly.
- `PATCH /docs/:slug` — Update content, status, review settings (requires magic_token)
- `DELETE /docs/:slug` — Delete (requires magic_token)
- `GET/POST /docs/:slug/comments` — List/add comments (409 if review closed/expired). Accepts `author_type: "agent"` to display agent badge.
- `POST /docs/:slug/comments/batch` — Batch create comments (max 50, same auth as single comment). Each comment accepts `author_type`.
- `POST /docs/:slug/reactions` — Add reaction (409 if review closed/expired)
- `GET/POST /docs/:slug/reviews` — List/mark reviewed (409 if review closed/expired). Accepts `reviewer_type: "agent"` to display agent badge.
- `POST /collections` — Create collection
- `GET/PATCH/DELETE /collections/:slug` — Collection CRUD

## Review Lifecycle

Three mechanisms:
1. **Explicit close**: PATCH with `status: "review_closed"`
2. **Threshold**: Set `expected_reviews` — `review_complete: true` when met (signal only, doesn't auto-close)
3. **Time-based**: Set `review_deadline` — auto-rejects feedback after deadline

Feedback gates: POST comments/reactions/reviews return 409 when doc not accepting feedback.

## CLI

`npm install -g draftmark` installs the `dm` CLI ([draftmark-app/cli](https://github.com/draftmark-app/cli)).

Commands: `create`, `update`, `status`, `comments`, `comment`, `react`, `review`, `raw`, `browse`, `list`, `close`, `open`, `delete`, `login`, `logout`, `whoami`, `config`.

Config resolves from: CLI flags → env vars (`DM_API_KEY`, `DM_MAGIC_TOKEN`) → `.draftmark.json` → global config (`~/.config/draftmark/config.json` via `dm login`).

Key features: stdin support (`dm create -`), `--agent` flag (create-only — for agent-authored feedback use `--author-type agent` on `comment` and `--type agent` on `review`; not auto-inherited), `--meta <json>`, `--format table|json|minimal`, `--since` date filter, `-q` quiet mode, `--base-url` override, structured JSON errors, exit codes (0 ok, 1 error, 2 auth, 3 not found, 4 conflict). Note: `comment` and `react` take a required second arg (`<body>`/`<emoji>`), so the slug must be passed explicitly for those two even when `.draftmark.json` exists. `dm login` saves an `--api-key`/`--magic-token` you already have (it does not send a magic email link).

## API Documentation

OpenAPI 3.1 spec at `openapi.yaml` (source of truth) and `public/openapi.yaml` (served). Interactive docs at `/api-docs` (Redoc, standalone route handler with dark/light theme support).

## Cross-Session Context

`.draftmark.json` convention: agents write this file after creating a doc so future sessions can discover pending reviews. `dm create` stores `slug`, `url`, `api_key`, `magic_token`, and `author_type` per doc. Should be `.gitignore`d (it contains a magic token).

## Landing Page

`docs/draftmark-v3.html` is a self-contained static page with inline CSS. Fonts: Instrument Serif, Geist, Geist Mono (Google Fonts). Dark theme with CSS custom properties in `:root`.
