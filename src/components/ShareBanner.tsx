"use client";

import { useState } from "react";

export default function ShareBanner({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share-banner">
      <div className="share-banner-content">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 10.5L10 6.5" />
          <path d="M8.5 4.5L9.5 3.5a2.12 2.12 0 0 1 3 3L11.5 7.5" />
          <path d="M7.5 8.5L6.5 9.5a2.12 2.12 0 0 0 3 3l1-1" />
        </svg>
        <span className="share-banner-label">Share this private doc:</span>
        <code className="share-banner-url">{url}</code>
        <button className="share-banner-copy" onClick={handleCopy}>
          {copied ? "copied!" : "copy"}
        </button>
      </div>
    </div>
  );
}
