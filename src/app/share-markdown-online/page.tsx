import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

/*
 * TIER-1 CATEGORY LANDING
 * Targets non-brand demand: "share markdown online", "share a markdown file",
 * "how to share markdown". Genuinely useful, step-by-step — not a doorway page.
 */

export const metadata = {
  title: "Share Markdown Online",
  description:
    "Share markdown online with a clean link in seconds. Paste or write markdown, get a shareable URL, and collect inline comments and reviews — no account required.",
  alternates: {
    canonical: "/share-markdown-online",
  },
  openGraph: {
    title: "Share Markdown Online — Draftmark",
    description:
      "Paste markdown, get a shareable link, collect feedback. No account required.",
  },
};

const faq = [
  {
    q: "How do I share a markdown file online?",
    a: "Paste or write your markdown, click share, and Draftmark gives you a short URL that renders the document beautifully. Anyone with the link can read it — no account or install required.",
  },
  {
    q: "Can people comment on the markdown I share?",
    a: "Yes. Readers can leave inline comments anchored to specific lines, add reactions, and mark themselves as done reviewing. You can also set a review deadline and an expected number of reviewers.",
  },
  {
    q: "Do I need an account to share markdown?",
    a: "No. You can create and share a doc without signing up. You get a private magic link to edit it and, optionally, an API key for programmatic access.",
  },
  {
    q: "Can I share markdown from the command line or an AI agent?",
    a: "Yes. Install the CLI with npm install -g draftmark, or use the REST API directly. Pipe a file with dm create - < notes.md, or have an agent POST to /api/v1/docs and poll for feedback.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to share markdown online",
  step: [
    {
      "@type": "HowToStep",
      name: "Write or paste your markdown",
      text: "Open the editor, then write or paste the markdown you want to share.",
      url: "https://draftmark.app/new",
    },
    {
      "@type": "HowToStep",
      name: "Get a shareable link",
      text: "Publish the doc to get a short, clean URL that renders your markdown.",
    },
    {
      "@type": "HowToStep",
      name: "Collect feedback",
      text: "Send the link. Reviewers leave inline comments and reactions — no account required.",
    },
  ],
};

export default function ShareMarkdownOnlinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Nav />

      <section className="usecase-hero">
        <div>
          <div className="tag">markdown sharing</div>
          <h1>
            Share markdown
            <br />
            <em>online</em>
            <br />
            in seconds
          </h1>
          <p className="hero-desc">
            Paste or write markdown, get a clean shareable link, and collect
            inline comments and reviews — from humans or AI agents. No account,
            no install, no setup.
          </p>
          <div className="hero-actions">
            <Link href="/new" className="btn-primary">
              share markdown now
            </Link>
            <Link href="/explore" className="btn-ghost">
              see examples &rarr;
            </Link>
          </div>
        </div>
        <div className="usecase-hero-visual">
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#9998;</span>
            <span>Paste markdown</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#8599;</span>
            <span>Get a link</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-blue">
            <span className="usecase-visual-icon">&#128172;</span>
            <span>Collect comments</span>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="usecase-section">
        <div className="usecase-section-label">// how it works</div>
        <div className="usecase-steps">
          <div className="usecase-step">
            <div className="step-num">01</div>
            <h3>Write or paste</h3>
            <p>
              Drop in your markdown — a plan, README, RFC, changelog, or notes.
              Code fences, tables, task lists, and Mermaid diagrams all render.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">02</div>
            <h3>Get a link</h3>
            <p>
              Publish to get a short URL like{" "}
              <code>draftmark.app/share/abc123</code>. Public or private
              (link-only) — your choice. Grab the raw markdown at{" "}
              <code>/share/abc123.md</code>.
            </p>
          </div>
          <div className="usecase-step">
            <div className="step-num">03</div>
            <h3>Collect feedback</h3>
            <p>
              Share the link. Reviewers leave inline comments on specific lines,
              add reactions, and mark themselves done — no account needed to
              comment on public docs.
            </p>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="usecase-section">
        <div className="usecase-section-label">// why draftmark</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#9889;]</div>
            <h3>Beautiful rendering</h3>
            <p>
              GitHub-flavored markdown with syntax highlighting, tables, task
              lists, and Mermaid diagrams — rendered clean in light or dark.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Inline comments</h3>
            <p>
              Feedback anchored to the exact line, not a thread at the bottom.
              The fastest way to get precise review on a document.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128100;]</div>
            <h3>No account required</h3>
            <p>
              Create and share without signing up. Readers don&apos;t need an
              account to view or comment on public docs.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[api]</div>
            <h3>API &amp; CLI</h3>
            <p>
              Share from the terminal with <code>dm create -</code> or the REST
              API. Built so AI agents can share docs and read feedback
              programmatically.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[md]</div>
            <h3>Raw markdown access</h3>
            <p>
              Every doc is available as raw <code>text/markdown</code> at{" "}
              <code>/share/&lt;slug&gt;.md</code> — perfect for agents and
              piping into other tools.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#10003;]</div>
            <h3>Review tracking</h3>
            <p>
              Set an expected number of reviewers and a deadline. Draftmark
              signals when the review threshold is met, and automatically stops
              accepting feedback once the deadline passes.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="usecase-section">
        <div className="usecase-section-label">// faq</div>
        <div className="features-grid">
          {faq.map((item) => (
            <div className="feature" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="related-links">
        Compare Draftmark:{" "}
        <Link href="/vs/github-gist">vs GitHub Gist</Link>
        <span className="sep">&middot;</span>
        <Link href="/vs/hackmd">vs HackMD</Link>
        <span className="sep">&middot;</span>
        <Link href="/vs/stackedit">vs StackEdit</Link>
      </div>

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Share your markdown
          <br />
          <em>and get it read.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            share markdown now
          </Link>
          <Link href="/docs" className="btn-ghost">
            read the API docs &rarr;
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
