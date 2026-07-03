import Link from "next/link";
import Nav from "@/components/Nav";

/*
 * COMPARISON LANDING TEMPLATE
 * ---------------------------
 * Clone this directory to add a new "vs" page (e.g. src/app/vs/hackmd/page.tsx).
 * Change: metadata, the COMPETITOR const, the hero copy, the comparison rows,
 * and the FAQ. Then add the new route to src/app/sitemap.ts.
 */

const COMPETITOR = "GitHub Gist";

export const metadata = {
  title: `Draftmark vs ${COMPETITOR}`,
  description: `Draftmark vs ${COMPETITOR} for sharing markdown: inline comments, review tracking, agent-friendly REST API, and no account required. See how they compare.`,
  alternates: {
    canonical: "https://draftmark.app/vs/github-gist",
  },
  openGraph: {
    title: `Draftmark vs ${COMPETITOR}`,
    description: `Share markdown with inline comments, review tracking, and a full REST API — no account required.`,
  },
};

const faq = [
  {
    q: `Is Draftmark a ${COMPETITOR} alternative?`,
    a: `Yes. Both let you share a markdown document via a link. Draftmark adds inline commenting, review tracking, reactions, and a REST API built for AI agents — without requiring the reader to have an account.`,
  },
  {
    q: `Do reviewers need an account to comment?`,
    a: `No. Anyone with the link can read a public doc and leave inline comments. GitHub Gist requires a GitHub account to comment.`,
  },
  {
    q: `Can AI agents use Draftmark programmatically?`,
    a: `Yes. Draftmark has a full REST API — agents create docs, poll for feedback, and consume comments as structured JSON. There's also a CLI (npm i -g draftmark).`,
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

type Row = { feature: string; draftmark: string; competitor: string };

const rows: Row[] = [
  { feature: "Shareable markdown link", draftmark: "yes", competitor: "yes" },
  { feature: "Inline line-anchored comments", draftmark: "yes", competitor: "no" },
  { feature: "Reviewers need an account", draftmark: "No", competitor: "GitHub account required" },
  { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
  { feature: "Reactions", draftmark: "yes", competitor: "no" },
  { feature: "REST API for AI agents", draftmark: "yes", competitor: "no" },
  { feature: "Mermaid diagrams", draftmark: "yes", competitor: "no" },
  { feature: "Raw markdown endpoint", draftmark: "yes", competitor: "yes" },
  { feature: "Version history", draftmark: "yes", competitor: "yes (revisions)" },
  { feature: "Self-hostable (MIT)", draftmark: "yes", competitor: "no" },
];

function Cell({ value }: { value: string }) {
  if (value === "yes") return <span className="compare-yes">&#10003;</span>;
  if (value === "no") return <span className="compare-no">&mdash;</span>;
  return <>{value}</>;
}

export default function DraftmarkVsGithubGistPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Nav />

      <section className="usecase-hero">
        <div>
          <div className="tag">comparison</div>
          <h1>
            Draftmark vs
            <br />
            <em>{COMPETITOR}</em>
          </h1>
          <p className="hero-desc">
            {COMPETITOR} is great for dropping a snippet online. But if you want
            people — or AI agents — to actually <em>review</em> your markdown,
            you need inline comments, review tracking, and an API. That&apos;s
            Draftmark.
          </p>
          <div className="hero-actions">
            <Link href="/new" className="btn-primary">
              try draftmark
            </Link>
            <Link href="/docs" className="btn-ghost">
              read the API docs &rarr;
            </Link>
          </div>
        </div>
        <div className="usecase-hero-visual">
          <div className="usecase-visual-node highlight-accent">
            <span className="usecase-visual-icon">&#9998;</span>
            <span>Write markdown</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node">
            <span className="usecase-visual-icon">&#8599;</span>
            <span>Share link</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-blue">
            <span className="usecase-visual-icon">&#128172;</span>
            <span>Inline comments</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-green">
            <span className="usecase-visual-icon">&#10003;</span>
            <span>Feedback via API</span>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="usecase-section">
        <div className="usecase-section-label">// feature comparison</div>
        <div className="compare-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="compare-self">Draftmark</th>
                <th>{COMPETITOR}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td className="compare-self">
                    <Cell value={row.draftmark} />
                  </td>
                  <td>
                    <Cell value={row.competitor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* WHY */}
      <section className="usecase-section">
        <div className="usecase-section-label">// why teams switch</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Comments where they belong</h3>
            <p>
              Feedback anchored to specific lines, not buried in a thread below
              the snippet. Reviewers point at the exact line that needs work.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#128100;]</div>
            <h3>No account for readers</h3>
            <p>
              Public docs are open to anyone with the link. No GitHub login, no
              sign-up wall between your reviewer and the feedback you need.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[api]</div>
            <h3>Built for agents</h3>
            <p>
              A full REST API and CLI. Agents create docs, poll{" "}
              <code>review_complete</code>, and consume comments as JSON — the
              agent &rarr; human &rarr; agent loop, automated.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#10003;]</div>
            <h3>Review lifecycle</h3>
            <p>
              Set <code>expected_reviews</code> and a{" "}
              <code>review_deadline</code>. Draftmark tracks who reviewed and
              closes feedback automatically. Gist has no concept of &ldquo;done.&rdquo;
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

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Sharing is easy.
          <br />
          <em>Getting reviewed is the hard part.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            try draftmark
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
              <a href="https://rumbolabs.net" target="_blank" rel="noopener noreferrer">rumbo labs</a>
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
