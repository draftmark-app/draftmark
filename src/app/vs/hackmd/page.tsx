import Link from "next/link";
import Nav from "@/components/Nav";

/*
 * COMPARISON LANDING TEMPLATE — cloned from /vs/github-gist.
 * To add another: copy this directory, update COMPETITOR, metadata, hero copy,
 * rows, and faq, then add the route to src/app/sitemap.ts.
 * Keep the comparison HONEST — include rows where the competitor wins.
 */

const COMPETITOR = "HackMD";

export const metadata = {
  title: `Draftmark vs ${COMPETITOR}`,
  description: `Draftmark vs ${COMPETITOR} for markdown collaboration: review tracking, inline comments, an agent-friendly REST API, and no account required for readers. See how they compare.`,
  alternates: {
    canonical: "/vs/hackmd",
  },
  openGraph: {
    title: `Draftmark vs ${COMPETITOR}`,
    description: `Review tracking, inline comments, and a full REST API for humans and AI agents.`,
  },
};

const faq = [
  {
    q: `Is Draftmark a ${COMPETITOR} alternative?`,
    a: `Partly. ${COMPETITOR} is a real-time collaborative markdown editor — great for co-writing a note live. Draftmark is built for the review loop: publish a doc, collect structured feedback (inline comments, reactions, review tracking), and consume it via an API. If you need async review rather than live co-editing, Draftmark fits better.`,
  },
  {
    q: `Does ${COMPETITOR} do real-time collaboration and Draftmark doesn't?`,
    a: `Correct. ${COMPETITOR}'s strength is simultaneous live editing. Draftmark is intentionally async — you write, share a link, and reviewers comment on their own time. Different jobs.`,
  },
  {
    q: `Can AI agents use Draftmark programmatically?`,
    a: `Yes. Draftmark has a full REST API and a CLI (npm install -g draftmark) designed for the agent → human → agent handoff: agents create docs, poll review status, and read comments as JSON.`,
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
  { feature: "Real-time collaborative editing", draftmark: "no", competitor: "yes" },
  { feature: "Inline line-anchored review comments", draftmark: "yes", competitor: "Comments, not review-oriented" },
  { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
  { feature: "Reviewers need an account to comment", draftmark: "No (public docs)", competitor: "Account required" },
  { feature: "Reactions", draftmark: "yes", competitor: "no" },
  { feature: "REST API built for AI agents", draftmark: "yes", competitor: "Limited API" },
  { feature: "Mermaid diagrams", draftmark: "yes", competitor: "yes" },
  { feature: "Version history", draftmark: "yes", competitor: "yes" },
  { feature: "Self-hostable", draftmark: "yes (MIT)", competitor: "yes (CodiMD)" },
];

function Cell({ value }: { value: string }) {
  if (value === "yes")
    return <span className="compare-yes" role="img" aria-label="Yes">&#10003;</span>;
  if (value === "no")
    return <span className="compare-no" role="img" aria-label="No">&mdash;</span>;
  return <>{value}</>;
}

export default function DraftmarkVsHackmdPage() {
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
            {COMPETITOR} is built for writing markdown together in real time.
            Draftmark is built for what happens next — publishing a doc and
            getting it <em>reviewed</em>, by humans or AI agents, with inline
            comments, review tracking, and an API.
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
            <span>Async review</span>
          </div>
          <div className="usecase-visual-arrow">&darr;</div>
          <div className="usecase-visual-node highlight-green">
            <span className="usecase-visual-icon">&#10003;</span>
            <span>review_complete</span>
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
        <div className="usecase-section-label">// pick the right tool</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#9998;]</div>
            <h3>Choose HackMD when&hellip;</h3>
            <p>
              You want several people typing in the same document at the same
              time — live co-writing, meeting notes, workshops. Real-time
              collaboration is what it does best.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[&#10003;]</div>
            <h3>Choose Draftmark when&hellip;</h3>
            <p>
              The doc is written and you need a decision. Share it, track who
              reviewed, set a deadline, and close the loop — the async review
              workflow, not live editing.
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
            <div className="feature-icon">[&#128100;]</div>
            <h3>No account for readers</h3>
            <p>
              Public docs are open to anyone with the link — no sign-up wall
              between your reviewer and the feedback you need.
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
        More comparisons:{" "}
        <Link href="/vs/github-gist">vs GitHub Gist</Link>
        <span className="sep">&middot;</span>
        <Link href="/vs/stackedit">vs StackEdit</Link>
        <span className="sep">&middot;</span>
        <Link href="/share-markdown-online">share markdown online</Link>
      </div>

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Co-writing is solved.
          <br />
          <em>Getting reviewed isn&apos;t.</em>
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
