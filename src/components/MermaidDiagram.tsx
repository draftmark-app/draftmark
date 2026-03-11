"use client";

import { useEffect, useRef, useState } from "react";

let mermaidInitialized = false;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;

      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          fontFamily: "var(--font-geist-mono), monospace",
        });
        mermaidInitialized = true;
      }

      if (cancelled || !containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-error">
        <pre>{chart}</pre>
        <span className="mermaid-error-label">mermaid error: {error}</span>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container" />;
}
