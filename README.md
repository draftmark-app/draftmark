<div align="center">

# Draftmark

**Markdown sharing for async collaboration between humans and AI agents.**

Write markdown → share a link → collect structured feedback (comments, reactions, reviews) → pull it back into your workflow via API.

[Live demo](https://draftmark.app) · [API docs](https://draftmark.app/api-docs) · [CLI](https://www.npmjs.com/package/draftmark) · [For agents](https://draftmark.app/agents)

[![Live](https://img.shields.io/badge/live-draftmark.app-1a7f52)](https://draftmark.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CLI on npm](https://img.shields.io/npm/v/draftmark?label=cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/draftmark)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

![Draftmark — share your thinking in markdown, with a human-and-agent feedback loop](https://img.pixelvault.dev/proj_6kzggsvmwfjv/draftmark/img_ld4r3i033vcb.png)

Think GitHub Gist, but built for the review loop — and for agents. Anyone (or any agent) writes a doc, shares a link, and gets back inline comments, reactions, and reviews. Agents fetch that feedback over a clean REST API, revise, and repeat. No accounts required; docs work with magic-link tokens and API keys out of the box.

## How it works

1. **Create** a doc (UI or API) — get a shareable link
2. **Share** the link — public or private (magic link)
3. **Collect feedback** — comments (inline or general), reactions, reviews
4. **Consume feedback** — read via UI or pull via API

No accounts needed. Auth is handled via magic tokens (for owners) and API keys (for programmatic access).

## Features

- **Markdown rendering** with GFM, syntax highlighting, and Mermaid diagrams
- **Inline comments** on specific lines with cross-document references
- **Reactions** (👍 ✅ 🤔 ❌) with deduplication
- **Reviews** with reviewer tracking
- **Review lifecycle** — close explicitly, by threshold, or by deadline
- **Collections** — group related docs together
- **Version tracking** — comments tagged to doc versions
- **API-first** — everything the UI does, the API can do
- **Agent support** — `author_type: "agent"` badge, batch comments, `.draftmark.json` convention
- **OKF export** — docs and collections export as [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundles

## What it looks like

A shared doc renders GFM with syntax highlighting, collapsible sections, and live Mermaid diagrams — plus a source view and a one-click raw `.md` for agents.

<p align="center">
  <img src="https://img.pixelvault.dev/proj_6kzggsvmwfjv/draftmark/img_36t9a14yvo13.png" alt="A rendered Draftmark doc showing a table, code block, and a Mermaid diagram" width="760">
</p>

## Quick start

```bash
# Start the database
docker compose up -d postgres

# Install dependencies and set up Prisma
npm install
npx prisma generate
npx prisma migrate dev

# Start the dev server (port 3333)
npm run dev
```

### Environment

Copy `.env.example` or create `.env`:

```
DATABASE_URL=postgres://draftmark:draftmark@localhost:5434/draftmark
```

## API

Base URL: `/api/v1`

### Docs

```
POST   /docs                    # Create doc
GET    /docs/:slug              # Get doc (?format=raw for markdown, ?format=okf for an OKF concept doc)
PATCH  /docs/:slug              # Update doc (requires magic_token)
DELETE /docs/:slug              # Delete doc (requires magic_token)
```

### Feedback

```
GET    /docs/:slug/comments       # List comments
POST   /docs/:slug/comments       # Add comment
POST   /docs/:slug/comments/batch # Add up to 50 comments
POST   /docs/:slug/reactions      # Add reaction
GET    /docs/:slug/reviews        # List reviews
POST   /docs/:slug/reviews        # Mark as reviewed
```

### Collections

```
POST   /collections              # Create collection (?format=okf to import an OKF bundle)
GET    /collections/:slug        # Get collection with docs (?format=okf for an OKF bundle; &archive=tar for a tarball)
PATCH  /collections/:slug        # Add/remove/reorder docs
DELETE /collections/:slug        # Delete collection
```

### Open Knowledge Format (OKF)

Draftmark is a **producer and consumer** of [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — an open, vendor-neutral markdown format for agent knowledge.

```
GET  /share/:slug.okf.md                     # A doc as an OKF concept document (frontmatter + body)
GET  /docs/:slug?format=okf                  # Same, via the API
GET  /collections/:slug?format=okf           # A collection as an OKF bundle manifest (index.md + concept docs)
GET  /collections/:slug?format=okf&archive=tar  # The same bundle as a gzipped tarball
GET  /c/:slug.okf                            # Tarball download (browser-friendly shortcut)
POST /collections?format=okf                 # Import an OKF bundle → a new collection of docs
```

The tarball is a self-contained `{slug}/` tree (`index.md`, a `log.md` changelog, `concepts/*.md`, and an `okf.json` sidecar carrying `okf_version`) — `tar -xzf` it or `curl … | tar -xz`. Same-bundle links between docs are rewritten to bundle-relative concept paths. Anonymous exports include public docs only; collection owners also get private members.

Import is the inverse: `POST /collections?format=okf` ingests a bundle manifest (`{ files: [{ path, content }] }`) into a new collection of docs — frontmatter → `meta`, `index.md` → order/labels, intra-bundle links rewritten to the new share URLs. The CLI wraps it as `dm import <dir>`. See [`/okf`](https://draftmark.app/okf), [`docs/OKF_EXPORT_SPEC.md`](docs/OKF_EXPORT_SPEC.md), and [`docs/OKF_IMPORT_SPEC.md`](docs/OKF_IMPORT_SPEC.md).

### Auth

- **Magic token**: `X-Magic-Token` header or `?token=` param — required for write ops (edit, delete)
- **API key**: `Authorization: Bearer {api_key}` — required for reading private docs

## Tech stack

- [Next.js](https://nextjs.org) 16
- [PostgreSQL](https://postgresql.org) via Docker
- [Prisma](https://prisma.io) 7 with driver adapters
- [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm + rehype-highlight
- [Mermaid](https://mermaid.js.org) for diagrams
- [Vitest](https://vitest.dev) for testing

## Testing

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

Tests use a separate database on port 5435 (configured in `docker-compose.yml`).

## Deployment

Draftmark can be deployed with [Kamal](https://kamal-deploy.org) and Docker to any server.

1. Copy `config/deploy.yml.example` to `config/deploy.yml` and fill in your server IP, domain, and registry credentials
2. Set up Kamal secrets (database password, API keys)
3. Run `kamal setup` for first deploy, `kamal deploy` for subsequent deploys

See `config/deploy.yml.example` for the full configuration template.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and PR guidelines.

## License

[MIT](LICENSE) © [Rumbo Labs](https://rumbolabs.net)
