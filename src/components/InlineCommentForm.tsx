"use client";

import { useState } from "react";

type Props = {
  slug: string;
  lineNumber: number;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onPosted: () => void;
  onCancel: () => void;
};

export default function InlineCommentForm({
  slug,
  lineNumber,
  reviewerName,
  setReviewerName,
  persistReviewerName,
  onPosted,
  onCancel,
}: Props) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    const res = await fetch(`/api/v1/docs/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: body.trim(),
        author: reviewerName.trim() || undefined,
        anchor_type: "line",
        anchor_ref: lineNumber,
      }),
    });

    if (res.ok) {
      persistReviewerName(reviewerName);
      onPosted();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="inline-comment-form">
      <div className="inline-comment-form-header">
        <span className="doc-view-inline-anchor">line {lineNumber}</span>
        <button type="button" className="inline-comment-cancel" onClick={onCancel}>
          cancel
        </button>
      </div>
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
        placeholder="comment on this line..."
        className="comment-textarea"
        rows={2}
        autoFocus
      />
      <button
        type="submit"
        className="btn-primary comment-submit"
        disabled={submitting || !body.trim()}
      >
        {submitting ? "posting..." : "post"}
      </button>
    </form>
  );
}
