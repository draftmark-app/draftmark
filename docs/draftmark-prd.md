# Draftmark — Product Requirements Document

**Version:** 0.1 (MVP)  
**Domain:** draftmark.app  
**Status:** Draft  
**Last updated:** March 2026

---

## 1. Overview

Draftmark is an open-source markdown sharing platform designed for async collaboration between humans and AI agents. Write a plan, share a link, collect structured feedback — then feed it back into your workflow.

The core loop:

```
agent/human writes .md → shares link → reviewer reads + comments → agent consumes feedback
```

---

## 2. Problem

Developers and AI agent workflows produce markdown documents (plans, RFCs, proposals, summaries) that need to be shared for review. Current tools fail in different ways:

- **GitHub Gists** — renders MD but has no feedback layer
- **HackMD / CodiMD** — real-time collab focus, clunky sharing/permissions
- **Notion** — overkill, not markdown-native, no API-first approach
- **Pastebin / Slackpaste** — no rendering, no comments, ephemeral

None of these are designed for the **agent → human → agent** handoff pattern.

---

## 3. Goals (MVP)

- A human or agent can create a markdown document via UI or API
- Documents are rendered beautifully (GFM, syntax highlighting, Mermaid diagrams)
- Documents can be public or private
- A shareable link is generated instantly (no login required to view public docs)
- Reviewers can leave comments without signing up
- The document author (or their agent) can fetch comments via API
- Everything is open source and self-hostable

---

## 4. Non-Goals (v1)

- Real-time collaborative editing
- Rich text / WYSIWYG editor
- Teams / workspaces
- Version history
- Custom domains
- Notifications / webhooks (v2)
- ~~Inline / line-anchored comments~~ → moved to v1
- MCP server integration (v2)

---

## 5. Users

### Primary: AI agent workflows
An agent creates a planning document and needs a structured place to park it for human review, then retrieve the feedback to continue its work.

### Secondary: Individual developers / indie hackers
Someone who writes plans, RFCs, or proposals in markdown and wants to share them cleanly without fighting Google Docs or Notion.

---

## 6. Core Features

### 6.1 Document Creation

**Via UI:**
- Paste or type markdown in a textarea
- Click "Create" → get a shareable URL immediately
- No account required to create a public doc

**Via API:**
```
POST /api/v1/docs

{
  "content": "# My Plan\n...",
  "visibility": "public" | "private",
  "title": "optional",
  "version_note": "optional — brief explanation of this version"
}

→ 201 Created
{
  "slug": "abc123",
  "url": "https://draftmark.app/d/abc123",
  "magic_token": "tok_xxxx",
  "api_key": "key_xxxx"
}
```
No auth required to create. The response provides both credentials for future access.

The `GET /docs/:slug` response includes social data so an agent can check status in one call:

```json
{
  "slug": "abc123",
  "title": "API Redesign Proposal",
  "content": "# API Redesign...",
  "visibility": "public",
  "views_count": 42,
  "likes_count": 5,
  "comments_count": 3,
  "reviews": [
    { "reviewer_name": "alice", "reviewed_at": "2026-03-10T14:00:00Z" },
    { "reviewer_name": "bob",   "reviewed_at": "2026-03-10T15:30:00Z" }
  ],
  "created_at": "2026-03-10T10:00:00Z"
}
```

### 6.2 Document Viewing

- Clean rendered view at `/d/:slug`
- Full GitHub Flavored Markdown support
- Syntax highlighting via Rouge / highlight.js
- Mermaid diagram rendering
- No login required for public docs
- Private docs require a magic link or token

### 6.3 Access Control

| Visibility | Who can view |
|---|---|
| `public` | Anyone with the link |
| `private` | Only via magic link (token in URL) |

MVP does not include per-user permissions. Private = magic link only.

### 6.4 Comments

**Two types of comments:**
- **Inline**: Anchored to a line number, displayed next to that line in the UI (like GitHub PR reviews)
- **General**: No anchor, displayed at the bottom of the doc for overall feedback

**Leaving a comment (UI):**
- Click a line → comment box opens anchored to that line (inline)
- General comment box at the bottom of every doc
- Name field (optional, defaults to "anonymous")
- No account required

**Leaving a comment (API):**
```
POST /api/v1/docs/:slug/comments
Authorization: Bearer {api_key}

{
  "body": "This section needs more detail on rate limiting.",
  "author": "reviewer-agent",
  "anchor": { "type": "line", "ref": 42 }
}
```
Omit `anchor` for a general comment.

