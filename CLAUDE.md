# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Draftmark is a markdown sharing platform for async collaboration between humans and AI agents, part of Rumbo Labs (alongside PixelVault and ContentVitals). It may become open-source in the future, but is not yet. The core loop: agent/human writes markdown → shares link → reviewer reads + comments → agent consumes feedback via API.

## Current State

Pre-development. The repo contains:
- `docs/draftmark-prd.md` — Full product requirements document (MVP spec)
- `docs/draftmark-v3.html` — Static landing page mockup (single-file, no build step)

## Planned Tech Stack (from PRD)

- **Framework:** Next.js (Node)
- **Database:** PostgreSQL
- **Markdown rendering:** TBD (e.g. react-markdown + rehype-highlight or similar)
- **Diagrams:** Mermaid.js (client-side)
- **Auth model:** No user accounts in v1. Magic tokens + API keys only (both stored hashed)
- **Domain:** draftmark.app
- **Hosting:** Hetzner (shared instance with other Rumbo Labs projects for now)

## Data Model

Seven models: Doc (slug, title, content, visibility, magic_token, api_key, views_count), DocVersion (doc ref, content snapshot, version_note, version_number), Comment (doc ref, body, author, anchor_type, anchor_ref, doc_version, status, cross_ref_slug, cross_ref_line), Collection (slug, title, magic_token, api_key), CollectionDoc (collection ref, doc ref, position, label), Reaction (doc ref, emoji, identifier for dedup — one per emoji per doc per user), Review (doc ref, reviewer_name, dedup by identifier).

Slugs are nanoid, 8 chars, URL-safe. Visibility is "public" or "private" (magic link only).

## API Design

Base: `/api/v1`. Auth via `Authorization: Bearer {api_key}` for write ops. Public docs readable without auth.

Key endpoints:
- `POST /docs` — Create doc (returns slug, url, magic_token, api_key)
- `GET /docs/:slug` — Get doc with metadata (includes views_count, likes_count, comments_count, reviews)
- `PATCH /docs/:slug` — Update (requires magic_token)
- `DELETE /docs/:slug` — Delete (requires magic_token)
- `GET/POST /docs/:slug/comments` — List/add comments
- `POST /docs/:slug/reactions` — Add a reaction (emoji: thumbs_up, check, thinking, cross)
- `GET/POST /docs/:slug/reviews` — List/mark "done reviewing"

## Landing Page

`draftmark-v3.html` is a self-contained static page with inline CSS. Fonts: Instrument Serif, Geist, Geist Mono (Google Fonts). Dark theme with CSS custom properties in `:root`.
