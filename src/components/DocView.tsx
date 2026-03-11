"use client";

import { useState, useCallback } from "react";
import MarkdownPreview from "./MarkdownPreview";
import LineNumberedMarkdown from "./LineNumberedMarkdown";
import CommentSection from "./CommentSection";
import ReactionsBar from "./ReactionsBar";
import ReviewsSection from "./ReviewsSection";

type DocData = {
  slug: string;
  title: string | null;
  content: string;
  visibility: string;
  viewsCount: number;
  commentsCount: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
};

type InlineComment = {
  id: string;
  body: string;
  author: string;
  anchor_ref: number | null;
  doc_version: number | null;
  status: string;
  created_at: string;
};

export default function DocView({ doc }: { doc: DocData }) {
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const timeAgo = getTimeAgo(new Date(doc.createdAt));

  const handleInlineCommentsLoaded = useCallback((comments: InlineComment[]) => {
    setInlineComments(comments);
  }, []);

  const handleCommentPosted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="doc-view">
      <div className="doc-view-header">
        <div className="doc-view-title-row">
          <h1 className="doc-view-title">{doc.title || "Untitled"}</h1>
          <span className={`badge badge-${doc.visibility}`}>
            {doc.visibility}
          </span>
        </div>
        <div className="doc-view-meta">
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="stats-bar">
        <span>{doc.viewsCount} views</span>
        <span>{doc.commentsCount} comments</span>
        <span>{doc.reviewsCount} reviews</span>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          preview
        </button>
        <button
          className={`tab ${activeTab === "source" ? "active" : ""}`}
          onClick={() => setActiveTab("source")}
        >
          source
        </button>
      </div>

      {activeTab === "preview" ? (
        <div className="doc-view-body">
          <MarkdownPreview content={doc.content} />
        </div>
      ) : (
        <LineNumberedMarkdown
          content={doc.content}
          slug={doc.slug}
          inlineComments={inlineComments}
          onCommentPosted={handleCommentPosted}
        />
      )}

      <ReactionsBar slug={doc.slug} />

      <CommentSection
        key={refreshKey}
        slug={doc.slug}
        onInlineCommentsLoaded={handleInlineCommentsLoaded}
      />

      <ReviewsSection slug={doc.slug} />
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
