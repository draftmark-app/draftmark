import Nav from "@/components/Nav";
import MarkdownPreview from "@/components/MarkdownPreview";

export const metadata = {
  title: "Example — Draftmark",
  description: "An example document showing Draftmark's markdown rendering capabilities.",
};

const EXAMPLE_CONTENT = `# API Redesign Proposal

This document outlines the planned changes to our v2 API, including breaking changes and migration paths.

## Current State

Our v1 API has served us well, but several pain points have emerged:

- **Inconsistent naming** — some endpoints use camelCase, others snake_case
- **No pagination** — large collections return everything at once
- **Monolithic responses** — no way to request partial data

## Proposed Changes

### 1. Consistent REST conventions

All endpoints will follow REST naming conventions with snake_case:

\`\`\`
GET    /v2/deployments
GET    /v2/deployments/:id
POST   /v2/deployments
PATCH  /v2/deployments/:id
DELETE /v2/deployments/:id
\`\`\`

### 2. Cursor-based pagination

All list endpoints return paginated results:

\`\`\`json
{
  "data": ["..."],
  "cursor": "eyJpZCI6MTIzfQ",
  "has_more": true
}
\`\`\`

### 3. Deployment flow

\`\`\`mermaid
flowchart LR
    Push --> Build --> Test --> Deploy --> Done
\`\`\`

### 4. Authentication

All requests require a Bearer token:

\`\`\`
GET /v2/deployments/:id
Authorization: Bearer {token}
\`\`\`

## Migration Timeline

| Phase | Timeline | Action |
|-------|----------|--------|
| Announce | Week 1 | Publish migration guide |
| Dual-run | Weeks 2-8 | Both v1 and v2 active |
| Deprecate | Week 9 | v1 returns deprecation headers |
| Sunset | Week 12 | v1 returns 410 Gone |

## Open Questions

- Rate limiting strategy for v2?
- Should we version the WebSocket API too?
- How to handle long-running deployments during migration?
`;

export default function ExamplePage() {
  return (
    <>
      <Nav />
      <div className="doc-view">
        <div className="doc-view-header">
          <div className="doc-view-title-row">
            <h1 className="doc-view-title">API Redesign Proposal</h1>
            <span className="badge badge-public">public</span>
          </div>
          <div className="doc-view-meta">
            <span>example document</span>
          </div>
        </div>

        <div className="stats-bar">
          <span>12 views</span>
          <span>2 comments</span>
          <span>1 review</span>
        </div>

        <div className="doc-view-body">
          <MarkdownPreview content={EXAMPLE_CONTENT} />
        </div>
      </div>
    </>
  );
}
