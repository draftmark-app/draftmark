import Link from "next/link";
import Nav from "@/components/Nav";

/*
 * COMPARISON LANDING TEMPLATE — cloned from /vs/github-gist.
 * To add another: copy this directory, update COMPETITOR, metadata, hero copy,
 * rows, and faq, then add the route to src/app/sitemap.ts.
 * Keep the comparison HONEST — include rows where the competitor wins.
 */

const COMPETITOR = "StackEdit";

export const metadata = {
  title: `Draftmark vs ${COMPETITOR}`,
  description: `Draftmark vs ${COMPETITOR}: StackEdit is an in-browser markdown editor; Draftmark is for sharing markdown and collecting reviews — inline comments, review tracking, and an agent-friendly REST API.`,
  alternates: {
    canonical: "https://draftmark.app/vs/stackedit",
  },
  openGraph: {
    title: `Draftmark vs ${COMPETITOR}`,
    description: `Share markdown and collect structured feedback — inline comments, review tracking, and a full REST API.`,
  },
};

const faq = [
  {
    q: `Is Draftmark a ${COMPETITOR} alternative?`,
    a: `They overlap but solve different problems. ${COMPETITOR} is a rich in-browser markdown editor that syncs to Google Drive, Dropbox, and GitHub. Draftmark is about the step after writing: publishing a doc to a link and collecting structured feedback — inline comments, reactions, and review tracking — from humans or AI agents.`,
  },
  {
    q: `Does ${COMPETITOR} sync to cloud storage and Draftmark doesn't?`,
    a: `Correct. ${COMPETITOR}'s strength is editing with cloud sync to Drive, Dropbox, and GitHub. Draftmark stores the doc and gives you a hosted share link plus a review API instead.`,
  },
  {
    q: `Can AI agents use Draftmark programmatically?`,
    a: `Yes. Draftmark has a full REST API and a CLI (npm i -g draftmark): agents create docs, poll review status, and read comments as JSON. StackEdit has no comparable review API.`,
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
  { feature: "In-browser markdown editor", draftmark: "yes", competitor: "yes" },
  { feature: "Hosted shareable link", draftmark: "yes", competitor: "Publish/export only" },
  { feature: "Cloud sync (Drive / Dropbox / GitHub)", draftmark: "no", competitor: "yes" },
  { feature: "Inline line-anchored comments", draftmark: "yes", competitor: "no" },
  { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
  { feature: "Reactions", draftmark: "yes", competitor: "no" },
  { feature: "REST API built for AI agents", draftmark: "yes", competitor: "no" },
  { feature: "Mermaid diagrams", draftmark: "yes", competitor: "yes" },
  { feature: "Version history", draftmark: "yes", competitor: "no" },
  { feature: "Self-hostable", draftmark: "yes (MIT)", competitor: "yes (open source)" },
];

function Cell({ value }: { value: string }) {
  if (value === "yes") return <span className="compare-yes">&#10003;</span>;
  if (value === "no") return <span className="compare-no">&mdash;</span>;
  return <>{value}</>;
}

export default function DraftmarkVsStackeditPage() {
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
            {COMPETITOR} is a great place to <em>write</em> markdown with cloud
            sync. Draftmark is where you <em>share</em> it — a hosted link with
            inline comments, review tracking, and an API for humans and AI
            agents.
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
        <div className="usecase-section-label">// pick the right tool</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[&#9998;]</div>
            <h3>Choose StackEdit when&hellip;</h3>
            <p>
              You want a powerful personal editor with live preview and cloud
              sync to Drive, Dropbox, or GitHub. It&apos;s an excellent writing
              surface.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[#42]</div>
            <h3>Choose Draftmark when&hellip;</h3>
            <p>
              You need someone to read and comment. Share a link, get inline
              feedback anchored to specific lines, and track when review is
              done.
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

      {/* CTA */}
      <section className="usecase-cta">
        <h2>
          Writing is the easy part.
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
