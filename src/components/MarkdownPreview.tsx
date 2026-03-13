"use client";

import { useState, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MermaidDiagram from "./MermaidDiagram";
import type { Components } from "react-markdown";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
      {copied ? "copied" : "copy"}
    </button>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function textContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return textContent(props.children);
  }
  return "";
}

const components: Components = {
  h2({ children }) {
    const text = textContent(children);
    const id = slugify(text);
    return (
      <h2 id={id}>
        <a href={`#${id}`} className="heading-anchor">#</a>
        {children}
      </h2>
    );
  },
  h3({ children }) {
    const text = textContent(children);
    const id = slugify(text);
    return (
      <h3 id={id}>
        <a href={`#${id}`} className="heading-anchor">#</a>
        {children}
      </h3>
    );
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1];
    const content = String(children).replace(/\n$/, "");

    if (lang === "mermaid") {
      return <MermaidDiagram chart={content} />;
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    let codeText = "";
    if (children && typeof children === "object" && "props" in children) {
      const props = (children as { props: { children?: ReactNode } }).props;
      codeText = String(props.children || "").replace(/\n$/, "");
    }

    return (
      <div className="code-block-wrapper">
        <CopyButton code={codeText} />
        <pre>{children}</pre>
      </div>
    );
  },
};

type Section = {
  heading: string; // raw markdown heading line
  headingText: string; // plain text for summary
  headingId: string;
  content: string;
};

function splitIntoSections(content: string): { preamble: string; sections: Section[] } {
  const lines = content.split("\n");
  let preamble = "";
  const sections: Section[] = [];
  let current: { headingLine: string; text: string; id: string; lines: string[] } | null = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    if (inCodeBlock) {
      if (current) current.lines.push(line);
      else preamble += line + "\n";
      continue;
    }

    // ATX h2: ## heading
    const atxMatch = line.match(/^##\s+(.+?)(?:\s+#+)?$/);
    // Setext h2: text followed by line of ---
    const isSetext = !atxMatch && i + 1 < lines.length &&
      lines[i + 1].match(/^-{3,}\s*$/) &&
      line.trim().length > 0 &&
      !line.startsWith("#") &&
      !line.startsWith(">") &&
      !line.startsWith("-") &&
      !line.startsWith("*");

    if (atxMatch || isSetext) {
      // Save previous section
      if (current) {
        sections.push({
          heading: current.headingLine,
          headingText: current.text,
          headingId: current.id,
          content: current.lines.join("\n"),
        });
      }

      const headingText = atxMatch ? atxMatch[1].trim() : line.trim();
      const headingId = slugify(headingText);
      const headingLine = atxMatch ? line : line;

      current = { headingLine, text: headingText, id: headingId, lines: [] };

      // For setext, skip the underline
      if (isSetext) {
        i++;
      }
    } else {
      if (current) {
        current.lines.push(line);
      } else {
        preamble += line + "\n";
      }
    }
  }

  if (current) {
    sections.push({
      heading: current.headingLine,
      headingText: current.text,
      headingId: current.id,
      content: current.lines.join("\n"),
    });
  }

  return { preamble, sections };
}

function CollapsibleSection({ section }: { section: Section }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="collapsible-section" data-open={isOpen}>
      <button
        className="collapsible-summary"
        id={section.headingId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <a
          href={`#${section.headingId}`}
          className="heading-anchor"
          onClick={(e) => e.stopPropagation()}
        >
          #
        </a>
        <span>{section.headingText}</span>
        <span className="collapsible-chevron" />
      </button>
      {isOpen && (
        <div className="collapsible-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={components}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function MarkdownPreview({ content }: { content: string }) {
  const { preamble, sections } = splitIntoSections(content);
  const hasCollapsible = sections.length >= 1;

  if (!hasCollapsible) {
    return (
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="markdown-body">
      {preamble.trim() && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {preamble}
        </ReactMarkdown>
      )}
      {sections.map((section) => (
        <CollapsibleSection key={section.headingId} section={section} />
      ))}
    </div>
  );
}
