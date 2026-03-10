"use client";

import { useState } from "react";
import MarkdownPreview from "./MarkdownPreview";

type DocData = {
  slug: string;
  title: string | null;
  content: string;
  visibility: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function DocView({ doc }: { doc: DocData }) {
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");

  const timeAgo = getTimeAgo(new Date(doc.createdAt));

  return (
    <div className="doc-view">
      <div className="doc-view-header">
        <div className="doc-view-title-row">
          <h1 className="doc-view-title">{doc.title || "Untitled"}</h1>
          <span className={`badge badge-${doc.visibility}`}>
            {doc.visibility}
          </span>
        </div>
        <div className="doc-view-meta">
          <span>{timeAgo}</span>
          <span>{doc.viewsCount} views</span>
        </div>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          preview
        </button>
        <button
          className={`tab ${activeTab === "source" ? "active" : ""}`}
          onClick={() => setActiveTab("source")}
        >
          source
        </button>
      </div>

      {activeTab === "preview" ? (
        <div className="doc-view-body">
          <MarkdownPreview content={doc.content} />
        </div>
      ) : (
        <pre className="doc-view-source">{doc.content}</pre>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
