import Nav from "@/components/Nav";

export const metadata = {
  title: "API Docs — Draftmark",
};

export default function DocsPage() {
  return (
    <>
      <Nav />

      <main className="static-page">
        <h1>API Documentation</h1>

        <section>
          <h2>Base URL</h2>
          <div className="md-code">https://draftmark.app/api/v1</div>
        </section>

        <section>
          <h2>Authentication</h2>
          <p>
            Two credentials are returned when you create a document:
          </p>
          <ul>
            <li>
              <strong>magic_token</strong> — Owner credential for edit (PATCH),
              delete (DELETE), and viewing private docs. Pass via{" "}
              <code>X-Magic-Token</code> header or <code>?token=</code> URL param.
            </li>
            <li>
              <strong>api_key</strong> — Programmatic access for reading private
              docs, posting comments, reactions, and reviews. Pass via{" "}
              <code>Authorization: Bearer {"<api_key>"}</code>.
            </li>
          </ul>
          <p>Public docs can be read without auth. No account required to create docs.</p>
        </section>

        <section>
          <h2>Documents</h2>

          <h3>
            <span className="method post">POST</span> /docs
          </h3>
          <p>Create a new document. Returns the slug, URL, magic token, and API key.</p>
          <div className="md-code">
            {`{
  "content": "# My Plan\\n...",
  "visibility": "public" | "private",
  "title": "optional",
  "expected_reviews": 3,
  "review_deadline": "2026-03-15T18:00:00Z",
  "meta": { "agent": "claude-code", "source_file": "docs/plan.md" }
}`}
          </div>
          <p>
            All fields except <code>content</code> are optional.{" "}
            <code>expected_reviews</code>, <code>review_deadline</code>, and{" "}
            <code>meta</code> support the review lifecycle.
          </p>

          <h3>
            <span className="method get">GET</span> /docs/:slug
          </h3>
          <p>
            Get a document with metadata. Response includes review lifecycle fields:
          </p>
          <div className="md-code">
            {`{
  "slug": "abc12345",
  "status": "open",
  "expected_reviews": 3,
  "review_deadline": "2026-03-15T18:00:00Z",
  "review_complete": true,
  "review_expired": false,
  "accepting_feedback": true,
  "views_count": 42,
  "comments_count": 3,
  "reviews_count": 3,
  "reviews": [...],
  "meta": { "agent": "claude-code" },
  ...
}`}
          </div>
          <p>
            <code>review_complete</code>, <code>review_expired</code>, and{" "}
            <code>accepting_feedback</code> are computed fields (not stored).
          </p>

          <h3>
            <span className="method patch">PATCH</span> /docs/:slug
          </h3>
          <p>
            Update document content, visibility, or review settings. Requires
            the magic token.
          </p>
          <div className="md-code">
            {`{
  "content": "# Updated Plan\\n...",
  "status": "review_closed",
  "expected_reviews": 5,
  "review_deadline": "2026-03-20T18:00:00Z"
}`}
          </div>
          <p>
            Set <code>status</code> to <code>&quot;review_closed&quot;</code> to
            stop accepting feedback.
          </p>

          <h3>
            <span className="method delete">DELETE</span> /docs/:slug
          </h3>
          <p>Delete a document and all its comments, reactions, and reviews. Requires the magic token.</p>
        </section>

        <section>
          <h2>Comments</h2>

          <h3>
            <span className="method get">GET</span> /docs/:slug/comments
          </h3>
          <p>
            List comments on a document. Filter by status with{" "}
            <code>?status=open</code>.
          </p>

          <h3>
            <span className="method post">POST</span> /docs/:slug/comments
          </h3>
          <p>
            Add a comment. Supports inline comments anchored to a line number,
            or general comments. Returns <code>409</code> if the document is no
            longer accepting feedback.
          </p>
          <div className="md-code">
            {`{
  "body": "Needs more detail on rate limiting.",
  "author": "reviewer-agent",
  "anchor_type": "line",
  "anchor_ref": 42
}`}
          </div>
          <p>
            Omit <code>anchor_type</code> and <code>anchor_ref</code> for a
            general comment.
          </p>

          <h3>
            <span className="method patch">PATCH</span>{" "}
            /docs/:slug/comments/:id
          </h3>
          <p>
            Update comment status. Values: <code>open</code>,{" "}
            <code>resolved</code>, <code>dismissed</code>. Requires API key.
          </p>
        </section>

        <section>
          <h2>Reactions</h2>

          <h3>
            <span className="method get">GET</span> /docs/:slug/reactions
          </h3>
          <p>Get reaction counts grouped by emoji.</p>

          <h3>
            <span className="method post">POST</span> /docs/:slug/reactions
          </h3>
          <p>
            Add a reaction. Deduplicated by identifier per emoji per doc.
            Returns <code>409</code> if the document is no longer accepting
            feedback.
          </p>
          <div className="md-code">
            {`{
  "emoji": "thumbs_up" | "check" | "thinking" | "cross",
  "identifier": "unique-user-id"
}`}
          </div>
        </section>

        <section>
          <h2>Reviews</h2>

          <h3>
            <span className="method get">GET</span> /docs/:slug/reviews
          </h3>
          <p>List who has marked the document as reviewed.</p>

          <h3>
            <span className="method post">POST</span> /docs/:slug/reviews
          </h3>
          <p>
            Mark a document as &quot;done reviewing&quot;. Deduplicated by
            identifier. Returns <code>409</code> if the document is no longer
            accepting feedback.
          </p>
          <div className="md-code">
            {`{
  "reviewer_name": "alice",
  "identifier": "unique-user-id"
}`}
          </div>
        </section>

        <section>
          <h2>Collections</h2>

          <h3>
            <span className="method post">POST</span> /collections
          </h3>
          <p>Create a collection grouping related documents together.</p>
          <div className="md-code">
            {`{
  "title": "API Redesign",
  "docs": [
    { "slug": "arch-plan", "label": "main" },
    { "slug": "api-spec", "label": "reference" }
  ]
}`}
          </div>

          <h3>
            <span className="method get">GET</span> /collections/:slug
          </h3>
          <p>Get a collection with all its docs and their metadata.</p>

          <h3>
            <span className="method patch">PATCH</span> /collections/:slug
          </h3>
          <p>Update a collection — add, remove, or reorder docs. Requires magic token.</p>

          <h3>
            <span className="method delete">DELETE</span> /collections/:slug
          </h3>
          <p>Delete a collection. Documents remain, only the grouping is removed.</p>
        </section>

        <section>
          <h2>Review Lifecycle</h2>
          <p>
            Documents have a review lifecycle that controls whether feedback is
            accepted. Three mechanisms:
          </p>
          <ul>
            <li>
              <strong>Explicit close</strong> — PATCH with{" "}
              <code>{`"status": "review_closed"`}</code>
            </li>
            <li>
              <strong>Threshold</strong> — Set <code>expected_reviews</code> on
              creation. <code>review_complete</code> becomes <code>true</code>{" "}
              when met (signal only, does not auto-close).
            </li>
            <li>
              <strong>Time-based</strong> — Set <code>review_deadline</code>.
              After the deadline, feedback is automatically rejected.
            </li>
          </ul>
          <p>
            When a document is not accepting feedback, POST to comments,
            reactions, or reviews returns <code>409 Conflict</code>.
          </p>
        </section>
      </main>
    </>
  );
}
