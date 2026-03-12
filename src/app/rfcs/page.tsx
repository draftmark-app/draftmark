import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "RFCs & Technical Proposals",
  description:
    "Structured async review for RFCs and technical proposals. Deadlines, review tracking, inline comments, and Mermaid diagrams.",
  openGraph: {
    title: "Draftmark for RFCs & Proposals",
    description:
      "Write the proposal. Get the sign-off. Move on.",
  },
};

export default function RfcsPage() {
  return (
    <>
      <Nav />

      <section className="usecase-hero">
        <div>
          <div className="tag">async review</div>
          <h1>
            Write the proposal.
            <br />
            Get the <em>sign-off</em>.
            <br />
            Move on.
          </h1>
          <p className="hero-desc">
            Your proposals deserve better than a Google Doc. Draftmark gives
            engineering teams structured async review with deadlines, review
            tracking, and inline comments — so decisions actually get made.
          </p>
          <div className="hero-actions">
            <Link href="/new" className="btn-primary">
              start an RFC
            </Link>
            <Link href="/docs" className="btn-ghost">
              read the API docs &rarr;
            </Link>
          </div>
        </div>
        <div className="usecase-hero-visual">
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#9998;</span>
            <span>Write RFC</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#9881;</span>
            <span>Configure review</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#8599;</span>
            <span>Share link</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-row">
            <div className="usecase-visual-node highlight-blue">
              <span>Engineer 1</span>
            </div>
            <div className="usecase-visual-node highlight-blue">
              <span>Engineer 2</span>
            </div>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-green">
            <span className="usecase-visual-icon">&#10003;</span>
            <span>review_complete</span>
          </div>
        </div>
      </section>

      {/* THE LOOP */}
      <section className="usecase-section">
        <div className="usecase-section-label">// the loop</div>
        <div className="usecase-steps">
          <div className="usecase-step">
            <div className="step-num">01</div>
            <h3>Write</h3>
            <p>
              Draft your RFC in markdown. Add Mermaid diagrams for architecture,
              code blocks for API examples, tables for comparisons.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">02</div>
            <h3>Configure</h3>
            <p>
              Set <code>expected_reviews</code> and a{" "}
              <code>review_deadline</code>. The API tracks progress and
              auto-rejects feedback after the deadline.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">03</div>
            <h3>Share</h3>
            <p>
              Post the link in your team channel. Reviewers see a clean rendered
              doc with inline commenting — no login needed for public RFCs.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">04</div>
            <h3>Review</h3>
            <p>
              Reviewers leave inline comments on specific lines and mark
              themselves as &ldquo;done reviewing.&rdquo; You can see who has
              reviewed and who hasn&apos;t.
            </p>
          </div>
          <div className="usecase-step" style={{ gridColumn: "1 / -1" }}>
            <div className="step-num">05</div>
            <h3>Resolve</h3>
            <p>
              When <code>review_complete: true</code>, close the review. The
              RFC is now a record of the decision, with all feedback preserved.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="usecase-section">
        <div className="usecase-section-label">// built for proposals</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#10003;]</div>
            <h3>Review lifecycle</h3>
            <p>
              Set <code>expected_reviews</code> and{" "}
              <code>review_deadline</code>. The API tells you when the
              threshold is met or the deadline has passed.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9878;]</div>
            <h3>Mermaid diagrams</h3>
            <p>
              Embed architecture diagrams, sequence diagrams, and flowcharts
              directly in your markdown. Rendered client-side with Mermaid.js.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Inline comments</h3>
            <p>
              Feedback anchored to specific lines. &ldquo;This migration step
              needs a rollback plan&rdquo; — on the exact line, not buried in
              a thread.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128209;]</div>
            <h3>Collections</h3>
            <p>
              Group your RFC with the API spec, migration guide, and ADR into a
              single collection. Cross-reference between docs in comments.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[v2]</div>
            <h3>Version tracking</h3>
            <p>
              Every update creates a new version. See exactly what changed
              between drafts, and which comments apply to which version.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#10004;]</div>
            <h3>Done reviewing</h3>
            <p>
              Reviewers mark themselves done. Check who has reviewed and who
              hasn&apos;t — in the UI or via a single API call.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE WORKFLOW */}
      <section className="usecase-section">
        <div className="usecase-section-label">// example: planning agent creates RFC</div>
        <div className="usecase-example">
          <div className="usecase-example-step">
            <div className="usecase-example-label">agent creates RFC</div>
            <div className="usecase-code">
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# RFC: Database Migration\n\n## Context\n...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;expected_reviews&quot;</span>:{" "}
              <span className="code-string">3</span>,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;review_deadline&quot;</span>:{" "}
              <span className="code-string">&quot;2026-03-19T00:00:00Z&quot;</span>
              <br />
              {"}"}
            </div>
          </div>
          <div className="usecase-example-divider">
            <span>engineers review at draftmark.app/share/abc123</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">check review status</div>
            <div className="usecase-code">
              <span className="code-method">GET</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <br />
              <span className="code-comment">
                # {"→"} review_complete: true, reviews_count: 3
              </span>
            </div>
          </div>
          <div className="usecase-example-divider">
            <span>threshold met — decision made</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">close the review</div>
            <div className="usecase-code">
              <span className="code-method">PATCH</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;status&quot;</span>:{" "}
              <span className="code-string">&quot;review_closed&quot;</span>
              <br />
              {"}"}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Your proposals deserve better
          <br />
          <em>than a Google Doc.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            start an RFC
          </Link>
          <Link href="/docs" className="btn-ghost">
            read the API docs &rarr;
          </Link>
        </div>
      </section>

      <footer>
        <Link href="/" className="logo">
          draft<span>mark</span>
        </Link>
        <p>
          <a href="mailto:hello@draftmark.app" style={{ color: "inherit", textDecoration: "none" }}>hello@draftmark.app</a>
        </p>
        <nav>
          <ul>
            <li>
              <Link href="/docs">docs</Link>
            </li>
            <li>
              <Link href="/about">about</Link>
            </li>
            <li>
              <Link href="/privacy">privacy</Link>
            </li>
            <li>
              <Link href="/terms">terms</Link>
            </li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
