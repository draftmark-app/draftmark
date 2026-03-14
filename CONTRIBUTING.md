# Contributing to Draftmark

Thanks for your interest in contributing! Here's how to get started.

## Development setup

```bash
# Clone the repo
git clone https://github.com/draftmark-app/draftmark.git
cd draftmark

# Start the database
docker compose up -d postgres

# Install dependencies and set up Prisma
npm install
npx prisma generate
npx prisma migrate dev

# Copy env template
cp .env.example .env

# Start dev server (port 3333)
npm run dev
```

**Note:** Restart the dev server after running `npx prisma generate` — Next.js won't pick up schema changes otherwise.

## Running tests

```bash
# Start the test database
docker compose up -d postgres-test

# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests are split into unit tests (no DB) and integration tests (with DB). Integration tests run sequentially to avoid cleanup race conditions.

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and `npm run lint` to verify
5. Open a pull request

## Pull request guidelines

- Keep PRs focused — one feature or fix per PR
- Write a clear description of what changed and why
- Include test coverage for new functionality
- Make sure all tests pass before requesting review

## Project structure

```
prisma/schema.prisma          — Data models
src/app/api/v1/               — API routes
src/app/                      — Next.js pages
src/components/               — React components
src/lib/                      — Shared utilities (auth, db, markdown)
src/__tests__/                — Unit and integration tests
```

## Code style

- TypeScript throughout
- Follow existing patterns in the codebase
- Use Prisma for all database access
- API routes return JSON with consistent error shapes

## Optional services

Some features require external API keys (see `.env.example`):

- **Resend** — email notifications
- **OpenRouter** — AI-powered stakeholder views

These are optional. The app works without them — those features just won't be available.

## Questions?

Open an issue and we'll help you out.
