import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Preprocesses comment text so that markdown renders correctly.
 *
 * Two cases:
 * 1. Well-structured content wrapped in ``` fences — agents use these as
 *    delimiters, not code blocks. The content inside is markdown that should
 *    be rendered. We strip fences that wrap markdown (detected by headings
 *    or bold text inside).
 * 2. Single-line content with no newlines — we insert line breaks before
 *    block-level elements so the parser can recognize structure.
 */
function normalizeMarkdown(text: string): string {
  let result = text;

  // Strip ``` fences that wrap markdown content (not actual code).
  // Detected by: content between fences contains markdown block markers
  // like ## headings or **bold** text at line starts.
  result = result.replace(
    /```\w*\n([\s\S]*?)```/g,
    (_match, inner: string) => {
      const hasMarkdown = /^(#{1,6}\s|\*\*|\d+\.\s|-\s)/m.test(inner);
      return hasMarkdown ? "\n\n" + inner + "\n\n" : _match;
    }
  );

  // For single-line content (agent pasted without newlines), restore structure
  if (result.split("\n").length <= 3) {
    // Strip any remaining inline ``` wrappers
    result = result.replace(/```\w*\s?/g, "\n\n");
    // Headings
    result = result.replace(/(#{1,6}\s)/g, "\n\n$1");
    // Numbered list items: 1. **Bold start**
    result = result.replace(/(\d+\.\s\*\*)/g, "\n$1");
    // Unordered list items: - **Text**
    result = result.replace(/(- \*\*)/g, "\n$1");
  }

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
