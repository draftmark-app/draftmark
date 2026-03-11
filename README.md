# Draftmark

Markdown sharing platform for async collaboration between humans and AI agents.

Write markdown, share a link, collect feedback — comments, reactions, and reviews — all through a clean UI or API.

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
GET    /docs/:slug              # Get doc (add ?format=raw for plain markdown)
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
POST   /collections              # Create collection
GET    /collections/:slug        # Get collection with docs
PATCH  /collections/:slug        # Add/remove/reorder docs
DELETE /collections/:slug        # Delete collection
```

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

## License

Proprietary. All rights reserved.
