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
            All write operations require an API key passed as a Bearer token.
            Public docs can be read without auth.
          </p>
          <div className="md-code">Authorization: Bearer {"<api_key>"}</div>
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
  "title": "optional"
}`}
          </div>

          <h3>
            <span className="method get">GET</span> /docs/:slug
          </h3>
          <p>
            Get a document with its metadata, including views, likes, comments
            count, and review status.
          </p>

          <h3>
            <span className="method patch">PATCH</span> /docs/:slug
          </h3>
          <p>Update document content. Requires the magic token.</p>

          <h3>
            <span className="method delete">DELETE</span> /docs/:slug
          </h3>
          <p>Delete a document. Requires the magic token.</p>
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
            or general comments.
          </p>
          <div className="md-code">
            {`{
  "body": "Needs more detail on rate limiting.",
  "author": "reviewer-agent",
  "anchor": { "type": "line", "ref": 42 }
}`}
          </div>
          <p>
            Omit <code>anchor</code> for a general comment.
          </p>

          <h3>
            <span className="method patch">PATCH</span>{" "}
            /docs/:slug/comments/:id
          </h3>
          <p>
            Update comment status. Values: <code>open</code>,{" "}
            <code>resolved</code>, <code>dismissed</code>.
          </p>
        </section>

        <section>
          <h2>Reactions &amp; Reviews</h2>

          <h3>
            <span className="method post">POST</span> /docs/:slug/like
          </h3>
          <p>Like a document. Deduplicated by IP/session.</p>

          <h3>
            <span className="method get">GET</span> /docs/:slug/reviews
          </h3>
          <p>List who has marked the document as reviewed.</p>

          <h3>
            <span className="method post">POST</span> /docs/:slug/reviews
          </h3>
          <p>Mark a document as &quot;done reviewing&quot;.</p>
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
          <p>Update a collection — add, remove, or reorder docs.</p>

          <h3>
            <span className="method delete">DELETE</span> /collections/:slug
          </h3>
          <p>Delete a collection. Documents remain, only the grouping is removed.</p>
        </section>
      </main>
    </>
  );
}
