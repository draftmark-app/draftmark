import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Preprocesses comment text to restore markdown block structure when
 * newlines are missing (common with agent-pasted content).
 *
 * Agents often paste structured markdown as a single line, wrapping it
 * in ``` delimiters. This preprocessor strips those delimiters and
 * inserts line breaks before block-level elements so the parser can
 * recognize headings, lists, etc.
 */
function normalizeMarkdown(text: string): string {
  // Already has reasonable line structure — skip preprocessing
  if (text.split("\n").length > 3) return text;

  let result = text;

  // Strip ``` wrappers — agents use these as delimiters, not code fences.
  // The content inside is markdown that should be rendered, not shown as code.
  result = result.replace(/```\w*\s?/g, "\n\n");

  // Add line breaks before block-level elements when inline
  // Headings: ## , ### , etc.
  result = result.replace(/(#{1,6}\s)/g, "\n\n$1");
  // Numbered list items: 1. **Bold start** (common agent pattern)
  result = result.replace(/(\d+\.\s\*\*)/g, "\n$1");
  // Unordered list items: - **Text**
  result = result.replace(/(- \*\*)/g, "\n$1");

  // Clean up excessive newlines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

export default function CommentMarkdown({ content }: { content: string }) {
  return (
    <div className="comment-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
