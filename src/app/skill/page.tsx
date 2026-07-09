import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

const SKILL_REPO = "https://github.com/draftmark-app/skill";

export const metadata = {
  title: "Draftmark Skill for Claude Code",
  description:
    "A Claude Code agent skill that teaches your coding agent the whole Draftmark review loop — publish a plan, share the link, read feedback, iterate — without spelling out a single API call. Built on the dm CLI.",
  openGraph: {
    title: "Draftmark Skill — teach your agent to ship for review",
    description:
      "One skill. Your agent publishes plans, collects comments, and closes reviews on its own. Built on the dm CLI.",
  },
};

export default function SkillPage() {
  return (
    <>
      <Nav />

      <section className="agents-hero">
        <div className="agents-hero-left">
          <div className="tag">claude code skill</div>
          <h1>
            Teach your agent
            <br />
            to ship for <em>review</em>.
            <br />
            Once.
          </h1>
          <p className="hero-desc">
            The Draftmark skill wraps the <Link href="/cli">dm CLI</Link> so your
            coding agent knows the whole loop — publish a plan, share the link,
            read the feedback, iterate, close the review — without you spelling
            out a single API call. Install it once; it activates on the right
            prompts.
          </p>
          <div className="hero-actions">
            <a
              href={SKILL_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              get the skill on GitHub
            </a>
            <Link href="/cli" className="btn-ghost">
              built on the CLI &rarr;
            </Link>
          </div>
        </div>
        <div className="agents-hero-right">
          <div className="code-block">
            <span className="code-comment"># install the skill</span>
            <br />
            <span className="code-method">$</span> git clone{" "}
            <span className="code-url">github.com/draftmark-app/skill</span>
            <br />
            <span className="code-method">$</span> cp -r skill/draftmark{" "}
            <span className="code-url">~/.claude/skills/draftmark</span>
            <br />
            <br />
            <span className="code-comment"># then, in your agent</span>
            <br />
            <span className="code-key">&rsaquo;</span> share this migration plan
            for review
            <br />
            <span className="code-string">
              &#10003; Published to draftmark.app/share/a1b2c3d4
            </span>
            <br />
            <span className="code-comment">
              &nbsp;&nbsp;(ran: dm create plan.md --agent)
            </span>
            <br />
            <br />
            <span className="code-comment"># next session</span>
            <br />
            <span className="code-key">&rsaquo;</span> any feedback on the plan
            yet?
            <br />
            <span className="code-string">
              &#10003; 3 comments — incorporating now
            </span>
            <br />
            <span className="code-comment">
              &nbsp;&nbsp;(ran: dm comments --json)
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
            <h3>Install once</h3>
            <p>
              Clone the repo and drop the <code>draftmark/</code> folder into{" "}
              <code>~/.claude/skills/</code> (or a project&apos;s{" "}
              <code>.claude/skills/</code>). Restart your agent — the skill is
              discovered automatically. No per-project setup.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> git clone{" "}
              <span className="code-url">
                github.com/draftmark-app/skill.git
              </span>
              <br />
              <span className="code-method">$</span> cp -r skill/draftmark{" "}
              <span className="code-url">~/.claude/skills/draftmark</span>
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">01</div>
            <h3>The agent publishes</h3>
            <p>
              Ask your agent to &quot;share this plan for review.&quot; The skill
              fires, checks auth with <code>dm whoami</code>, writes the markdown
              to a file, and runs <code>dm create --agent</code> — then hands you
              the share link.
            </p>
            <div className="agents-code">
              <span className="code-key">&rsaquo;</span> share the plan for review
              <br />
              <span className="code-comment"># agent runs:</span>
              <br />
              <span className="code-method">$</span> dm create plan.md --agent
              --json
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">02</div>
            <h3>Humans review</h3>
            <p>
              Reviewers open the link and leave comments — general or anchored to
              specific lines — in the browser. Nothing to install on their end.
              The agent just waits; review is asynchronous.
            </p>
            <div className="agents-code">
              <span className="code-comment">
                # draftmark.app/share/a1b2c3d4
              </span>
              <br />
              alice: section 3 needs a rollback plan
              <br />
              bob: &#128077; on the phased cutover
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">03</div>
            <h3>The agent reads back</h3>
            <p>
              Next session, ask &quot;any feedback yet?&quot; The skill resolves
              the doc from <code>.draftmark.json</code>, pulls comments as JSON,
              incorporates them with <code>dm update</code>, and closes the
              review when it&apos;s done.
            </p>
            <div className="agents-code">
              <span className="code-key">&rsaquo;</span> any feedback on the plan?
              <br />
              <span className="code-comment"># agent runs:</span>
              <br />
              <span className="code-method">$</span> dm comments --json | ...
              <br />
              <span className="code-method">$</span> dm update revised.md &amp;&amp;
              dm close
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THE SKILL KNOWS */}
      <section className="agents-section">
        <div className="agents-section-label">// what the skill knows</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&rsaquo;]</div>
            <h3>Trigger-aware</h3>
            <p>
              Activates on the prompts that matter — &quot;share this for
              review,&quot; &quot;get feedback on this draft,&quot; &quot;any
              comments yet?&quot; — and stays out of the way otherwise.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[dm]</div>
            <h3>Built on the CLI</h3>
            <p>
              No new runtime — the skill drives the same{" "}
              <Link href="/cli">
                <code>dm</code> CLI
              </Link>{" "}
              you can run by hand. Auth, JSON, and exit codes are already solved.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[json]</div>
            <h3>JSON-first</h3>
            <p>
              Reads results with <code>--json</code> and parses structured
              output — slugs, line-anchored comments, review status — instead of
              scraping tables.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[0-4]</div>
            <h3>Gate-aware</h3>
            <p>
              Knows the exit codes: <code>2</code> auth, <code>3</code> not
              found, <code>4</code> conflict (review closed or past deadline). It
              reports gates instead of retrying blindly.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#8635;]</div>
            <h3>Cross-session</h3>
            <p>
              <code>.draftmark.json</code> is the memory between sessions. A
              fresh session picks up the pending doc and its feedback without you
              re-pasting a link.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Reviewer mode</h3>
            <p>
              When your agent reviews someone else&apos;s doc, it comments with{" "}
              <code>--author-type agent</code> and line anchors, so its feedback
              carries a visible <code>[agent]</code> badge.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[?]</div>
            <h3>Auth-first</h3>
            <p>
              Checks <code>dm whoami</code> before acting and asks for an account
              key when one is missing — no silent failures, no leaked keys in
              tracked files.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[url]</div>
            <h3>Self-host aware</h3>
            <p>
              Honors <code>--base-url</code>, so the same skill works against a
              self-hosted Draftmark instance without any changes.
            </p>
          </div>
        </div>
      </section>

      {/* PREREQUISITES */}
      <section className="agents-section">
        <div className="agents-section-label">// prerequisites</div>
        <div className="agents-example">
          <div className="agents-example-step">
            <div className="agents-example-label">the CLI</div>
            <div className="agents-code">
              <span className="code-method">$</span> npm install -g draftmark
              <br />
              <span className="code-comment">
                # the skill drives this binary — see the{" "}
              </span>
              <Link href="/cli">
                <span className="code-url">CLI page</span>
              </Link>
            </div>
          </div>
          <div className="agents-example-divider">
            <span>and an account key for private docs</span>
          </div>
          <div className="agents-example-step">
            <div className="agents-example-label">auth</div>
            <div className="agents-code">
              <span className="code-method">$</span> dm login --api-key acct_xxxx
              <br />
              <span className="code-comment">
                # or export DM_API_KEY (public docs work without a key)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="agents-cta">
        <h2>
          One skill.
          <br />
          <em>The whole review loop.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a
            href={SKILL_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            get the skill on GitHub
          </a>
          <Link href="/cli" className="btn-ghost">
            explore the CLI &rarr;
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
