"use client";

import { useState, useCallback, useRef } from "react";
import MarkdownPreview from "./MarkdownPreview";
import LineNumberedMarkdown from "./LineNumberedMarkdown";
import CommentSection from "./CommentSection";
import ReactionsBar from "./ReactionsBar";
import ReviewsSection from "./ReviewsSection";
import SelectionCommentPopover from "./SelectionCommentPopover";
import { useReviewerName } from "@/lib/useReviewerName";

type DocData = {
  slug: string;
  title: string | null;
  content: string;
  visibility: string;
  status: string;
  expectedReviews: number | null;
  reviewDeadline: string | null;
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
  anchor_type: string | null;
  anchor_ref: number | null;
  anchor_text: string | null;
  doc_version: number | null;
  status: string;
  created_at: string;
};

export default function DocView({ doc }: { doc: DocData }) {
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const { name: reviewerName, setName: setReviewerName, persistName: persistReviewerName } = useReviewerName();

  const timeAgo = getTimeAgo(new Date(doc.createdAt));
  const reviewExpired = doc.reviewDeadline ? new Date() > new Date(doc.reviewDeadline) : false;
  const acceptingFeedback = doc.status !== "review_closed" && !reviewExpired;
  const reviewComplete = doc.expectedReviews != null && doc.reviewsCount >= doc.expectedReviews;

  const selectionComments = inlineComments.filter((c) => c.anchor_type === "selection");

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
          {!acceptingFeedback && (
            <span className="badge badge-closed">
              {doc.status === "review_closed" ? "review closed" : "review expired"}
            </span>
          )}
          {acceptingFeedback && reviewComplete && (
            <span className="badge badge-complete">review complete</span>
          )}
        </div>
        <div className="doc-view-meta">
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="stats-bar">
        <span>{doc.viewsCount} views</span>
        <span>{doc.commentsCount} comments</span>
        <span>
          {doc.reviewsCount}{doc.expectedReviews != null ? `/${doc.expectedReviews}` : ""} reviews
        </span>
        {doc.reviewDeadline && (
          <span>deadline: {new Date(doc.reviewDeadline).toLocaleDateString()}</span>
        )}
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
        <div className="doc-view-body" ref={previewRef} style={{ position: "relative" }}>
          <MarkdownPreview content={doc.content} />
          {acceptingFeedback && (
            <SelectionCommentPopover
              containerRef={previewRef}
              slug={doc.slug}
              reviewerName={reviewerName}
              setReviewerName={setReviewerName}
              persistReviewerName={persistReviewerName}
              onCommentPosted={handleCommentPosted}
            />
          )}
          {selectionComments.length > 0 && (
            <div className="selection-comments-list">
              {selectionComments.map((c) => (
                <div key={c.id} className="selection-comment-item">
                  <div className="selection-comment-quote-display">
                    &ldquo;{c.anchor_text}&rdquo;
                  </div>
                  <div className="selection-comment-content">
                    <div className="doc-view-comment-header">
                      <span className="comment-author">{c.author}</span>
                      {c.status !== "open" && (
                        <span className="comment-tag">{c.status}</span>
                      )}
                      <span className="doc-view-comment-time">
                        {getTimeAgo(new Date(c.created_at))}
                      </span>
                    </div>
                    <p>{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <LineNumberedMarkdown
          content={doc.content}
          slug={doc.slug}
          inlineComments={inlineComments}
          reviewerName={reviewerName}
          setReviewerName={setReviewerName}
          persistReviewerName={persistReviewerName}
          onCommentPosted={handleCommentPosted}
        />
      )}

      <ReactionsBar slug={doc.slug} />

      <CommentSection
        key={refreshKey}
        slug={doc.slug}
        reviewerName={reviewerName}
        setReviewerName={setReviewerName}
        persistReviewerName={persistReviewerName}
        onInlineCommentsLoaded={handleInlineCommentsLoaded}
      />

      <ReviewsSection
        slug={doc.slug}
        reviewerName={reviewerName}
        setReviewerName={setReviewerName}
        persistReviewerName={persistReviewerName}
      />
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
