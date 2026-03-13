"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

export default function TableOfContents({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scan the rendered DOM for h2/h3 headings
  const scanHeadings = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const els = container.querySelectorAll<HTMLElement>(
      ".markdown-body h2[id], .markdown-body h3[id]"
    );
    const items: TocItem[] = [];
    els.forEach((el) => {
      if (el.id) {
        items.push({
          id: el.id,
          text: el.textContent?.replace(/^#\s*/, "") || "",
          level: el.tagName === "H2" ? 2 : 3,
        });
      }
    });
    setHeadings(items);
  }, [containerRef]);

  // Scan after initial render
  useEffect(() => {
    // Small delay to let react-markdown finish rendering
    const timer = setTimeout(scanHeadings, 100);
    return () => clearTimeout(timer);
  }, [scanHeadings]);

  // Observe heading visibility for active tracking
  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className={`toc ${isOpen ? "toc-open" : ""}`}>
      <button className="toc-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="toc-toggle-label">contents</span>
        <span className="toc-toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <ul className="toc-list">
          {headings.map((h) => (
            <li key={h.id} className={`toc-item toc-level-${h.level}`}>
              <a
                href={`#${h.id}`}
                className={`toc-link ${activeId === h.id ? "toc-active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
