import Nav from "@/components/Nav";

export const metadata = {
  title: "API Redesign Proposal — Draftmark",
};

export default function ExampleDocPage() {
  return (
    <>
      <Nav />

      <main className="doc-view">
        <div className="doc-view-header">
          <div className="doc-view-title-row">
            <h1 className="doc-view-title">API Redesign Proposal</h1>
            <span className="badge badge-public">public</span>
          </div>
          <div className="doc-view-meta">
            <span>api-redesign-proposal.md</span>
            <span>updated 2h ago</span>
          </div>
        </div>

        <article className="doc-view-body">
          <h2>Overview</h2>
          <p>
            This document outlines the planned changes to our v2 API, including
            breaking changes and migration paths. The goal is to simplify the
            developer experience while maintaining backward compatibility where
            possible.
          </p>

          <h2>Current problems</h2>
          <ul>
            <li>Inconsistent naming conventions across endpoints</li>
            <li>No pagination on list endpoints</li>
            <li>Auth tokens don&apos;t support scoped permissions</li>
            <li>Error responses vary in format between services</li>
          </ul>

          <h2>Proposed endpoints</h2>
          <div className="doc-view-code">
            {`GET    /v2/deployments/:id
POST   /v2/deployments
PATCH  /v2/deployments/:id
DELETE /v2/deployments/:id

Authorization: Bearer {token}`}
          </div>

          <h2>Migration flow</h2>
          <div className="doc-view-mermaid">
            <span className="mermaid-label">flowchart</span>
            <div className="mermaid-diagram">
              <div className="mermaid-node">Audit v1 usage</div>
              <span className="mermaid-arrow">&rarr;</span>
              <div className="mermaid-node active">Update clients</div>
              <span className="mermaid-arrow">&rarr;</span>
              <div className="mermaid-node">Run dual-write</div>
              <span className="mermaid-arrow">&rarr;</span>
              <div className="mermaid-node">Cut over</div>
            </div>
          </div>

          <h2>Rate limiting</h2>
          <p>
            All v2 endpoints will enforce rate limits per API key. Default limits
            are 100 requests/minute for read operations and 20 requests/minute
            for write operations. Higher limits available on paid plans.
          </p>
          <div className="doc-view-code">
            {`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1710000000`}
          </div>

          <h2>Timeline</h2>
          <ul>
            <li>
              <strong>Week 1-2:</strong> Finalize endpoint design and error
              format
            </li>
            <li>
              <strong>Week 3-4:</strong> Implement v2 endpoints with dual-write
            </li>
            <li>
              <strong>Week 5-6:</strong> Migration tooling and client SDK updates
            </li>
            <li>
              <strong>Week 7-8:</strong> Deprecation notices and cutover
            </li>
          </ul>

          <h2>Open questions</h2>
          <ul>
            <li>Should we version at the path level or via headers?</li>
            <li>
              Do we need a separate auth service or keep it in the monolith?
            </li>
            <li>What&apos;s the deprecation window for v1?</li>
          </ul>
        </article>

        <div className="doc-view-stats">
          <span>↗ 12 views</span>
          <span>&hearts; 3 likes</span>
          <span>&#9678; 4 comments</span>
          <span>&#10003; 1 review</span>
        </div>

        <section className="doc-view-comments">
          <h3>Comments</h3>

          <div className="doc-view-comment">
            <div className="avatar avatar-a">A</div>
            <div className="doc-view-comment-body">
              <div className="doc-view-comment-header">
                <span className="comment-author">alice</span>
                <span className="doc-view-comment-time">2h ago</span>
              </div>
              <p>
                Love the flow, but what about rate limiting on v2? We had issues
                with abuse on the current API and I want to make sure we address
                that upfront.
              </p>
            </div>
          </div>

          <div className="doc-view-comment">
            <div className="avatar avatar-b">&#9889;</div>
            <div className="doc-view-comment-body">
              <div className="doc-view-comment-header">
                <span className="comment-author">planning-agent</span>
                <span className="comment-tag">agent</span>
                <span className="doc-view-comment-time">1h ago</span>
              </div>
              <p>
                Good point. I&apos;ve added a rate limiting section to the
                proposal with per-key limits (100 req/min read, 20 req/min
                write). Also updating the migration guide to include rate limit
                header documentation.
              </p>
            </div>
          </div>

          <div className="doc-view-comment">
            <div className="avatar avatar-c">M</div>
            <div className="doc-view-comment-body">
              <div className="doc-view-comment-header">
                <span className="comment-author">marcos</span>
                <span className="doc-view-comment-time">45m ago</span>
              </div>
              <p>
                +1 on the rate limiting. Can we also add a section about error
                response format? Right now each service returns errors
                differently and it&apos;s a pain for client SDK maintainers.
              </p>
            </div>
          </div>

          <div className="doc-view-comment doc-view-comment-inline">
            <div className="avatar avatar-d">J</div>
            <div className="doc-view-comment-body">
              <div className="doc-view-comment-header">
                <span className="comment-author">julia</span>
                <span className="doc-view-comment-time">20m ago</span>
                <span className="doc-view-inline-anchor">on &ldquo;Timeline &gt; Week 5-6&rdquo;</span>
              </div>
              <p>
                Two weeks for migration tooling + SDK updates feels tight. Can we
                extend this to 3 weeks or split into separate phases?
              </p>
            </div>
          </div>
        </section>

        <div className="doc-view-cta">
          <p>This is an example of a shared Draftmark document.</p>
          <a href="/" className="btn-primary">
            start writing
          </a>
        </div>
      </main>
    </>
  );
}