**Resolving a comment (API):**
```
PATCH /api/v1/docs/:slug/comments/:id
Authorization: Bearer {api_key}

{
  "status": "resolved"
}
```
Status values: `open` (default), `resolved`, `dismissed`.

**Fetching comments (API):**
```
GET /api/v1/docs/:slug/comments
Authorization: Bearer {api_key}

→ 200 OK
{
  "comments": [
    {
      "id": "cmt_xxx",
      "body": "This section needs more detail on rate limiting.",
      "author": "alice",
      "anchor": { "type": "line", "ref": 42 },
      "doc_version": 1,
      "created_at": "2026-03-10T12:00:00Z"
    }
  ]
}
```

### 6.5 Collections

Group related documents together (e.g., an architecture plan + API spec + migration guide).

**Creating a collection (API):**
```
POST /api/v1/collections
Authorization: Bearer {api_key}

{
  "title": "API Redesign",
  "docs": [
    { "slug": "arch-plan", "label": "main" },
    { "slug": "api-spec", "label": "reference" },
    { "slug": "migration-guide", "label": "appendix" }
  ]
}

→ 201 Created
{
  "slug": "col_xyz789",
  "url": "https://draftmark.app/c/xyz789"
}
```

**Collection view (UI):**
- Sidebar or tab navigation listing all docs in the collection
- Each doc shows its own comment counts and review status
- Labels displayed next to doc titles ("main", "reference", "appendix")

**Cross-document references in comments:**
Comments can reference lines in other documents within the same collection:
```
POST /api/v1/docs/:slug/comments
{
  "body": "This contradicts the rate limits defined in the API spec",
  "author": "alice",
  "anchor": { "type": "line", "ref": 42 },
  "cross_ref": { "slug": "api-spec", "line": 15 }
}
```
Cross-references render as clickable links that jump to the exact line in the referenced doc.

### 6.6 Reactions

- Simple emoji reactions on the doc (👍 ✅ 🤔 ❌)
- No account required
- Stored as counts per emoji per doc

---

## 7. Data Model

```ruby
# Doc
slug:string          # nanoid, 8 chars, URL-safe
title:string         # optional, extracted from H1 if blank
content:text         # raw markdown
visibility:string    # "public" | "private"
magic_token:string   # owner management token (hashed)
api_key:string       # for programmatic access (hashed)
views_count:integer  # incremented on each web view
created_at:datetime
updated_at:datetime

# DocVersion (append-only)
doc:references
content:text         # snapshot of the markdown at this version
version_note:string  # optional brief explanation
version_number:integer
created_at:datetime

# Comment
doc:references
body:text
author:string        # optional display name, default "anonymous"
anchor_type:string   # "line" or null (general comment)
anchor_ref:integer   # line number, null for general comments
doc_version:integer  # version of the doc when comment was made
status:string        # "open" (default), "resolved", "dismissed"
cross_ref_slug:string   # optional: slug of referenced doc (within same collection)
cross_ref_line:integer  # optional: line number in referenced doc
created_at:datetime

# Collection
slug:string          # nanoid, URL-safe
title:string
magic_token:string   # owner management token (hashed)
api_key:string       # for programmatic access (hashed)
created_at:datetime

# CollectionDoc (join table)
collection:references
doc:references
position:integer     # ordering within collection
label:string         # optional: "main", "reference", "appendix"

# Reaction
doc:references
emoji:string         # one of: "thumbs_up", "check", "thinking", "cross"
identifier:string    # hashed IP or session token (deduplication, one per emoji per doc)
created_at:datetime

# Review  ("Done reviewing" explicit action)
doc:references
reviewer_name:string # optional display name
created_at:datetime

# Note: one Review per identifier per doc (same deduplication as Like)
```

---

## 8. API Design

### Base URL
```
https://draftmark.app/api/v1
```

