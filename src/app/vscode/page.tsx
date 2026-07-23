import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

const MARKETPLACE =
  "https://marketplace.visualstudio.com/items?itemName=draftmark-app.draftmark";
const OPEN_VSX = "https://open-vsx.org/extension/draftmark-app/draftmark";
const REPO = "https://github.com/draftmark-app/vscode";

export const metadata = {
  title: "Draftmark for VS Code",
  description:
    "Share Markdown for human + agent review, right from VS Code. Publish a local .md to Draftmark, then read and answer reviewer comments as native VS Code comment threads — without leaving your editor. Works in VS Code and its forks (Cursor, Windsurf, VSCodium).",
  openGraph: {
    title: "Draftmark for VS Code — review Markdown in your editor",
    description:
      "Publish a local .md to Draftmark and read reviewer comments as native VS Code comment threads. Human + agent. Works in Cursor, Windsurf, and VSCodium too.",
  },
};

export default function VscodePage() {
  return (
    <>
      <Nav />

      <section className="agents-hero">
        <div className="agents-hero-left">
          <div className="tag">vs code extension</div>
          <h1>
            Review Markdown
            <br />
            without leaving
            <br />
            your <em>editor</em>.
          </h1>
          <p className="hero-desc">
            Publish a local <code>.md</code> to Draftmark, then read and answer
            reviewer comments as native VS Code comment threads — for human{" "}
            <strong>+ agent</strong> collaboration, without leaving your editor.
            Runs in VS Code and its forks (Cursor, Windsurf, VSCodium). Built on
            the same <Link href="/cli">dm CLI</Link> mapping file.
          </p>
          <div className="hero-actions">
            <a
              href={MARKETPLACE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              install from marketplace
            </a>
            <a
              href={OPEN_VSX}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              get it on Open VSX &rarr;
            </a>
          </div>
        </div>
        <div className="agents-hero-right">
          <div className="code-block">
            <span className="code-comment"># install from the CLI</span>
            <br />
            <span className="code-method">$</span> code --install-extension{" "}
            <span className="code-url">draftmark-app.draftmark</span>
            <br />
            <br />
            <span className="code-comment"># then, in the editor</span>
            <br />
            <span className="code-key">&rsaquo;</span> Draftmark: Share Current
            File
            <br />
            <span className="code-string">
              &#10003; Shared to draftmark.app/share/a1b2c3d4
            </span>
            <br />
            <span className="code-comment">
              &nbsp;&nbsp;☁ Draftmark — status bar
            </span>
            <br />
            <br />
            <span className="code-comment"># reviewer comments, inline</span>
            <br />
            <span className="code-string">
              &#128172; Line 42 &middot; alice: needs a rollback plan
            </span>
            <br />
            <span className="code-string">
              &#129302; Line 8 &middot; review-agent: covered in tests
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="agents-section">
        <div className="agents-section-label">// how it works</div>
        <div className="agents-steps">
          <div className="agents-step">
            <div className="step-num">00</div>
            <h3>Install &amp; sign in</h3>
            <p>
              Grab it from the Marketplace or Open VSX (or{" "}
              <code>code --install-extension draftmark-app.draftmark</code>).
              Run <code>Draftmark: Sign In</code> with your{" "}
              <code>acct_</code> key — stored in VS Code SecretStorage, never in
              a tracked file.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> code --install-extension{" "}
              <span className="code-url">draftmark-app.draftmark</span>
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">01</div>
            <h3>Share the file</h3>
            <p>
              With a Markdown file open, run{" "}
              <code>Draftmark: Share Current File</code>. It creates a doc,
              writes a <code>.draftmark.json</code> mapping (shared with the{" "}
              <Link href="/cli">
                <code>dm</code> CLI
              </Link>
              ), and drops a <code>☁ Draftmark</code> indicator in the status
              bar.
            </p>
            <div className="agents-code">
              <span className="code-key">&rsaquo;</span> Draftmark: Share Current
              File
              <br />
              <span className="code-string">
                &#10003; draftmark.app/share/a1b2c3d4
              </span>
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">02</div>
            <h3>Humans &amp; agents review</h3>
            <p>
              Reviewers comment in the browser or via the API — general or
              anchored to specific lines. Agents leave line-anchored feedback
              with an <code>[agent]</code> badge. Review is asynchronous; you
              just keep editing.
            </p>
            <div className="agents-code">
              <span className="code-comment">
                # draftmark.app/share/a1b2c3d4
              </span>
              <br />
              alice: section 3 needs a rollback plan
              <br />
              review-agent &#129302;: covered in tests
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">03</div>
            <h3>Read &amp; answer inline</h3>
            <p>
              Comments render as native VS Code comment threads on their
              anchored lines. Reply, resolve, dismiss, and reopen in place —
              agent authors get a <code>&#129302;</code> badge. Background
              polling toasts you about new activity.
            </p>
            <div className="agents-code">
              <span className="code-string">
                &#128172; Line 42 &middot; Reply &middot; Resolve
              </span>
              <br />
              <span className="code-comment"># poll:</span> Draftmark: 1 new
              comment
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES */}
      <section className="agents-section">
        <div className="agents-section-label">// what it does</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#128172;]</div>
            <h3>Inline comments</h3>
            <p>
              Reviewer comments render as native VS Code comment threads on
              their lines. Reply, resolve, dismiss, and reopen without leaving
              the editor.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8981;]</div>
            <h3>Anchor-drift reconciliation</h3>
            <p>
              When the file diverges from the reviewed version, comments
              re-anchor by a <em>unique</em> snippet match — anything ambiguous
              goes to a <strong>Detached Comments</strong> panel instead of onto
              a wrong line.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#129302;]</div>
            <h3>Agent badge</h3>
            <p>
              Comments authored by an agent carry a visible{" "}
              <code>&#129302;</code> badge, so human and machine feedback stay
              distinguishable at a glance.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8635;]</div>
            <h3>Polling &amp; notifications</h3>
            <p>
              Optional background polling toasts you about new comments and
              reviews across your shared docs — and it stays quiet about your
              own activity.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[dm]</div>
            <h3>Shared with the CLI</h3>
            <p>
              The <code>.draftmark.json</code> mapping is the same one the{" "}
              <Link href="/cli">
                <code>dm</code> CLI
              </Link>{" "}
              writes — share from the editor, script from the terminal, no
              conflict.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8593;]</div>
            <h3>Publish updates</h3>
            <p>
              <code>Draftmark: Publish Update</code> pushes local edits as a new
              version — and no-ops if nothing changed.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Works in the forks</h3>
            <p>
              Ships on the VS Code Marketplace <em>and</em> Open VSX, so it
              installs cleanly in Cursor, Windsurf, and VSCodium too.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128274;]</div>
            <h3>Keys stay safe</h3>
            <p>
              Your account key lives in VS Code SecretStorage; the{" "}
              <code>.draftmark.json</code> mapping holds only non-secret{" "}
              <code>slug</code>/<code>url</code> — safe to commit.
            </p>
          </div>
        </div>
      </section>

      {/* INSTALL */}
      <section className="agents-section">
        <div className="agents-section-label">// install</div>
        <div className="agents-example">
          <div className="agents-example-step">
            <div className="agents-example-label">vs code</div>
            <div className="agents-code">
              <span className="code-method">$</span> code --install-extension
              draftmark-app.draftmark
              <br />
              <span className="code-comment">
                # or search &quot;Draftmark&quot; in the Extensions panel
              </span>
            </div>
          </div>
          <div className="agents-example-divider">
            <span>or, in a fork (Cursor / Windsurf / VSCodium)</span>
          </div>
          <div className="agents-example-step">
            <div className="agents-example-label">open vsx</div>
            <div className="agents-code">
              <span className="code-method">$</span> ovsx get
              draftmark-app.draftmark
              <br />
              <span className="code-comment">
                # or search &quot;Draftmark&quot; in the Extensions panel
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="agents-cta">
        <h2>
          Your editor.
          <br />
          <em>The whole review layer.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a
            href={MARKETPLACE}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            install from marketplace
          </a>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            source on GitHub &rarr;
          </a>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
