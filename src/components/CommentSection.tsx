"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  mine?: boolean;
  created_at: string;
};

type Props = {
  slug: string;
  currentVersion: number;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onInlineCommentsLoaded?: (comments: Comment[]) => void;
  onJumpToComment?: (comment: Comment) => void;
  authToken?: string;
  isOwner?: boolean;
};

export default function CommentSection({ slug, currentVersion, reviewerName, setReviewerName, persistReviewerName, onInlineCommentsLoaded, onJumpToComment, authToken, isOwner }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  // Opt-in "email me on replies" (double opt-in — a confirmation email follows).
  const [notifyEmail, setNotifyEmail] = useState("");
  const [replyNotifyEmail, setReplyNotifyEmail] = useState("");
  const { showToast } = useToast();

  const seenKey = `draftmark:comments_seen:${slug}`;

  // Timestamp (ms) the viewer last acknowledged this doc's comments. Persisted
  // per-doc in localStorage so returning to the page can surface replies to
  // your own comments that arrived while you were away. No PII: "your comments"
  // is resolved server-side (see `mine`), never from anything the client stores.
  // Lazily initialized from storage; first visit baselines to "now" so we only
  // surface replies that arrive from here on, not the entire backlog.
  const [seenAt, setSeenAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem(seenKey);
    return stored ? parseInt(stored, 10) : Date.now();
  });

  // Persist the initial baseline once (no setState → no cascading render).
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(seenKey)) {
      localStorage.setItem(seenKey, String(seenAt));
    }
  }, [seenKey, seenAt]);

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

  // Show every comment here — general, line-anchored, and selection-anchored —
  // so reviewers have one place that surfaces all feedback regardless of which
  // tab it was left on. Only general comments use parent_id threading; inline
  // comments (line/selection) render top-level with an anchor badge + jump link.
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  // Replies to *your* comments that landed since you last acknowledged them.
  // Your own replies are excluded (`!c.mine`) so answering doesn't re-notify.
  const unreadReplies = useMemo(() => {
    if (!seenAt) return [];
    const myTopLevel = new Set(
      comments.filter((c) => !c.parent_id && c.mine).map((c) => c.id)
    );
    return comments.filter(
      (c) =>
        c.parent_id &&
        myTopLevel.has(c.parent_id) &&
        !c.mine &&
        new Date(c.created_at).getTime() > seenAt
    );
  }, [comments, seenAt]);

  const markRepliesRead = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(seenKey, String(now));
    setSeenAt(now);
  }, [seenKey]);

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
        notify_email: notifyEmail.trim() || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      setBody("");
      setNotifyEmail("");
      persistReviewerName(reviewerName);
      fetchComments();
      showToast(
        data?.notify_pending
          ? "comment posted — check your email to confirm reply notifications"
          : "comment posted"
      );
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
        notify_email: replyNotifyEmail.trim() || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      setReplyBody("");
      setReplyNotifyEmail("");
      setReplyingTo(null);
      persistReviewerName(reviewerName);
      fetchComments();
      showToast(
        data?.notify_pending
          ? "reply posted — check your email to confirm reply notifications"
          : "reply posted"
      );
    }
    setReplySubmitting(false);
  }

  // Owner-only: mark a comment resolved/dismissed, or reopen it. Uses the same
  // magic token the fetch/POST paths do; the endpoint also accepts the doc API
  // key (CLI) and account ownership.
  async function handleSetStatus(commentId: string, status: string) {
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments/${commentId}${tokenParam}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchComments();
      showToast(status === "open" ? "comment reopened" : `comment ${status}`);
    } else {
      const data = await res.json().catch(() => null);
      showToast(data?.error || "failed to update comment");
    }
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
              {c.anchor_type && (
                onJumpToComment ? (
                  <button
                    type="button"
                    className="comment-anchor-chip comment-anchor-chip-btn"
                    onClick={() => onJumpToComment(c)}
                    title="jump to this comment"
                  >
                    {anchorLabel(c)}
                  </button>
                ) : (
                  <span className="comment-anchor-chip">{anchorLabel(c)}</span>
                )
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
            {/* Replies nest one level under any top-level comment — general,
                line, or selection. The reply is posted with parent_id (no
                anchor), so it threads under the parent in this panel. Owner-only
                resolve/dismiss/reopen controls sit alongside reply. */}
            <div className="comment-actions">
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
              {isOwner &&
                (c.status === "open" ? (
                  <>
                    <button
                      type="button"
                      className="comment-reply-btn"
                      onClick={() => handleSetStatus(c.id, "resolved")}
                    >
                      resolve
                    </button>
                    <button
                      type="button"
                      className="comment-reply-btn"
                      onClick={() => handleSetStatus(c.id, "dismissed")}
                    >
                      dismiss
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="comment-reply-btn"
                    onClick={() => handleSetStatus(c.id, "open")}
                  >
                    reopen
                  </button>
                ))}
            </div>
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
            <input
              type="email"
              value={replyNotifyEmail}
              onChange={(e) => setReplyNotifyEmail(e.target.value)}
              placeholder="email me when someone replies (optional)"
              className="comment-author-input comment-notify-input"
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
      <h3>comments ({comments.length})</h3>

      {unreadReplies.length > 0 && (
        <div className="comments-unread-banner" role="status">
          <span>
            🔔 {unreadReplies.length} new{" "}
            {unreadReplies.length === 1 ? "reply" : "replies"} to your comments
          </span>
          <button
            type="button"
            className="comments-unread-dismiss"
            onClick={markRepliesRead}
          >
            mark read
          </button>
        </div>
      )}

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
        <input
          type="email"
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          placeholder="email me when someone replies (optional)"
          className="comment-author-input comment-notify-input"
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

function anchorLabel(c: Comment): string {
  if (c.anchor_type === "line" && c.anchor_ref != null) {
    return `📌 line ${c.anchor_ref}`;
  }
  if (c.anchor_type === "selection") {
    const quote = (c.anchor_text || "").trim();
    const truncated = quote.length > 40 ? `${quote.slice(0, 40)}…` : quote;
    return truncated ? `✎ “${truncated}”` : "✎ selection";
  }
  return "";
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
