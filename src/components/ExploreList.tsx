"use client";

import { useState } from "react";
import Link from "next/link";

export type ExploreDoc = {
  slug: string;
  seoSlug: string | null;
  title: string | null;
  content: string;
  viewsCount: number;
  createdAt: string;
  commentsCount: number;
  reviewsCount: number;
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getSnippet(content: string): string {
  return content
    .replace(/^#+\s.*$/gm, "")
    .replace(/[*_`~\[\]()>]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 140);
}

export default function ExploreList({
  initialDocs,
  initialCursor,
}: {
  initialDocs: ExploreDoc[];
  initialCursor: string | null;
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/explore?cursor=${cursor}`);
      const data = await res.json();
      setDocs((prev) => [...prev, ...data.docs]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explore-grid">
      {docs.map((doc) => {
        const title = doc.title || "Untitled";
        const snippet = getSnippet(doc.content);
        const linkSlug = doc.seoSlug || doc.slug;

        return (
          <Link
            key={doc.slug}
            href={`/share/${linkSlug}`}
            className="explore-card"
          >
            <div className="explore-card-title">{title}</div>
            {snippet && (
              <div className="explore-card-snippet">{snippet}</div>
            )}
            <div className="explore-card-meta">
              <span>{doc.viewsCount} views</span>
              <span>{doc.commentsCount} comments</span>
              <span>{doc.reviewsCount} reviews</span>
              <span className="explore-card-date">
                {formatTimeAgo(doc.createdAt)}
              </span>
            </div>
          </Link>
        );
      })}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="explore-load-more"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
