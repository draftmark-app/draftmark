"use client";

import { useState, useCallback } from "react";
import InlineCommentForm from "./InlineCommentForm";

type InlineComment = {
  id: string;
  body: string;
  author: string;
  anchor_ref: number | null;
  doc_version: number | null;
  status: string;
  created_at: string;
};

type Props = {
  content: string;
  slug: string;
  inlineComments: InlineComment[];
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onCommentPosted: () => void;
};

export default function LineNumberedMarkdown({
  content,
  slug,
  inlineComments,
  reviewerName,
  setReviewerName,
  persistReviewerName,
  onCommentPosted,
}: Props) {
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const lines = content.split("\n");

  const handleLineClick = useCallback((lineNum: number) => {
    setActiveLine((prev) => (prev === lineNum ? null : lineNum));
  }, []);

  const commentsForLine = (lineNum: number) =>
    inlineComments.filter((c) => c.anchor_ref === lineNum);

  return (
    <div className="lined-content">
      {lines.map((line, i) => {
        const lineNum = i + 1;
        const lineComments = commentsForLine(lineNum);
        const hasComments = lineComments.length > 0;

        return (
          <div key={lineNum}>
            <div
              className={`lined-row ${hasComments ? "has-comments" : ""} ${activeLine === lineNum ? "active" : ""}`}
              onClick={() => handleLineClick(lineNum)}
            >
              <span className="line-number">{lineNum}</span>
              <span className="line-content">{line || "\u00A0"}</span>
              {hasComments && (
                <span className="line-comment-count">
                  {lineComments.length}
                </span>
              )}
            </div>

            {/* Show existing inline comments */}
            {(activeLine === lineNum || hasComments) &&
              lineComments.map((c) => (
                <div key={c.id} className="inline-comment">
                  <div className="inline-comment-header">
                    <span className="comment-author">{c.author}</span>
                    {c.status !== "open" && (
                      <span className="comment-tag">{c.status}</span>
                    )}
                    {c.doc_version && (
                      <span className="inline-comment-version">
                        v{c.doc_version}
                      </span>
                    )}
                  </div>
                  <p className="inline-comment-body">{c.body}</p>
                </div>
              ))}

            {/* Inline comment form */}
            {activeLine === lineNum && (
              <InlineCommentForm
                slug={slug}
                lineNumber={lineNum}
                reviewerName={reviewerName}
                setReviewerName={setReviewerName}
                persistReviewerName={persistReviewerName}
                onPosted={() => {
                  setActiveLine(null);
                  onCommentPosted();
                }}
                onCancel={() => setActiveLine(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
