import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Draftmark CLI",
  description:
    "Share markdown, collect feedback, and close reviews without leaving the terminal. The dm CLI wraps the full Draftmark API — stdin, JSON output, agent badges, and shell-friendly exit codes.",
  openGraph: {
    title: "Draftmark CLI — share markdown from your terminal",
    description:
      "npm install -g draftmark. Create docs, push updates, poll for feedback, and close reviews from the shell.",
  },
};

export default function CliPage() {
  return (
    <>
      <Nav />

      <section className="agents-hero">
        <div className="agents-hero-left">
          <div className="tag">command line</div>
          <h1>
            Share markdown.
            <br />
            Collect feedback.
            <br />
            Never leave the <em>shell</em>.
          </h1>
          <p className="hero-desc">
            The <code>dm</code> CLI wraps the full Draftmark API in a handful of
            terminal commands. Pipe a file in, get a share link back, poll for
            comments as JSON, push a revision, and close the review — all
            scriptable, all without a browser. Using a coding agent? The{" "}
            <Link href="/skill">Claude Code skill</Link> drives these same
            commands for you.
          </p>
          <div className="hero-actions">
            <a
              href="https://www.npmjs.com/package/draftmark"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              view on npm
            </a>
            <Link href="/docs" className="btn-ghost">
              read the API docs &rarr;
            </Link>
          </div>
        </div>
        <div className="agents-hero-right">
          <div className="code-block">
            <span className="code-comment"># install globally</span>
            <br />
            <span className="code-method">$</span>{" "}
            <span className="code-url">npm install -g draftmark</span>
            <br />
            <br />
            <span className="code-comment"># save your account key globally</span>
            <br />
            <span className="code-method">$</span> dm login --api-key acct_xxxx
            <br />
            <span className="code-string">&#10003; Credentials saved</span>
            <br />
            <br />
            <span className="code-comment"># publish (stdin works too: cat plan.md | dm create -)</span>
            <br />
            <span className="code-method">$</span> dm create plan.md --agent
            <br />
            <span className="code-string">&#10003; Document created</span>
            <br />
            <span className="code-key">URL:</span>{" "}
            <span className="code-url">draftmark.app/share/a1b2c3d4</span>
            <br />
            <br />
            <span className="code-comment"># poll for feedback, pipe as JSON</span>
            <br />
            <span className="code-method">$</span> dm comments --json | jq
          </div>
        </div>
      </section>

      {/* THE FLOW */}
      <section className="agents-section">
        <div className="agents-section-label">// the flow</div>
        <div className="agents-steps">
          <div className="agents-step">
            <div className="step-num">00</div>
            <h3>Install &amp; log in</h3>
            <p>
              One npm install gives you the <code>dm</code> binary. Grab an
              account key from the dashboard, then <code>dm login --api-key</code>{" "}
              stores it in <code>~/.config/draftmark/config.json</code> — so
              every command is authenticated without exporting anything.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span>{" "}
              <span className="code-url">npm install -g draftmark</span>
              <br />
              <span className="code-method">$</span> dm login --api-key acct_xxxx
              <br />
              <br />
              <span className="code-comment">
                # or skip login: export DM_API_KEY=acct_xxxx
              </span>
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">01</div>
            <h3>Create a doc</h3>
            <p>
              Point <code>dm create</code> at a file, or pipe markdown in with{" "}
              <code>-</code>. Add <code>--agent</code> to stamp an agent badge,{" "}
              <code>--meta</code> to attach JSON, or review settings like{" "}
              <code>--expected-reviews</code>.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> dm create plan.md --agent
              <br />
              <span className="code-comment"># stdin</span>
              <br />
              <span className="code-method">$</span> cat plan.md | dm create -
              <br />
              <br />
              <span className="code-string">&#10003; Document created</span>
              <br />
              <span className="code-key">URL:</span>{" "}
              <span className="code-url">draftmark.app/share/a1b2c3d4</span>
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">02</div>
            <h3>Share the link</h3>
            <p>
              <code>dm create</code> writes a <code>.draftmark.json</code> in the
              working directory so the next command — and the next session —
              knows which doc to target. Drop the URL in Slack or a PR comment.
            </p>
            <div className="agents-code">
              <span className="code-comment"># .draftmark.json (gitignored)</span>
              <br />
              {"{"}
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;slug&quot;</span>:{" "}
              <span className="code-string">&quot;a1b2c3d4&quot;</span>,
              <br />
              &nbsp;&nbsp;<span className="code-key">&quot;api_key&quot;</span>:{" "}
              <span className="code-string">&quot;acct_xxxx&quot;</span>
              <br />
              {"}"}
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">03</div>
            <h3>Collect feedback</h3>
            <p>
              Reviewers comment in the browser, or straight from the terminal
              with <code>dm comment</code>, <code>dm react</code>, and{" "}
              <code>dm review</code>. Poll new comments with{" "}
              <code>dm comments --since</code> and choose your format.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> dm comments --since 2026-07-01
              <br />
              <span className="code-method">$</span> dm comments --format minimal
              <br />
              alice: section 3 needs a rollback plan
              <br />
              bob [agent]: LGTM, ship it
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">04</div>
            <h3>Iterate &amp; close</h3>
            <p>
              Pipe comments as JSON into your own tooling, push a revised file
              with <code>dm update</code>, then <code>dm close</code> when the
              review is done. Every command exits with a meaningful code for
              scripting.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> dm comments --json | jq
              <br />
              <span className="code-method">$</span> dm update revised.md
              <br />
              <span className="code-method">$</span> dm close
              <br />
              <br />
              <span className="code-comment">
                # exit 0 ok · 2 auth · 3 not found · 4 conflict
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BUILT FOR THE TERMINAL */}
      <section className="agents-section">
        <div className="agents-section-label">// built for the terminal</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[|]</div>
            <h3>stdin &amp; pipes</h3>
            <p>
              <code>dm create -</code> reads markdown from stdin, so you can{" "}
              <code>cat</code>, <code>heredoc</code>, or pipe an agent&apos;s
              output straight into a doc. <code>dm raw</code> pipes it back out.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[json]</div>
            <h3>JSON output</h3>
            <p>
              <code>--format json</code> (or <code>table</code> /{" "}
              <code>minimal</code>) on any read command. Pipe comments straight
              into <code>jq</code> or your agent&apos;s context — no scraping.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Agent badge</h3>
            <p>
              <code>--agent</code> marks a doc as agent-authored at create time.
              On feedback, <code>--author-type agent</code> (comments) and{" "}
              <code>--type agent</code> (reviews) render a visible{" "}
              <code>[agent]</code> badge.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[0-4]</div>
            <h3>Scriptable exit codes</h3>
            <p>
              <code>0</code> ok, <code>1</code> error, <code>2</code> auth,{" "}
              <code>3</code> not found, <code>4</code> conflict. Structured JSON
              errors too — branch on results in CI or a shell script.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[cfg]</div>
            <h3>Layered config</h3>
            <p>
              Resolves credentials in order: CLI flags &rarr; env vars (
              <code>DM_API_KEY</code>) &rarr; <code>.draftmark.json</code> &rarr;
              global config from <code>dm login</code>. Sensible defaults, easy
              overrides.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[+]</div>
            <h3>Rich metadata</h3>
            <p>
              <code>--meta &apos;&#123;...&#125;&apos;</code> attaches arbitrary
              JSON, <code>--expected-reviews</code> and{" "}
              <code>--deadline</code> configure the review lifecycle at create
              time.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[-q]</div>
            <h3>Quiet mode</h3>
            <p>
              <code>-q</code> silences everything but the essentials — clean
              output for logs and pipelines. <code>--since</code> filters
              comments by date for incremental polling.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[url]</div>
            <h3>Self-host ready</h3>
            <p>
              <code>--base-url</code> points the CLI at any Draftmark instance.
              Same commands, your own host. <code>dm whoami</code> confirms who
              you&apos;re acting as.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE SESSION */}
      <section className="agents-section">
        <div className="agents-section-label">// example: full loop</div>
        <div className="agents-example">
          <div className="agents-example-step">
            <div className="agents-example-label">setup (once)</div>
            <div className="agents-code">
              <span className="code-method">$</span> npm install -g draftmark
              <br />
              <span className="code-method">$</span> dm login --api-key acct_xxxx
              <br />
              <span className="code-comment">
                # key stored in ~/.config/draftmark
              </span>
            </div>
          </div>
          <div className="agents-example-divider">
            <span>agent or human writes plan.md</span>
          </div>
          <div className="agents-example-step">
            <div className="agents-example-label">publish</div>
            <div className="agents-code">
              <span className="code-method">$</span> dm create plan.md --agent
              --expected-reviews 2
              <br />
              <span className="code-comment">
                # &rarr; URL saved to .draftmark.json, posted to the PR
              </span>
            </div>
          </div>
          <div className="agents-example-divider">
            <span>team reviews at draftmark.app/share/a1b2c3d4</span>
          </div>
          <div className="agents-example-step">
            <div className="agents-example-label">iterate</div>
            <div className="agents-code">
              <span className="code-method">$</span> dm status
              <br />
              <span className="code-comment"># review_complete: true</span>
              <br />
              <span className="code-method">$</span> dm comments --json | jq
              <br />
              <span className="code-method">$</span> dm update revised.md
              <br />
              <span className="code-method">$</span> dm close
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="agents-cta">
        <h2>
          Markdown review,
          <br />
          <em>one command away.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a
            href="https://www.npmjs.com/package/draftmark"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            npm install -g draftmark
          </a>
          <Link href="/skill" className="btn-ghost">
            get the Claude Code skill &rarr;
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
