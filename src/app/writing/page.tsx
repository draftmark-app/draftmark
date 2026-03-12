import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Writing & Content Review",
  description:
    "Get honest feedback on drafts before publishing. Reactions, inline comments, clean share links, and access control.",
  openGraph: {
    title: "Draftmark for Writers",
    description:
      "Write the draft. Get honest feedback. Publish with confidence.",
  },
};

export default function WritingPage() {
  return (
    <>
      <Nav />

      <section className="usecase-hero">
        <div>
          <div className="tag">writing workflow</div>
          <h1>
            Write the draft.
            <br />
            Get <em>honest</em> feedback.
            <br />
            Publish with confidence.
          </h1>
          <p className="hero-desc">
            Your best writing comes from good feedback. Draftmark gives you a
            clean space to share drafts, collect reactions and inline comments,
            and revise — without the noise of a doc editor.
          </p>
          <div className="hero-actions">
            <Link href="/new" className="btn-primary">
              share a draft
            </Link>
            <Link href="/explore" className="btn-ghost">
              explore public docs &rarr;
            </Link>
          </div>
        </div>
        <div className="usecase-hero-visual">
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#9998;</span>
            <span>Write draft</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#8599;</span>
            <span>Share link</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-row">
            <div className="usecase-visual-node highlight-blue">
              <span>&#128077; React</span>
            </div>
            <div className="usecase-visual-node highlight-blue">
              <span>#42 Comment</span>
            </div>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#10227;</span>
            <span>Revise</span>
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
              Draft your post, essay, or article in markdown. Full GFM support
              with syntax highlighting, tables, and Mermaid diagrams.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">02</div>
            <h3>Share</h3>
            <p>
              Get a clean URL. No login needed to view or comment. Send it to
              your editor, your writing group, or post it publicly.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">03</div>
            <h3>React &amp; Comment</h3>
            <p>
              Readers leave emoji reactions for quick signal. Editors leave
              inline comments anchored to specific lines for detailed feedback.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">04</div>
            <h3>Revise</h3>
            <p>
              Update your draft. Old comments are tagged with their version.
              Close the review when you&apos;re ready to publish.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="usecase-section">
        <div className="usecase-section-label">// built for writers</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[md]</div>
            <h3>Rendered markdown</h3>
            <p>
              Publication-ready preview with full GFM support. Syntax
              highlighting, tables, and Mermaid diagrams — your draft looks
              like the final product.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128077;]</div>
            <h3>Reactions</h3>
            <p>
              Quick emoji reactions on any doc. A lightweight signal — does
              this resonate? — alongside detailed comments.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Inline comments</h3>
            <p>
              Feedback anchored to specific lines. &ldquo;This paragraph
              buries the lede&rdquo; — on the exact paragraph, not lost in a
              thread.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8599;]</div>
            <h3>Clean share links</h3>
            <p>
              Every doc gets a clean URL at draftmark.app/share/:slug. No
              cruft, no required login. Share it anywhere.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128274;]</div>
            <h3>Access control</h3>
            <p>
              Public drafts for open feedback. Private drafts with magic links
              for trusted reviewers. You control who sees what.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128209;]</div>
            <h3>Collections</h3>
            <p>
              Group a blog series, a book chapter and its outline, or related
              articles into a collection. Review them together.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE WORKFLOW */}
      <section className="usecase-section">
        <div className="usecase-section-label">// example: blog post review</div>
        <div className="usecase-example">
          <div className="usecase-example-step">
            <div className="usecase-example-label">writer creates draft</div>
            <div className="usecase-code">
              <span className="code-comment">
                # paste markdown in the editor or POST via API
              </span>
              <br />
              <span className="code-method">POST</span>{" "}
              <span className="code-url">/api/v1/docs</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# Why We Rewrote Our API\n\n...&quot;
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
            <span>editor reviews at draftmark.app/share/abc123</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">editor leaves feedback</div>
            <div className="usecase-code">
              <span className="code-comment">
                # inline comment on line 15
              </span>
              <br />
              <span className="code-comment">
                # &ldquo;This paragraph buries the lede — lead with the result&rdquo;
              </span>
              <br />
              <br />
              <span className="code-comment">
                # reaction: &#128077; on the doc
              </span>
              <br />
              <span className="code-comment">
                # quick signal that the overall direction is good
              </span>
            </div>
          </div>
          <div className="usecase-example-divider">
            <span>writer revises and closes review</span>
          </div>
          <div className="usecase-example-step">
            <div className="usecase-example-label">publish with confidence</div>
            <div className="usecase-code">
              <span className="code-method">PATCH</span>{" "}
              <span className="code-url">/api/v1/docs/abc123</span>
              <br />
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;content&quot;</span>:{" "}
              <span className="code-string">
                &quot;# Why We Rewrote Our API\n\n...&quot;
              </span>
              ,
              <br />
              &nbsp;&nbsp;
              <span className="code-key">&quot;status&quot;</span>:{" "}
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
          Your best writing comes
          <br />
          <em>from good feedback.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            share a draft
          </Link>
          <Link href="/explore" className="btn-ghost">
            explore public docs &rarr;
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
