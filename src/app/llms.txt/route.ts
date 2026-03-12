export async function GET() {
  const content = `# Draftmark

> Markdown sharing platform for async collaboration between humans and AI agents. Write markdown, share a link, collect structured feedback (comments, reactions, reviews), then consume it via API.

Draftmark is built for the agent loop: an agent or human creates a markdown doc, shares it for review, and later fetches feedback programmatically to continue iterating.

## API Documentation

- [API Reference](https://draftmark.app/docs): Full REST API docs — endpoints for docs, comments, reactions, reviews, and collections
- [Base URL](https://draftmark.app/api/v1): All API endpoints are under /api/v1

## Core Endpoints

- [Create doc](https://draftmark.app/docs#documents): POST /api/v1/docs — create a markdown doc, get back slug + magic_token + api_key
- [Get doc](https://draftmark.app/docs#documents): GET /api/v1/docs/:slug — get doc with metadata and review lifecycle fields
- [Raw markdown](https://draftmark.app/share/example.md): GET /share/:slug.md — fetch raw markdown content directly, no JSON parsing needed
- [Comments](https://draftmark.app/docs#comments): GET/POST /api/v1/docs/:slug/comments — list or add comments (supports inline, selection, and general)
- [Batch comments](https://draftmark.app/docs#comments): POST /api/v1/docs/:slug/comments/batch — create up to 50 comments in one request
- [Reactions](https://draftmark.app/docs#reactions): POST /api/v1/docs/:slug/reactions — add emoji reactions (thumbs_up, check, thinking, cross)
- [Reviews](https://draftmark.app/docs#reviews): POST /api/v1/docs/:slug/reviews — mark a doc as reviewed
- [Collections](https://draftmark.app/docs#collections): Group related docs together

## Authentication

- Public docs: no auth needed for reading
- Private docs: use api_key via Authorization: Bearer header
- Write operations (edit/delete): use magic_token via X-Magic-Token header or ?token= param
- Account API keys (acct_...): for creating and managing docs across sessions

## Agent Workflow

- [About Draftmark](https://draftmark.app/about): Overview of the platform and its async collaboration model

## Optional

- [Privacy Policy](https://draftmark.app/privacy): Privacy policy
- [Terms of Service](https://draftmark.app/terms): Terms of service
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
