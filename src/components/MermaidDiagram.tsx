"use client";

import { useEffect, useRef, useState } from "react";

function getTheme(): "dark" | "default" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "default"
    : "dark";
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;

      const isDark = getTheme() === "dark";
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: isDark
          ? {
              primaryColor: "#1a1a1a",
              primaryTextColor: "#e8e6e1",
              primaryBorderColor: "#3a3a3a",
              lineColor: "#8a7a66",
              secondaryColor: "#242424",
              tertiaryColor: "#141414",
              background: "#141414",
              mainBkg: "#1a1a1a",
              nodeBorder: "#3a3a3a",
              clusterBkg: "#141414",
              clusterBorder: "#3a3a3a",
              edgeLabelBackground: "#141414",
              fontFamily: "var(--font-geist-mono), monospace",
            }
          : {
              primaryColor: "#f0efec",
              primaryTextColor: "#1a1a1a",
              primaryBorderColor: "#ddd9d0",
              lineColor: "#a09070",
              secondaryColor: "#e8e4dc",
              tertiaryColor: "#fafaf8",
              background: "#fafaf8",
              mainBkg: "#f0efec",
              nodeBorder: "#ddd9d0",
              clusterBkg: "#fafaf8",
              clusterBorder: "#ddd9d0",
              edgeLabelBackground: "#fafaf8",
              fontFamily: "var(--font-geist-mono), monospace",
            },
      });

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

    // Re-render on theme change
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") {
          render();
          break;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
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
