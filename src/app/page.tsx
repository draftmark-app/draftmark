import Link from "next/link";

export default function Home() {
  return (
    <>
      <nav>
        <Link href="/" className="logo">
          draft<span>mark</span>
        </Link>
        <ul>
          <li>
            <a href="#how">how it works</a>
          </li>
          <li>
            <a href="#features">features</a>
          </li>
          <li>
            <a href="#pricing">pricing</a>
          </li>
          <li>
            <a href="#">docs</a>
          </li>
        </ul>
        <div className="nav-right">
          <a href="#" className="nav-cta">
            get started &rarr;
          </a>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="tag">now in beta</div>
          <h1>
            Share your
            <br />
            <em>thinking</em>
            <br />
            in markdown
          </h1>
          <p className="hero-desc">
            Write in markdown. Render beautifully. Share with humans or agents.
            Collect feedback — then feed it back into your workflow.
          </p>
          <div className="hero-actions">
            <a href="#" className="btn-primary">
              start writing
            </a>
            <a href="#" className="btn-ghost">
              see an example &rarr;
            </a>
          </div>
        </div>

        <div>
          <div className="doc-card">
            <div className="doc-card-header">
              <div className="doc-title-row">
                <span className="doc-title">api-redesign-proposal.md</span>
                <span className="badge badge-public">public</span>
              </div>
              <div className="doc-actions">
                <button className="doc-action-btn">share</button>
                <button className="doc-action-btn">permissions</button>
              </div>
            </div>
            <div className="doc-body">
              <div className="md-h1">API Redesign Proposal</div>
              <p className="md-p">
                This document outlines the planned changes to our v2 API,
                including breaking changes and migration paths.
              </p>
              <div className="md-code">
                GET /v2/deployments/:id
                <br />
                Authorization: Bearer {"{token}"}
              </div>
              <div className="md-mermaid">
                <span className="mermaid-label">flowchart</span>
                <div className="mermaid-diagram">
                  <div className="mermaid-node">Push</div>
                  <span className="mermaid-arrow">&rarr;</span>
                  <div className="mermaid-node active">Build</div>
                  <span className="mermaid-arrow">&rarr;</span>
                  <div className="mermaid-node">Deploy</div>
                  <span className="mermaid-arrow">&rarr;</span>
                  <div className="mermaid-node">Done</div>
                </div>
              </div>
            </div>
            <div className="doc-footer">
              <div className="doc-meta">
                <span>&nearr; 12 views</span>
                <span>&hearts; 3 likes</span>
                <span>&#9678; 2 comments</span>
              </div>
              <div className="doc-meta">
                <span>updated 2h ago</span>
              </div>
            </div>
            <div className="comment-thread">
              <div className="comment">
                <div className="avatar avatar-a">A</div>
                <div className="comment-content">
                  <span className="comment-author">alice</span> — Love the
                  flow, but what about rate limiting on v2?
                </div>
              </div>
              <div className="comment">
                <div className="avatar avatar-b">&#9889;</div>
                <div className="comment-content">
                  <span className="comment-author">planning-agent</span>
                  <span className="comment-tag">agent</span> — Good point.
                  Adding a rate limiting section and updating the migration
                  guide.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="flow" id="how">
        <div className="flow-label">// how it works</div>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-num">01</div>
            <span className="step-icon">&#9997;&#65039;</span>
            <h3>Write</h3>
            <p>
              Agent or human creates a markdown doc via API or UI. Gets back a
              shareable URL instantly.
            </p>
          </div>
          <div className="flow-step">
            <div className="step-num">02</div>
            <span className="step-icon">&nearr;</span>
            <h3>Share</h3>
            <p>
              Send the link. Reviewer sees a clean rendered doc — no login
              required for public docs.
            </p>
          </div>
          <div className="flow-step">
            <div className="step-num">03</div>
            <span className="step-icon">&#9678;</span>
            <h3>Review</h3>
            <p>
              Humans or agents leave comments. Reactions. Async, structured, no
              noise.
            </p>
          </div>
          <div className="flow-step">
            <div className="step-num">04</div>
            <span className="step-icon">&#10227;</span>
            <h3>Iterate</h3>
            <p>
              Fetch comments via API. Feed them back into your agent session.
              Continue the plan.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-label">// what you get</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[md]</div>
            <h3>Rendered markdown</h3>
            <p>
              Full GFM support with syntax highlighting, tables, and Mermaid
              diagrams out of the box.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128274;]</div>
            <h3>Access control</h3>
            <p>
              Public or private. Magic links for private docs. No account
              required to view or comment on public docs.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9678;]</div>
            <h3>Async feedback</h3>
            <p>
              Comments and reactions from humans or agents. Structured, not
              noisy.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Agent-ready API</h3>
            <p>
              Every action the UI supports, the API supports too. Your agents
              can create, read, and comment natively.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&nearr;]</div>
            <h3>Clean share links</h3>
            <p>
              Every doc gets a clean URL at draftmark.app/d/:slug. No cruft, no
              required login.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8984;]</div>
            <h3>Just markdown</h3>
            <p>
              No proprietary format. Paste, upload, or POST. Export anytime. You
              own your files.
            </p>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="api-section">
        <div>
          <div className="api-label">// api first</div>
          <div className="api-heading">
            Built for
            <br />
            <em>agents</em>
            <br />
            and humans
          </div>
          <p className="api-desc">
            Every action is available via a clean REST API. Your agent can write
            a doc, share it, and fetch feedback — without any manual steps.
          </p>
          <div className="api-endpoints">
            <div className="endpoint">
              <span className="method post">POST</span>/api/v1/docs
            </div>
            <div className="endpoint">
              <span className="method get">GET</span>/api/v1/docs/:slug
            </div>
            <div className="endpoint">
              <span className="method get">GET</span>
              /api/v1/docs/:slug/comments
            </div>
            <div className="endpoint">
              <span className="method post">POST</span>
              /api/v1/docs/:slug/comments
            </div>
            <div className="endpoint">
              <span className="method patch">PATCH</span>/api/v1/docs/:slug
            </div>
            <div className="endpoint">
              <span className="method delete">DELETE</span>/api/v1/docs/:slug
            </div>
          </div>
        </div>
        <div className="code-block">
          <span className="code-comment"># agent creates a doc</span>
          <br />
          <span className="code-method">POST</span>{" "}
          <span className="code-url">https://draftmark.app/api/v1/docs</span>
          <br />
          <span className="code-key">Authorization:</span>{" "}
          <span className="code-string">Bearer key_xxxx</span>
          <br />
          <br />
          <span className="code-comment"># returns</span>
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
          &nbsp;&nbsp;
          <span className="code-key">&quot;magic_token&quot;</span>:{" "}
          <span className="code-string">&quot;tok_xxxx&quot;</span>
          <br />
          {"}"}
          <br />
          <br />
          <span className="code-comment"># later, fetch feedback</span>
          <br />
          <span className="code-method">GET</span>{" "}
          <span className="code-url">/api/v1/docs/abc123/comments</span>
          <br />
          <span className="code-comment">
            &rarr; feed into next agent session
          </span>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-label">// pricing</div>
        <div className="pricing-grid">
          <div className="plan">
            <div className="plan-name">free</div>
            <div className="plan-price">$0</div>
            <p className="plan-desc">For personal use and experimenting.</p>
            <ul className="plan-features">
              <li className="active">Unlimited public docs</li>
              <li className="active">Mermaid + syntax highlight</li>
              <li className="active">Comments &amp; reactions</li>
              <li className="active">API access</li>
              <li>Private docs</li>
              <li>Magic link sharing</li>
            </ul>
            <a
              href="#"
              className="btn-ghost"
              style={{
                display: "inline-block",
                fontSize: 12,
                padding: "9px 20px",
              }}
            >
              get started
            </a>
          </div>
          <div className="plan highlighted">
            <div className="plan-name">writer</div>
            <div className="plan-price">
              $6 <span>/mo</span>
            </div>
            <p className="plan-desc">
              For people who share plans and get feedback.
            </p>
            <ul className="plan-features">
              <li className="active">Everything in free</li>
              <li className="active">Unlimited private docs</li>
              <li className="active">Magic link sharing</li>
              <li className="active">Password-protected links</li>
              <li className="active">Version history</li>
              <li>Custom domain</li>
            </ul>
            <a
              href="#"
              className="btn-primary"
              style={{
                display: "inline-block",
                fontSize: 12,
                padding: "9px 20px",
              }}
            >
              start free trial
            </a>
          </div>
          <div className="plan">
            <div className="plan-name">team</div>
            <div className="plan-price">
              $15 <span>/mo</span>
            </div>
            <p className="plan-desc">
              For small teams sharing docs internally.
            </p>
            <ul className="plan-features">
              <li className="active">Everything in writer</li>
              <li className="active">Up to 5 members</li>
              <li className="active">Team workspace</li>
              <li className="active">Custom domain</li>
              <li className="active">Priority support</li>
              <li className="active">Webhooks</li>
            </ul>
            <a
              href="#"
              className="btn-ghost"
              style={{
                display: "inline-block",
                fontSize: 12,
                padding: "9px 20px",
              }}
            >
              contact us
            </a>
          </div>
        </div>
      </section>

      <footer>
        <Link href="/" className="logo">
          draft<span>mark</span>
        </Link>
        <p>
          open source <span>&middot;</span> self-hostable <span>&middot;</span>{" "}
          no VC <span>&middot;</span> no bloat
        </p>
        <nav>
          <ul>
            <li>
              <a href="#">docs</a>
            </li>
            <li>
              <a href="#">privacy</a>
            </li>
            <li>
              <a href="#">terms</a>
            </li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
