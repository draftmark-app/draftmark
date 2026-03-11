"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MarkdownPreview from "@/components/MarkdownPreview";

export default function EditDocPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug;
  const token = searchParams.get("token");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [versionNote, setVersionNote] = useState("");
  const [activeTab, setActiveTab] = useState<"source" | "preview">("source");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Magic token required. Add ?token=tok_... to the URL.");
      return;
    }

    async function loadDoc() {
      const res = await fetch(`/api/v1/docs/${slug}?token=${encodeURIComponent(token!)}`);
      if (!res.ok) {
        setError("Failed to load document. Check your magic token.");
        return;
      }
      const data = await res.json();
      setTitle(data.title || "");
      setContent(data.content);
      setVisibility(data.visibility);
      setLoaded(true);
    }

    loadDoc();
  }, [slug, token]);

  async function handleSave() {
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/docs/${slug}?token=${encodeURIComponent(token!)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Magic-Token": token!,
        },
        body: JSON.stringify({
          content,
          title: title || undefined,
          visibility,
          version_note: versionNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push(`/d/${slug}${visibility === "private" ? `?token=${encodeURIComponent(token!)}` : ""}`);
    } catch {
      setError("Failed to save document");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/docs/${slug}`, {
        method: "DELETE",
        headers: { "X-Magic-Token": token! },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete");
        return;
      }

      router.push("/");
    } catch {
      setError("Failed to delete document");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded && !error) {
    return (
      <>
        <Nav />
        <div className="create-page">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="create-page">
        <div className="create-header">
          <h1>Edit document</h1>
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
                onClick={() => setVisibility("private")}
              >
                private
              </button>
            </div>
            <button
              className="btn-ghost"
              onClick={() => setShowDelete(true)}
              disabled={submitting}
              style={{ color: "var(--method-delete-color)" }}
            >
              delete
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={submitting || !loaded}
            >
              {submitting ? "saving..." : "save"}
            </button>
          </div>
        </div>

        {error && <div className="create-error">{error}</div>}

        <input
          type="text"
          className="create-title-input"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          className="create-title-input"
          placeholder="Version note (optional — e.g. 'fixed typos')"
          value={versionNote}
          onChange={(e) => setVersionNote(e.target.value)}
        />

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

        {activeTab === "source" ? (
          <textarea
            className="create-editor"
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

        {showDelete && (
          <div className="delete-confirm">
            <div className="delete-confirm-box">
              <h3>Delete this document?</h3>
              <p>This action cannot be undone. All comments, reactions, and reviews will be permanently deleted.</p>
              <div className="delete-confirm-actions">
                <button
                  className="btn-ghost"
                  onClick={() => setShowDelete(false)}
                  disabled={submitting}
                >
                  cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{ background: "var(--method-delete-color)" }}
                >
                  {submitting ? "deleting..." : "delete permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
