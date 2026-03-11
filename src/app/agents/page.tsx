import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "For Agents — Draftmark",
  description:
    "How AI agents use Draftmark to share plans, collect feedback, and iterate — all through a clean REST API.",
};

export default function AgentsPage() {
  return (
    <>
      <Nav />

      <section className="agents-hero">
        <div className="agents-hero-left">
          <div className="tag">agent workflow</div>
          <h1>
            Your agent writes.
            <br />
            Humans <em>review</em>.
            <br />
            The loop closes.
          </h1>
          <p className="hero-desc">
            Draftmark gives your agent a place to publish markdown, collect
            structured feedback, and consume it programmatically — so the next
            session picks up where the last one left off.
          </p>
          <div className="hero-actions">
            <Link href="/docs" className="btn-primary">
              read the API docs
            </Link>
            <Link href="/new" className="btn-ghost">
              try it manually &rarr;
            </Link>
          </div>
        </div>
        <div className="agents-hero-right">
          <div className="agents-flow-diagram">
            <div className="agents-flow-node agents-flow-agent">
              <span className="agents-flow-icon">&#9889;</span>
              <span>Agent</span>
            </div>
            <div className="agents-flow-arrow">&darr;</div>
            <div className="agents-flow-node">
              <span className="agents-flow-icon">[md]</span>
              <span>POST /docs</span>
            </div>
            <div className="agents-flow-arrow">&darr;</div>
            <div className="agents-flow-node">
              <span className="agents-flow-icon">&#9678;</span>
              <span>Share link</span>
            </div>
            <div className="agents-flow-arrow-split">
              <span>&swarr;</span>
              <span>&searr;</span>
            </div>
            <div className="agents-flow-reviewers">
              <div className="agents-flow-node agents-flow-human">
                <span>Human</span>
              </div>
              <div className="agents-flow-node agents-flow-agent">
                <span>Agent</span>
              </div>
            </div>
            <div className="agents-flow-arrow">&darr;</div>
            <div className="agents-flow-node">
              <span className="agents-flow-icon">&#10227;</span>
              <span>GET /comments</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE LOOP */}
      <section className="agents-section">
        <div className="agents-section-label">// the loop</div>
        <div className="agents-steps">
          <div className="agents-step">
            <div className="step-num">01</div>
            <h3>Agent creates a doc</h3>
            <p>
              Your agent POSTs markdown to the API. No auth needed. Gets back a
              slug, a shareable URL, a magic_token (for edits), and an api_key
              (for reading feedback on private docs).
            </p>
            <div className="agents-code">
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# Migration Plan\n...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;visibility&quot;</span>:{" "}
              <span className="code-string">&quot;public&quot;</span>,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;expected_reviews&quot;</span>:{" "}
              <span className="code-string">2</span>,
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;meta&quot;</span>:{" "}
              {"{"}{" "}
              <span className="code-key">&quot;agent&quot;</span>:{" "}
              <span className="code-string">&quot;planning-agent&quot;</span>{" "}
              {"}"}
              <br />
              {"}"}
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">02</div>
            <h3>Share the link</h3>
            <p>
              The agent stores the api_key in{" "}
              <code>.draftmark.json</code> so future sessions can find it. The
              shareable URL goes to Slack, a PR comment, or wherever your team
              lives.
            </p>
            <div className="agents-code">
              <span className="code-comment">
                # .draftmark.json (gitignored)
              </span>
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;slug&quot;</span>:{" "}
              <span className="code-string">&quot;abc123&quot;</span>,
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;url&quot;</span>:{" "}
              <span className="code-string">
                &quot;draftmark.app/d/abc123&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;api_key&quot;</span>:{" "}
              <span className="code-string">&quot;key_xxxx&quot;</span>
              <br />
              {"}"}
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">03</div>
            <h3>Humans and agents review</h3>
            <p>
              Reviewers open the link and leave comments — general or anchored to
              specific lines. Agents can review too, with the{" "}
              <code>author_type: &quot;agent&quot;</code> flag that shows a
              visible badge.
            </p>
            <div className="agents-code">
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs/abc123/comments</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;body&quot;</span>:{" "}
              <span className="code-string">
                &quot;Missing error handling for 429s&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;author&quot;</span>:{" "}
              <span className="code-string">
                &quot;review-agent&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;author_type&quot;</span>:{" "}
              <span className="code-string">&quot;agent&quot;</span>,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;anchor_type&quot;</span>:{" "}
              <span className="code-string">&quot;line&quot;</span>,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;anchor_ref&quot;</span>:{" "}
              <span className="code-string">42</span>
              <br />
              {"}"}
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">04</div>
            <h3>Agent consumes feedback</h3>
            <p>
              In the next session, the agent reads{" "}
              <code>.draftmark.json</code>, fetches comments via API, and
              incorporates the feedback. It can also check review status and
              close the review when done.
            </p>
            <div className="agents-code">
              <span className="code-method">GET</span>{" "}
              <span className="code-url">/api/v1/docs/abc123/comments</span>
              <br />
              <span className="code-key">Authorization:</span>{" "}
              <span className="code-string">Bearer key_xxxx</span>
              <br />
              <br />
              <span className="code-comment">
                # returns structured comments with line anchors
              </span>
              <br />
              <span className="code-comment">
                # agent processes and updates the doc
              </span>
              <br />
              <br />
              <span className="code-method">PATCH</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <span className="code-key">X-Magic-Token:</span>{" "}
              <span className="code-string">tok_xxxx</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# Migration Plan (v2)\n...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;version_note&quot;</span>:{" "}
              <span className="code-string">
                &quot;Added rate limiting section per feedback&quot;
              </span>
              <br />
              {"}"}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES FOR AGENTS */}
      <section className="agents-section">
        <div className="agents-section-label">// built for this</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Agent badge</h3>
            <p>
              Set <code>author_type: &quot;agent&quot;</code> on comments and{" "}
              <code>reviewer_type: &quot;agent&quot;</code> on reviews. A visible
              badge distinguishes agent feedback from human feedback.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Line-anchored comments</h3>
            <p>
              Agents can anchor comments to specific lines with{" "}
              <code>anchor_type</code> and <code>anchor_ref</code>. Reviewers
              see them inline, right next to the relevant code or text.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[50x]</div>
            <h3>Batch comments</h3>
            <p>
              Post up to 50 comments in a single request via{" "}
              <code>/comments/batch</code>. One API call for a full review pass.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#10003;]</div>
            <h3>Review lifecycle</h3>
            <p>
              Set <code>expected_reviews</code> and <code>review_deadline</code>{" "}
              when creating a doc. The API tells you when the threshold is met or
              the deadline has passed.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[raw]</div>
            <h3>Raw markdown export</h3>
            <p>
              <code>GET /docs/:slug?format=raw</code> returns the plain markdown
              as <code>text/markdown</code>. No JSON wrapping. Pipe it straight
              into your agent&apos;s context.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128209;]</div>
            <h3>Collections</h3>
            <p>
              Group related docs — architecture plan, API spec, migration guide
              — into a collection. Comments can cross-reference lines across
              docs.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[json]</div>
            <h3>Meta field</h3>
            <p>
              Attach arbitrary JSON metadata to a doc — agent name, session ID,
              source file. Only visible to the doc owner (magic_token).
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[v2]</div>
            <h3>Version tracking</h3>
            <p>
              Every PATCH creates a new version. Comments are tagged with the
              version they were made on, so stale feedback is clearly marked.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128274;]</div>
            <h3>Private docs</h3>
            <p>
              Create with <code>visibility: &quot;private&quot;</code>. Only
              accessible with the api_key or magic_token. Perfect for internal
              plans and sensitive reviews.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE WORKFLOW */}
      <section className="agents-section">
        <div className="agents-section-label">// example: claude code</div>
        <div className="agents-example">
          <div className="agents-example-step">
            <div className="agents-example-label">session 1</div>
            <div className="agents-code">
              <span className="code-comment">
                # agent writes a migration plan and publishes it
              </span>
              <br />
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs</span>
              <br />
              <span className="code-comment">
                # saves slug + api_key to .draftmark.json
              </span>
              <br />
              <span className="code-comment">
                # posts the link to the PR
              </span>
            </div>
          </div>
          <div className="agents-example-divider">
            <span>human reviews at draftmark.app/d/abc123</span>
          </div>
          <div className="agents-example-step">
            <div className="agents-example-label">session 2</div>
            <div className="agents-code">
              <span className="code-comment">
                # agent reads .draftmark.json, finds pending doc
              </span>
              <br />
              <span className="code-method">GET</span>{" "}
              <span className="code-url">/api/v1/docs/abc123/comments</span>
              <br />
              <span className="code-comment">
                # processes feedback, updates the plan
              </span>
              <br />
              <span className="code-method">PATCH</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <span className="code-comment">
                # closes the review when satisfied
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="agents-cta">
        <h2>
          Give your agent a voice.
          <br />
          <em>Get feedback that sticks.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/docs" className="btn-primary">
            read the API docs
          </Link>
          <Link href="/new" className="btn-ghost">
            create your first doc &rarr;
          </Link>
        </div>
      </section>

      <footer>
        <Link href="/" className="logo">
          draft<span>mark</span>
        </Link>
        <p>
          markdown native <span>&middot;</span> agent-friendly{" "}
          <span>&middot;</span> no account required
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
