"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type UseCase = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

const USE_CASES: UseCase[] = [
  {
    href: "/prompts",
    icon: "✎", // ✎
    title: "Prompt Sharing",
    description:
      "Share, review, and iterate on AI prompts — with inline comments on specific lines and version tracking.",
  },
  {
    href: "/agents",
    icon: "⚙", // ⚙
    title: "Agent Planning",
    description:
      "Share planning sessions from your coding agents. Collect comments and feedback on the approach before any code ships.",
  },
  {
    href: "/rfcs",
    icon: "⚖", // ⚖
    title: "RFCs & Proposals",
    description:
      "Structured async review with deadlines, review tracking, and Mermaid diagrams for technical proposals.",
  },
  {
    href: "/writing",
    icon: "📝", // 📝
    title: "Writing & Content",
    description:
      "Get honest feedback on drafts before publishing. Reactions, inline comments, and clean share links.",
  },
  {
    href: "/share-markdown-online",
    icon: "📄", // 📄
    title: "Docs & Runbooks",
    description:
      "Publish technical docs and runbooks as clean, shareable links your team — and their agents — can read and comment on.",
  },
  {
    href: "/cli",
    icon: "❯", // ❯
    title: "From the Terminal",
    description:
      "Share markdown, poll for feedback as JSON, and close reviews without leaving the shell — with the dm CLI.",
  },
  {
    href: "/skill",
    icon: "✦", // ✦
    title: "For Your Coding Agent",
    description:
      "The Claude Code skill teaches your agent the whole loop — publish a plan, collect feedback, iterate — on its own.",
  },
];

const AUTO_ADVANCE_MS = 4500;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function UseCasesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  // Number of full-viewport "pages" the track scrolls through. Derived from
  // actual layout (not card count) so dots/arrows map to reachable positions
  // across the responsive 1/2/3-cards-per-view breakpoints.
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const pages = Math.max(
      1,
      Math.ceil((track.scrollWidth - 1) / track.clientWidth)
    );
    setPageCount(pages);
    if (activeRef.current > pages - 1) {
      activeRef.current = pages - 1;
      setActive(pages - 1);
    }
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  const scrollToPage = useCallback((page: number) => {
    const track = trackRef.current;
    if (!track) return;
    const left = Math.max(0, page) * track.clientWidth;
    track.scrollTo({
      left,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  // rAF-throttled: only re-render when the active page actually changes.
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const page = Math.round(track.scrollLeft / track.clientWidth);
      if (page !== activeRef.current) {
        activeRef.current = page;
        setActive(page);
      }
    });
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Auto-advance — paused on hover/focus, by the play/pause control, and for
  // users who prefer reduced motion.
  useEffect(() => {
    if (!playing || hovered || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      const next = activeRef.current + 1 >= pageCount ? 0 : activeRef.current + 1;
      scrollToPage(next);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [playing, hovered, pageCount, scrollToPage]);

  return (
    <div
      className="usecases-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Draftmark use cases"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="usecases-track" ref={trackRef} onScroll={handleScroll}>
        {USE_CASES.map((uc) => (
          <Link key={uc.href} href={uc.href} className="usecase-card">
            <div className="usecase-card-icon" aria-hidden="true">
              {uc.icon}
            </div>
            <h3>{uc.title}</h3>
            <p>{uc.description}</p>
            <span className="usecase-card-link">learn more &rarr;</span>
          </Link>
        ))}
      </div>

      <div className="usecases-controls">
        <div className="usecases-dots" role="group" aria-label="Choose slide">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`usecases-dot${i === active ? " active" : ""}`}
              aria-label={`Go to slide ${i + 1} of ${pageCount}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
        <div className="usecases-arrows">
          <button
            type="button"
            className="usecases-arrow"
            aria-label={
              playing
                ? "Pause automatic rotation"
                : "Start automatic rotation"
            }
            aria-pressed={!playing}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "❙❙" : "▶"}
          </button>
          <button
            type="button"
            className="usecases-arrow"
            aria-label="Previous slide"
            onClick={() => scrollToPage(activeRef.current - 1)}
          >
            &larr;
          </button>
          <button
            type="button"
            className="usecases-arrow"
            aria-label="Next slide"
            onClick={() => scrollToPage(activeRef.current + 1)}
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
