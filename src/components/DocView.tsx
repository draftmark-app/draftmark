"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import MarkdownPreview from "./MarkdownPreview";
import LineNumberedMarkdown from "./LineNumberedMarkdown";
import CommentSection from "./CommentSection";
import ReactionsBar from "./ReactionsBar";
import ReviewsSection from "./ReviewsSection";
import SelectionCommentPopover from "./SelectionCommentPopover";
import TableOfContents from "./TableOfContents";
import ReadingProgressBar from "./ReadingProgressBar";
import { useReviewerName } from "@/lib/useReviewerName";

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

type StakeholderView = {
  content: string;
  model: string;
  generated_at: string;
};

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
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  views?: Record<string, StakeholderView>;
};

type InlineComment = {
  id: string;
  body: string;
  author: string;
  author_type: string;
  anchor_type: string | null;
  anchor_ref: number | null;
  anchor_text: string | null;
  doc_version: number | null;
  status: string;
  created_at: string;
};

type DocViewProps = {
  doc: DocData;
  isOwner?: boolean;
  editUrl?: string;
  authToken?: string;
};

export default function DocView({ doc, isOwner, editUrl, authToken }: DocViewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const [activeView, setActiveView] = useState<string | null>(null);
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const { name: reviewerName, setName: setReviewerName, persistName: persistReviewerName } = useReviewerName();

  const timeAgo = getTimeAgo(new Date(doc.createdAt));
  const readingTime = estimateReadingTime(doc.content);
  const reviewExpired = doc.reviewDeadline ? new Date() > new Date(doc.reviewDeadline) : false;
  const acceptingFeedback = doc.status !== "review_closed" && !reviewExpired;
  const reviewComplete = doc.expectedReviews != null && doc.reviewsCount >= doc.expectedReviews;

  const selectionComments = inlineComments.filter((c) => c.anchor_type === "selection");
  const availableViews = doc.views ? Object.keys(doc.views) : [];

  // Strip first H1 from content if it matches the displayed title (avoids duplication)
  const fullContent = (() => {
    if (!doc.title) return doc.content;
    const match = doc.content.match(/^#\s+(.+)\n?/);
    if (match && match[1].trim() === doc.title.trim()) {
      return doc.content.slice(match[0].length);
    }
    return doc.content;
  })();

  // Use view content when a stakeholder view is selected
  const displayContent = activeView && doc.views?.[activeView]
    ? doc.views[activeView].content
    : fullContent;

  const handleInlineCommentsLoaded = useCallback((comments: InlineComment[]) => {
    setInlineComments(comments);
  }, []);

  const handleCommentPosted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="doc-view">
      <ReadingProgressBar />
      <div className="doc-view-header">
        <div className="doc-view-title-row">
          <h1 className="doc-view-title">{doc.title || "Untitled"}</h1>
          <span className={`badge badge-${doc.visibility}`}>
            {doc.visibility}
          </span>
          <span className="badge badge-version">v{doc.currentVersion}</span>
          {!acceptingFeedback && (
            <span className="badge badge-closed">
              {doc.status === "review_closed" ? "review closed" : "review expired"}
            </span>
          )}
          {acceptingFeedback && reviewComplete && (
            <span className="badge badge-complete">review complete</span>
          )}
          {isOwner && editUrl && (
            <Link href={editUrl} className="btn-ghost btn-small doc-edit-btn">
              edit
            </Link>
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
        <span>{readingTime} min read</span>
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
          onClick={() => { setActiveTab("source"); setActiveView(null); }}
        >
          source
        </button>
      </div>

      {availableViews.length > 0 && activeTab === "preview" && (
        <div className="view-picker">
          <button
            className={`view-pill ${activeView === null ? "active" : ""}`}
            onClick={() => setActiveView(null)}
          >
            full doc
          </button>
          {availableViews.map((v) => (
            <button
              key={v}
              className={`view-pill ${activeView === v ? "active" : ""}`}
              onClick={() => setActiveView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {activeTab === "preview" ? (
        <div className="doc-view-body" ref={previewRef} style={{ position: "relative" }}>
          <TableOfContents containerRef={previewRef} />
          <MarkdownPreview content={displayContent} />
          {acceptingFeedback && (
            <SelectionCommentPopover
              containerRef={previewRef}
              slug={doc.slug}
              reviewerName={reviewerName}
              setReviewerName={setReviewerName}
              persistReviewerName={persistReviewerName}
              onCommentPosted={handleCommentPosted}
              authToken={authToken}
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
                      {c.doc_version != null && c.doc_version < doc.currentVersion && (
                        <span className="comment-version-badge comment-version-stale">
                          v{c.doc_version}
                        </span>
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
        <>
          <LineNumberedMarkdown
            content={doc.content}
            slug={doc.slug}
            currentVersion={doc.currentVersion}
            inlineComments={inlineComments}
            reviewerName={reviewerName}
            setReviewerName={setReviewerName}
            persistReviewerName={persistReviewerName}
            onCommentPosted={handleCommentPosted}
          />
          {selectionComments.length > 0 && (
            <div className="selection-comments-list">
              <h4 className="selection-comments-heading">selection comments</h4>
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
                      {c.doc_version != null && c.doc_version < doc.currentVersion && (
                        <span className="comment-version-badge comment-version-stale">
                          v{c.doc_version}
                        </span>
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
        </>
      )}

      <ReactionsBar slug={doc.slug} authToken={authToken} />

      <CommentSection
        key={refreshKey}
        slug={doc.slug}
        currentVersion={doc.currentVersion}
        reviewerName={reviewerName}
        setReviewerName={setReviewerName}
        persistReviewerName={persistReviewerName}
        onInlineCommentsLoaded={handleInlineCommentsLoaded}
        authToken={authToken}
      />

      <ReviewsSection
        slug={doc.slug}
        reviewerName={reviewerName}
        setReviewerName={setReviewerName}
        persistReviewerName={persistReviewerName}
        authToken={authToken}
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
