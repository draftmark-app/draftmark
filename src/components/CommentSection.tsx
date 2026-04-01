"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "./Toast";
import CommentMarkdown from "./CommentMarkdown";

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
  parent_id: string | null;
  created_at: string;
};

type Props = {
  slug: string;
  currentVersion: number;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onInlineCommentsLoaded?: (comments: Comment[]) => void;
  authToken?: string;
};

export default function CommentSection({ slug, currentVersion, reviewerName, setReviewerName, persistReviewerName, onInlineCommentsLoaded, authToken }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchComments = useCallback(async () => {
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments${tokenParam}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
      if (onInlineCommentsLoaded) {
        onInlineCommentsLoaded(
          data.comments.filter((c: Comment) => c.anchor_type === "line" || c.anchor_type === "selection")
        );
      }
    }
  }, [slug, onInlineCommentsLoaded, authToken]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const generalComments = comments.filter((c) => !c.anchor_type || c.anchor_type === null);
  const topLevel = generalComments.filter((c) => !c.parent_id);
  const repliesByParent = generalComments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError("");

    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments${tokenParam}`, {
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
      showToast("comment posted");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to post comment");
    }
    setSubmitting(false);
  }

  async function handleReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setReplySubmitting(true);

    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments${tokenParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: replyBody.trim(),
        author: reviewerName.trim() || undefined,
        parent_id: parentId,
      }),
    });

    if (res.ok) {
      setReplyBody("");
      setReplyingTo(null);
      persistReviewerName(reviewerName);
      fetchComments();
      showToast("reply posted");
    }
    setReplySubmitting(false);
  }

  function renderComment(c: Comment, isReply = false) {
    const replies = repliesByParent[c.id] || [];
    return (
      <div key={c.id}>
        <div className={`doc-view-comment ${isReply ? "doc-view-comment-reply" : ""}`}>
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
            <CommentMarkdown content={c.body} />
            {c.cross_ref_slug && (
              <a
                href={`/share/${c.cross_ref_slug}`}
                className="comment-cross-ref"
              >
                → {c.cross_ref_slug}
                {c.cross_ref_line ? `:${c.cross_ref_line}` : ""}
              </a>
            )}
            {!isReply && (
              <button
                type="button"
                className="comment-reply-btn"
                onClick={() => {
                  setReplyingTo(replyingTo === c.id ? null : c.id);
                  setReplyBody("");
                }}
              >
                reply
              </button>
            )}
          </div>
        </div>

        {replies.map((r) => renderComment(r, true))}

        {replyingTo === c.id && (
          <form onSubmit={(e) => handleReply(e, c.id)} className="comment-reply-form">
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="name (optional)"
              className="comment-author-input"
            />
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="write a reply..."
              className="comment-textarea"
              rows={2}
              autoFocus
            />
            <div className="comment-reply-actions">
              <button
                type="button"
                className="comment-reply-cancel"
                onClick={() => { setReplyingTo(null); setReplyBody(""); }}
              >
                cancel
              </button>
              <button
                type="submit"
                className="btn-primary comment-submit"
                disabled={replySubmitting || !replyBody.trim()}
              >
                {replySubmitting ? "posting..." : "reply"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="doc-view-comments">
      <h3>comments ({generalComments.length})</h3>

      {topLevel.map((c) => renderComment(c))}

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
