"use client";

import Link from "next/link";

type CollectionData = {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type CollectionDocData = {
  slug: string;
  title: string | null;
  label: string | null;
  position: number;
  visibility: string;
  viewsCount: number;
  commentsCount: number;
  reviewsCount: number;
  contentPreview: string;
  createdAt: string;
  updatedAt: string;
};

export default function CollectionView({
  collection,
  docs,
}: {
  collection: CollectionData;
  docs: CollectionDocData[];
}) {
  return (
    <div className="collection-view">
      <div className="collection-header">
        <h1 className="collection-title">{collection.title}</h1>
        <div className="collection-meta">
          <span>{docs.length} document{docs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="collection-empty">
          <p>No documents in this collection yet.</p>
          <p className="collection-empty-hint">
            Add documents via the API using the magic token.
          </p>
        </div>
      ) : (
        <div className="collection-docs">
          {docs.map((doc, i) => (
            <Link
              key={doc.slug}
              href={`/share/${doc.slug}`}
              className="collection-doc-card"
            >
              <div className="collection-doc-card-header">
                <span className="collection-doc-number">{i + 1}</span>
                <div className="collection-doc-info">
                  <h2 className="collection-doc-title">
                    {doc.label || doc.title || "Untitled"}
                  </h2>
                  {doc.label && doc.title && (
                    <span className="collection-doc-original-title">
                      {doc.title}
                    </span>
                  )}
                </div>
                <span className={`badge badge-${doc.visibility}`}>
                  {doc.visibility}
                </span>
              </div>
              <p className="collection-doc-preview">
                {doc.contentPreview.replace(/^#+ .+\n*/m, "").slice(0, 120)}
                {doc.contentPreview.length > 120 ? "..." : ""}
              </p>
              <div className="collection-doc-stats">
                <span>{doc.viewsCount} views</span>
                <span>{doc.commentsCount} comments</span>
                <span>{doc.reviewsCount} reviews</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
