"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MarkdownPreview from "@/components/MarkdownPreview";

export default function NewDocPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [activeTab, setActiveTab] = useState<"source" | "preview">("source");
  const [expectedReviews, setExpectedReviews] = useState("");
  const [reviewDeadline, setReviewDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(!!data.user))
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleCreate() {
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          visibility,
          title: title || undefined,
          expected_reviews: expectedReviews ? parseInt(expectedReviews) : undefined,
          review_deadline: reviewDeadline || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const data = await res.json();
      // Store tokens in sessionStorage for the success page
      sessionStorage.setItem(
        `doc_${data.slug}`,
        JSON.stringify({
          magic_token: data.magic_token,
          api_key: data.api_key,
          url: data.url,
        })
      );
      router.push(`/created/${data.slug}`);
    } catch {
      setError("Failed to create document");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav />
      <div className="create-page">
        <div className="create-header">
          <h1>New document</h1>
          <div className="create-controls">
            <div className="visibility-toggle">
              <button
                className={`vis-btn ${visibility === "public" ? "active" : ""}`}
                onClick={() => setVisibility("public")}
              >
                public
              </button>
              <button
                className={`vis-btn ${visibility === "private" ? "active" : ""}`}
                onClick={() => {
                  if (loggedIn === false) {
                    setError("Sign in to create private documents");
                    return;
                  }
                  setVisibility("private");
                }}
                title={loggedIn === false ? "Sign in required for private docs" : undefined}
              >
                private
              </button>
            </div>
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "creating..." : "create"}
            </button>
          </div>
        </div>

        <input
          type="text"
          className="create-title-input"
          placeholder="Title (optional — extracted from first # heading if blank)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="review-settings">
          <input
            type="number"
            className="review-setting-input"
            placeholder="Expected reviews (optional)"
            value={expectedReviews}
            onChange={(e) => setExpectedReviews(e.target.value)}
            min="1"
          />
          <input
            type="datetime-local"
            className="review-setting-input"
            placeholder="Review deadline (optional)"
            value={reviewDeadline}
            onChange={(e) => setReviewDeadline(e.target.value)}
          />
        </div>

        <div className="tab-bar">
          <button
            className={`tab ${activeTab === "source" ? "active" : ""}`}
            onClick={() => setActiveTab("source")}
          >
            source
          </button>
          <button
            className={`tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            preview
          </button>
        </div>

        {error && <div className="create-error">{error}</div>}

        {activeTab === "source" ? (
          <textarea
            className="create-editor"
            placeholder="Write your markdown here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="create-preview">
            {content ? (
              <MarkdownPreview content={content} />
            ) : (
              <p className="preview-empty">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
