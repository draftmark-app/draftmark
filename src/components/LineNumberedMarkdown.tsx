"use client";

import { useState, useCallback, useMemo } from "react";
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
  currentVersion: number;
  inlineComments: InlineComment[];
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  onCommentPosted: () => void;
};

export default function LineNumberedMarkdown({
  content,
  slug,
  currentVersion,
  inlineComments,
  reviewerName,
  setReviewerName,
  persistReviewerName,
  onCommentPosted,
}: Props) {
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const lines = content.split("\n");

  const codeBlockLines = useMemo(() => {
    const inCode = new Set<number>();
    let inside = false;
    lines.forEach((line, i) => {
      if (line.trimStart().startsWith("```")) {
        inCode.add(i + 1);
        inside = !inside;
      } else if (inside) {
        inCode.add(i + 1);
      }
    });
    return inCode;
  }, [lines]);

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
              <span className="line-content">
                <FormattedLine line={line} inCodeBlock={codeBlockLines.has(lineNum)} />
              </span>
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
                    {c.doc_version != null && (
                      <span className={`inline-comment-version${c.doc_version < currentVersion ? " comment-version-stale" : ""}`}>
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

function FormattedLine({ line, inCodeBlock }: { line: string; inCodeBlock: boolean }) {
  if (!line) return <>{"\u00A0"}</>;

  // Code fence markers
  if (line.trimStart().startsWith("```")) {
    const lang = line.trimStart().slice(3).trim();
    return (
      <span className="md-code-fence">
        {line.slice(0, line.indexOf("```"))}```{lang && <span className="md-code-lang">{lang}</span>}
      </span>
    );
  }

  // Inside code blocks — no formatting
  if (inCodeBlock) return <span className="md-code-line">{line}</span>;

  // Headings
  const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    return (
      <span className={`md-heading md-h${level}`}>
        <span className="md-heading-marker">{headingMatch[1]} </span>
        <span className="md-heading-text">{formatInline(headingMatch[2])}</span>
      </span>
    );
  }

  // Horizontal rules
  if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
    return <span className="md-hr">{line}</span>;
  }

  // List items
  const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (listMatch) {
    return (
      <span className="md-list-item">
        {listMatch[1]}<span className="md-list-marker">{listMatch[2]}</span> {formatInline(listMatch[3])}
      </span>
    );
  }

  // Blockquote
  if (line.startsWith(">")) {
    return (
      <span className="md-blockquote">
        <span className="md-blockquote-marker">&gt;</span>{formatInline(line.slice(1))}
      </span>
    );
  }

  // Table rows
  if (line.includes("|")) {
    // Separator row
    if (/^\|?[\s-:|]+\|?$/.test(line)) {
      return <span className="md-table-sep">{line}</span>;
    }
    return <span className="md-table-row">{formatInline(line)}</span>;
  }

  return <>{formatInline(line)}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match: **bold**, `code`, *italic*, [link](url)
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(
        <span key={match.index} className="md-bold">
          <span className="md-marker">**</span>{match[2]}<span className="md-marker">**</span>
        </span>
      );
    } else if (match[3]) {
      // `code`
      parts.push(
        <span key={match.index} className="md-inline-code">
          <span className="md-marker">`</span>{match[3]}<span className="md-marker">`</span>
        </span>
      );
    } else if (match[4]) {
      // *italic*
      parts.push(
        <span key={match.index} className="md-italic">
          <span className="md-marker">*</span>{match[4]}<span className="md-marker">*</span>
        </span>
      );
    } else if (match[5] && match[6]) {
      // [link](url)
      parts.push(
        <span key={match.index} className="md-link">
          <span className="md-marker">[</span>{match[5]}<span className="md-marker">](</span>
          <span className="md-link-url">{match[6]}</span><span className="md-marker">)</span>
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>;
}
