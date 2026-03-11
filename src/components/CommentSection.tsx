"use client";

import { useState, useEffect, useCallback } from "react";

type Comment = {
  id: string;
  body: string;
  author: string;
  author_type: string;
  anchor_type: string | null;
  anchor_ref: number | null;
  anchor_text: string | null;
  doc_version: number | null;
  status: string;
  cross_ref_slug: string | null;
  cross_ref_line: number | null;
  created_at: string;
};

type Props = {
  slug: string;
  currentVersion: number;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onInlineCommentsLoaded?: (comments: Comment[]) => void;
};

export default function CommentSection({ slug, currentVersion, reviewerName, setReviewerName, persistReviewerName, onInlineCommentsLoaded }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/v1/docs/${slug}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
      if (onInlineCommentsLoaded) {
        onInlineCommentsLoaded(
          data.comments.filter((c: Comment) => c.anchor_type === "line" || c.anchor_type === "selection")
        );
      }
    }
  }, [slug, onInlineCommentsLoaded]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const generalComments = comments.filter((c) => !c.anchor_type || c.anchor_type === null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/v1/docs/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: body.trim(),
        author: reviewerName.trim() || undefined,
      }),
    });

    if (res.ok) {
      setBody("");
      persistReviewerName(reviewerName);
      fetchComments();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to post comment");
    }
    setSubmitting(false);
  }

  return (
    <div className="doc-view-comments">
      <h3>comments ({generalComments.length})</h3>

      {generalComments.map((c) => (
        <div key={c.id} className="doc-view-comment">
          <div className="avatar avatar-a">
            {(c.author || "a")[0].toUpperCase()}
          </div>
          <div className="doc-view-comment-body">
            <div className="doc-view-comment-header">
              <span className="comment-author">{c.author}</span>
              {c.author_type === "agent" && (
                <span className="badge-agent">agent</span>
              )}
              {c.status !== "open" && (
                <span className="comment-tag">{c.status}</span>
              )}
              {c.doc_version != null && c.doc_version < currentVersion && (
                <span className="comment-version-badge comment-version-stale">
                  v{c.doc_version}
                </span>
              )}
              <span className="doc-view-comment-time">
                {getTimeAgo(new Date(c.created_at))}
              </span>
            </div>
            <p>{c.body}</p>
            {c.cross_ref_slug && (
              <a
                href={`/share/${c.cross_ref_slug}`}
                className="comment-cross-ref"
              >
                → {c.cross_ref_slug}
                {c.cross_ref_line ? `:${c.cross_ref_line}` : ""}
              </a>
            )}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="name (optional)"
          className="comment-author-input"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="leave a comment..."
          className="comment-textarea"
          rows={3}
        />
        {error && <div className="create-error">{error}</div>}
        <button
          type="submit"
          className="btn-primary comment-submit"
          disabled={submitting || !body.trim()}
        >
          {submitting ? "posting..." : "post comment"}
        </button>
      </form>
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
