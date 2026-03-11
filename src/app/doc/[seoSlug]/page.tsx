import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://draftmark.app";

type Props = {
  params: Promise<{ seoSlug: string }>;
};

async function getDoc(seoSlug: string) {
  const doc = await prisma.doc.findUnique({
    where: { seoSlug },
    include: {
      _count: { select: { comments: true, reviews: true } },
    },
  });
  if (!doc || doc.visibility !== "public") return null;
  return doc;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params;
  const doc = await getDoc(seoSlug);

  if (!doc) {
    return { title: "Not found — Draftmark" };
  }

  const title = doc.title || "Untitled";
  const description = doc.content
    .replace(/^#.*\n/gm, "")
    .replace(/[*_`~\[\]]/g, "")
    .trim()
    .slice(0, 160);
  const url = `${BASE_URL}/doc/${seoSlug}`;

  return {
    title: `${title} — Draftmark`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Draftmark",
      type: "article",
      publishedTime: doc.createdAt.toISOString(),
      modifiedTime: doc.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SEODocPage({ params }: Props) {
  const { seoSlug } = await params;
  const doc = await getDoc(seoSlug);

  if (!doc) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.title || "Untitled",
    datePublished: doc.createdAt.toISOString(),
    dateModified: doc.updatedAt.toISOString(),
    url: `${BASE_URL}/doc/${seoSlug}`,
    publisher: {
      "@type": "Organization",
      name: "Draftmark",
      url: BASE_URL,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: doc._count.comments,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ReviewAction",
        userInteractionCount: doc._count.reviews,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="seo-page">
        <nav className="seo-nav">
          <Link href="/" className="logo">
            draft<span>mark</span>
          </Link>
        </nav>

        <article className="seo-article">
          <header className="seo-header">
            <h1 className="seo-title">{doc.title || "Untitled"}</h1>
            <div className="seo-meta">
              <time dateTime={doc.createdAt.toISOString()}>
                {doc.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>{doc._count.comments} comments</span>
              <span>{doc._count.reviews} reviews</span>
            </div>
          </header>

          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {doc.content}
            </ReactMarkdown>
          </div>

          <footer className="seo-footer">
            <Link href={`/d/${doc.slug}`} className="btn-primary">
              leave feedback
            </Link>
            <Link href="/" className="btn-ghost">
              what is draftmark? &rarr;
            </Link>
          </footer>
        </article>

        <footer className="seo-site-footer">
          <p>
            Published on <Link href="/">Draftmark</Link> — markdown sharing for
            humans and agents.
          </p>
        </footer>
      </div>
    </>
  );
}
