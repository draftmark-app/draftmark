import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Prompt Sharing",
  description:
    "Share, review, and iterate on AI prompts — with humans and AI agents. Inline comments, version tracking, and a clean REST API.",
  openGraph: {
    title: "Draftmark for Prompt Sharing",
    description:
      "Share your prompts. Review them together. Ship better.",
  },
};

export default function PromptsPage() {
  return (
    <>
      <Nav />

      <section className="usecase-hero">
        <div>
          <div className="tag">prompt workflow</div>
          <h1>
            Share your prompts.
            <br />
            <em>Review</em> them together.
            <br />
            Ship better.
          </h1>
          <p className="hero-desc">
            Stop pasting prompts in Slack. Draftmark gives your team a place to
            share prompts, leave line-by-line feedback, and iterate — with
            version tracking so nothing gets lost.
          </p>
          <div className="hero-actions">
            <Link href="/new" className="btn-primary">
              share a prompt
            </Link>
            <Link href="/explore" className="btn-ghost">
              explore public prompts &rarr;
            </Link>
          </div>
        </div>
        <div className="usecase-hero-visual">
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#9998;</span>
            <span>Draft prompt</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#8599;</span>
            <span>Share link</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-row">
            <div className="usecase-visual-node highlight-blue">
              <span>Human</span>
            </div>
            <div className="usecase-visual-node highlight-green">
              <span>Agent</span>
            </div>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">#42</span>
            <span>Inline feedback</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">v2</span>
            <span>Iterate</span>
          </div>
        </div>
      </section>

      {/* THE LOOP */}
      <section className="usecase-section">
        <div className="usecase-section-label">// the loop</div>
        <div className="usecase-steps">
          <div className="usecase-step">
            <div className="step-num">01</div>
            <h3>Draft</h3>
            <p>
              Write your system prompt, few-shot examples, or eval criteria in
              markdown. Paste it in the editor or POST it via API.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">02</div>
            <h3>Share</h3>
            <p>
              Get a clean link. Send it to your team, drop it in a PR, or hand
              it to another agent. No login needed to view.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">03</div>
            <h3>Review</h3>
            <p>
              Reviewers leave inline comments anchored to specific lines.
              &ldquo;This instruction is ambiguous&rdquo; — right on line 12.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">04</div>
            <h3>Iterate</h3>
            <p>
              Update the prompt. Old comments are tagged with their version so
              you can see what&apos;s been addressed and what&apos;s still open.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="usecase-section">
        <div className="usecase-section-label">// built for prompt work</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Inline comments</h3>
            <p>
              Anchor feedback to specific lines. &ldquo;This instruction
              contradicts line 8&rdquo; — with a direct reference, not a vague
              description.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[v2]</div>
            <h3>Version tracking</h3>
            <p>
              Every update creates a new version. Comments are tagged with the
              version they were made on, so stale feedback is clearly marked.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128209;]</div>
            <h3>Collections</h3>
            <p>
              Group your system prompt, few-shot examples, and eval criteria
              into a single collection. Review them together.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128274;]</div>
            <h3>Access control</h3>
            <p>
              Public prompts for the community. Private prompts with magic links
              for your team. No account needed to view or comment.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Agent-ready API</h3>
            <p>
              Your agent can POST a prompt, fetch feedback, and update — all
              via REST. The API supports everything the UI does.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[md]</div>
            <h3>Rendered markdown</h3>
            <p>
              Full GFM support with syntax highlighting. Preview and source
              tabs — source view shows line numbers for precise references.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE WORKFLOW */}
      <section className="usecase-section">
        <div className="usecase-section-label">// example: agent prompt iteration</div>
        <div className="usecase-example">
          <div className="usecase-example-step">
            <div className="usecase-example-label">agent posts prompt</div>
            <div className="usecase-code">
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# System Prompt v1\n\nYou are a...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;visibility&quot;</span>:{" "}
              <span className="code-string">&quot;private&quot;</span>
              <br />
              {"}"}
            </div>
          </div>
          <div className="usecase-example-divider">
            <span>team reviews at draftmark.app/share/abc123</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">agent fetches feedback</div>
            <div className="usecase-code">
              <span className="code-method">GET</span>{" "}
              <span className="code-url">/api/v1/docs/abc123/comments</span>
              <br />
              <br />
              <span className="code-comment">
                # [{"{"}body: &quot;Line 5 is too vague&quot;, anchor_ref: 5{"}"}]
              </span>
            </div>
          </div>
          <div className="usecase-example-divider">
            <span>agent incorporates feedback</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">agent posts v2</div>
            <div className="usecase-code">
              <span className="code-method">PATCH</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# System Prompt v2\n\nYou are a...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;version_note&quot;</span>:{" "}
              <span className="code-string">
                &quot;Clarified instructions per team feedback&quot;
              </span>
              <br />
              {"}"}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Stop pasting prompts in Slack.
          <br />
          <em>Start reviewing them properly.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            share a prompt
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
