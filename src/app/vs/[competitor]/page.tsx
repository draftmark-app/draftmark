import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  comparisons,
  comparisonSlugs,
  getComparison,
} from "@/lib/comparisons";

type Props = {
  params: Promise<{ competitor: string }>;
};

export function generateStaticParams() {
  return comparisonSlugs.map((competitor) => ({ competitor }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const c = getComparison(competitor);
  if (!c) return { title: "Not found" };
  return {
    title: `Draftmark vs ${c.competitor}`,
    description: c.metaDescription,
    alternates: { canonical: `/vs/${c.slug}` },
    openGraph: {
      title: `Draftmark vs ${c.competitor}`,
      description: c.ogDescription,
    },
  };
}

function Cell({ value }: { value: string }) {
  if (value === "yes")
    return (
      <span className="compare-yes" role="img" aria-label="Yes">
        &#10003;
      </span>
    );
  if (value === "no")
    return (
      <span className="compare-no" role="img" aria-label="No">
        &mdash;
      </span>
    );
  return <>{value}</>;
}

export default async function ComparisonPage({ params }: Props) {
  const { competitor } = await params;
  const c = getComparison(competitor);
  if (!c) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const others = comparisonSlugs.filter((slug) => slug !== c.slug);

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
            <em>{c.competitor}</em>
          </h1>
          <p className="hero-desc">{c.heroDesc}</p>
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
          {c.heroVisual.map((node, i) => (
            <Fragment key={node.label}>
              <div
                className={
                  node.highlight
                    ? `usecase-visual-node highlight-${node.highlight}`
                    : "usecase-visual-node"
                }
              >
                <span className="usecase-visual-icon">{node.icon}</span>
                <span>{node.label}</span>
              </div>
              {i < c.heroVisual.length - 1 ? (
                <div className="usecase-visual-arrow">&darr;</div>
              ) : null}
            </Fragment>
          ))}
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
                <th>{c.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
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
        <div className="usecase-section-label">{c.whyLabel}</div>
        <div className="features-grid">
          {c.whyCards.map((card) => (
            <div className="feature" key={card.title}>
              <div className="feature-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="usecase-section">
        <div className="usecase-section-label">// faq</div>
        <div className="features-grid">
          {c.faq.map((item) => (
            <div className="feature" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="related-links">
        More comparisons:{" "}
        {others.map((slug) => (
          <span key={slug}>
            <Link href={`/vs/${slug}`}>vs {comparisons[slug].competitor}</Link>
            <span className="sep">&middot;</span>
          </span>
        ))}
        <Link href="/share-markdown-online">share markdown online</Link>
      </div>

      {/* CTA */}
      <section className="usecase-cta">
        <h2>{c.cta}</h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            try draftmark
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
