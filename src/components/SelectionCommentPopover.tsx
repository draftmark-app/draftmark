"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
  slug: string;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onCommentPosted: () => void;
  authToken?: string;
};

export default function SelectionCommentPopover({
  containerRef,
  slug,
  reviewerName,
  setReviewerName,
  persistReviewerName,
  onCommentPosted,
  authToken,
}: Props) {
  const [selectedText, setSelectedText] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [buttonPos, setButtonPos] = useState({ top: 0, left: 0 });
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      // Don't dismiss if form is open
      if (!showForm) {
        setShowButton(false);
        setSelectedText("");
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      if (!showForm) {
        setShowButton(false);
        setSelectedText("");
      }
      return;
    }

    // Check that selection is within our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectedText(text);
    setButtonPos({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2,
    });
    setShowButton(true);
  }, [containerRef, showForm]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        formRef.current &&
        !formRef.current.contains(e.target as Node)
      ) {
        setShowForm(false);
        setShowButton(false);
        setSelectedText("");
        setBody("");
      }
    }
    if (showForm) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showForm]);

  function handleCommentClick() {
    setShowButton(false);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !selectedText) return;

    setSubmitting(true);
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/comments${tokenParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: body.trim(),
        author: reviewerName.trim() || undefined,
        anchor_type: "selection",
        anchor_text: selectedText,
      }),
    });

    if (res.ok) {
      setBody("");
      persistReviewerName(reviewerName);
      setShowForm(false);
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
      onCommentPosted();
    }
    setSubmitting(false);
  }

  function handleCancel() {
    setShowForm(false);
    setShowButton(false);
    setSelectedText("");
    setBody("");
    window.getSelection()?.removeAllRanges();
  }

  if (!showButton && !showForm) return null;

  return (
    <>
      {showButton && !showForm && (
        <button
          className="selection-comment-btn"
          style={{ top: buttonPos.top, left: buttonPos.left }}
          onClick={handleCommentClick}
          type="button"
        >
          comment
        </button>
      )}

      {showForm && (
        <div
          ref={formRef}
          className="selection-comment-form"
          style={{ top: buttonPos.top + 44, left: Math.max(0, buttonPos.left - 140) }}
        >
          <div className="selection-comment-quote">
            &ldquo;{selectedText.length > 80 ? selectedText.slice(0, 80) + "..." : selectedText}&rdquo;
          </div>
          <form onSubmit={handleSubmit}>
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
              rows={2}
              autoFocus
            />
            <div className="selection-comment-actions">
              <button
                type="button"
                className="selection-comment-cancel"
                onClick={handleCancel}
              >
                cancel
              </button>
              <button
                type="submit"
                className="btn-primary comment-submit"
                disabled={submitting || !body.trim()}
              >
                {submitting ? "posting..." : "post"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