### Authentication
- `POST /docs` — no auth required (returns magic_token + api_key)
- `PATCH /docs/:slug`, `DELETE /docs/:slug` — requires `magic_token`
- `GET /docs/:slug` (private) — requires `api_key` header or `magic_token` in URL
- `GET /docs/:slug` (public) — no auth required
- `POST /docs/:slug/comments` (public docs) — no auth required
- `POST /docs/:slug/comments` (private docs) — requires `api_key`
- All other write operations — require `api_key` via `Authorization: Bearer {api_key}`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/docs` | Create a document |
| `GET` | `/docs/:slug` | Get doc (markdown + metadata, includes review status) |
| `PATCH` | `/docs/:slug` | Update content (requires magic_token) |
| `DELETE` | `/docs/:slug` | Delete doc (requires magic_token) |
| `GET` | `/docs/:slug/comments` | List comments (filterable by `?status=open`) |
| `POST` | `/docs/:slug/comments` | Add a comment |
| `PATCH` | `/docs/:slug/comments/:id` | Update comment status (resolve/dismiss) |
| `POST` | `/docs/:slug/reactions` | Add a reaction (emoji) |
| `GET` | `/docs/:slug/reviews` | List who has reviewed |
| `POST` | `/docs/:slug/reviews` | Mark as "done reviewing" |
| `POST` | `/collections` | Create a collection |
| `GET` | `/collections/:slug` | Get collection with all docs and their metadata |
| `PATCH` | `/collections/:slug` | Update collection (add/remove/reorder docs) |
| `DELETE` | `/collections/:slug` | Delete collection (docs remain, only grouping removed) |

---

## 9. Tech Stack

- **Framework:** Next.js (Node)
- **Database:** PostgreSQL
- **Markdown rendering:** react-markdown + rehype-highlight (syntax highlighting)
- **Diagrams:** Mermaid.js (client-side)
- **Auth:** No user accounts in v1. Magic tokens + API keys only
- **Hosting:** Hetzner (shared instance with other Rumbo Labs projects)
---

## 10. Monetization (post-MVP)

| Tier | Price | Limits |
|---|---|---|
| Free | $0 | Unlimited public docs, 10 private docs |
| Writer | $6/mo | Unlimited private docs, password-protected links |
| Team | $15/mo | Up to 5 members, shared workspace, custom domain |

Self-hosters get everything for free. Hosted version sells convenience.

---

## 11. MVP Milestones

### Week 1
- Next.js app scaffold + PostgreSQL setup
- Doc model + slug generation
- Markdown rendering (react-markdown + Mermaid)
- Create via UI (paste textarea)
- Public view at `/d/:slug`

### Week 2
- API: POST /docs, GET /docs/:slug
- Comment model
- Comment box in UI
- API: GET + POST comments

### Week 3
- Private docs + magic links
- API keys (hashed, generated on create)
- Reactions
- Basic landing page (draftmark.app)

### Week 4
- Polish, self-host Docker setup
- README + docs
- Launch on HackerNews / indie communities

---

## 12. Success Metrics (3 months post-launch)

- 100+ docs created
- Using it myself in my own agent workflows
- At least 3 people using it regularly for async feedback

---

## 13. Resolved Questions

- **Anonymous comments & spam prevention**: No email required. Name field is optional (defaults to "anonymous"). Spam prevention via rate limiting by IP + honeypot field. Add Cloudflare Turnstile if spam becomes a problem.
- **Edit history in v1**: Yes — append-only `doc_versions` table storing `{content, updated_at}` snapshots. No diffing UI in v1, just preserve the data.
- **magic_token location**: Both. URL param for human sharing (`/d/:slug?token=tok_xxx`), header for API write operations (PATCH/DELETE).
- **Webhook/polling for reviewer completion**: v2.
- **API key for doc creation**: `POST /docs` requires no auth. The response returns both `magic_token` and `api_key`. Same behavior for UI and API creation.
- **magic_token vs api_key roles**: `magic_token` is the owner credential — used for edit (PATCH), delete (DELETE), and viewing private docs (URL param or entered in UI prompt). `api_key` is for programmatic interaction — reading private docs via API, posting/fetching comments, reviews, likes, managing collections.
- **Comment auth**: Public docs allow comments without any auth (UI and API). Private docs require `api_key` to comment via API.
- **Private doc access without token in URL**: UI shows a token input prompt ("paste your token to view this document"). No content is revealed until a valid magic_token is provided.
- **Line anchoring after edits**: Comments keep their original line number and are tagged with the doc version they were made on. No automatic re-anchoring. Accept that comments may drift after edits.
- **Rate limiting & doc size limits**: Deferred — not in MVP.
- **Collections**: Included in MVP.
