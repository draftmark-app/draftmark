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

    // Block code (inside <pre>)
    if (lang || content.includes("\n")) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    // Extract code text for copy button
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
  section({ children, ...props }) {
    // Collapsible sections created by rehype
    return <section {...props}>{children}</section>;
  },
};

export default function MarkdownPreview({ content }: { content: string }) {
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
