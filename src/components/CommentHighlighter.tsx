"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useToast } from "./Toast";

type InlineComment = {
  id: string;
  body: string;
  author: string;
  author_type: string;
  anchor_text: string | null;
  doc_version: number | null;
  status: string;
  created_at: string;
};

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
  comments: InlineComment[];
  currentVersion: number;
  slug: string;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onCommentPosted: () => void;
  authToken?: string;
};

export default function CommentHighlighter({ containerRef, comments, currentVersion, slug, reviewerName, setReviewerName, persistReviewerName, onCommentPosted, authToken }: Props) {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef(false);
  const { showToast } = useToast();

  // Stable grouping — only recompute when comment IDs change
  const commentIds = comments.map((c) => c.id).join(",");
  const commentsByText = useMemo(() => {
    return comments.reduce<Record<string, InlineComment[]>>((acc, c) => {
      if (c.anchor_text) {
        const key = c.anchor_text;
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
      }
      return acc;
    }, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentIds]);

  // Apply highlights once, clean up on unmount or when comments change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const texts = Object.keys(commentsByText);
    if (texts.length === 0) return;

    // Small delay to ensure markdown has rendered
    const timer = setTimeout(() => {
      // Remove any existing highlights first
      removeHighlights(container);

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      for (const anchorText of texts) {
        const commentGroup = commentsByText[anchorText];
        const groupId = commentGroup[0].id;
        let found = false;

        for (const textNode of textNodes) {
          if (found) break;
          const nodeText = textNode.textContent || "";
          const idx = nodeText.indexOf(anchorText);
          if (idx === -1) continue;

          // Don't highlight inside code blocks
          if (textNode.parentElement?.closest("pre, code")) continue;

          const before = nodeText.slice(0, idx);
          const match = nodeText.slice(idx, idx + anchorText.length);
          const after = nodeText.slice(idx + anchorText.length);

          const span = document.createElement("span");
          span.className = "comment-highlight-wrap";
          span.setAttribute("data-comment-group", groupId);

          const highlightSpan = document.createElement("span");
          highlightSpan.className = "comment-highlight";
          highlightSpan.textContent = match;

          const bubble = document.createElement("span");
          bubble.className = "comment-bubble";
          bubble.textContent = String(commentGroup.length);

          span.appendChild(highlightSpan);
          span.appendChild(bubble);

          const parent = textNode.parentNode;
          if (!parent) continue;

          if (before) parent.insertBefore(document.createTextNode(before), textNode);
          parent.insertBefore(span, textNode);
          if (after) parent.insertBefore(document.createTextNode(after), textNode);
          parent.removeChild(textNode);

          found = true;
        }
      }

      highlightedRef.current = true;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (highlightedRef.current) {
        removeHighlights(container);
        highlightedRef.current = false;
      }
    };
  }, [containerRef, commentsByText]);

  // Handle click on highlights
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Don't close if clicking inside the popover
      if (popoverRef.current?.contains(target)) return;

      const wrap = target.closest(".comment-highlight-wrap") as HTMLElement | null;
      if (!wrap) {
        setActiveCommentId(null);
        return;
      }

      const groupId = wrap.getAttribute("data-comment-group");
      if (!groupId) return;

      const rect = wrap.getBoundingClientRect();
      const containerRect = container!.getBoundingClientRect();

      setPopoverPos({
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left,
      });
      setActiveCommentId((prev) => (prev === groupId ? null : groupId));
    }

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [containerRef]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!activeCommentId) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".comment-highlight-wrap")
      ) {
        setActiveCommentId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCommentId]);

  async function handleReply(e: React.FormEvent, anchorText: string) {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSubmitting(true);
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments${tokenParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: replyBody.trim(),
        author: reviewerName.trim() || undefined,
        anchor_type: "selection",
        anchor_text: anchorText,
      }),
    });

    if (res.ok) {
      setReplyBody("");
      persistReviewerName(reviewerName);
      onCommentPosted();
      showToast("reply posted");
    }
    setSubmitting(false);
  }

  if (!activeCommentId) return null;

  // Find the comments for the active group
  const activeComments = comments.filter((c) => {
    const group = commentsByText[c.anchor_text || ""];
    return group && group[0].id === activeCommentId;
  });

  if (activeComments.length === 0) return null;

  const activeAnchorText = activeComments[0].anchor_text || "";

  return (
    <div
      ref={popoverRef}
      className="comment-highlight-popover"
      style={{ top: popoverPos.top, left: popoverPos.left }}
    >
      {activeComments.map((c) => (
        <div key={c.id} className="comment-highlight-popover-item">
          <div className="doc-view-comment-header">
            <span className="comment-author">{c.author}</span>
            {c.author_type === "agent" && (
              <span className="badge-agent">agent</span>
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
        </div>
      ))}
      <form onSubmit={(e) => handleReply(e, activeAnchorText)} className="comment-highlight-reply-form">
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
          placeholder="reply..."
          className="comment-textarea"
          rows={2}
        />
        <button
          type="submit"
          className="btn-primary comment-submit"
          disabled={submitting || !replyBody.trim()}
        >
          {submitting ? "posting..." : "reply"}
        </button>
      </form>
    </div>
  );
}

function removeHighlights(container: HTMLElement) {
  container.querySelectorAll(".comment-highlight-wrap").forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    // Extract just the highlighted text content
    const text = el.querySelector(".comment-highlight")?.textContent || "";
    const textNode = document.createTextNode(text);
    parent.insertBefore(textNode, el);
    parent.removeChild(el);
    // Merge adjacent text nodes
    parent.normalize();
  });
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
