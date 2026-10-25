"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

type DocCredentials = {
  magic_token: string;
  api_key: string;
  url: string;
  share_token?: string;
  share_url?: string;
};

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStoredCreds(key: string): string | null {
  // Try localStorage first (persistent), fall back to sessionStorage (legacy)
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export default function CreatedPage() {
  const params = useParams();
  const slug = params.slug as string;
  const storageKey = `doc_${slug}`;
  const stored = useSyncExternalStore(
    subscribeToStorage,
    () => readStoredCreds(storageKey),
    () => null
  );
  const creds = useMemo<DocCredentials | null>(() => {
    if (!stored) return null;
    try {
      return JSON.parse(stored) as DocCredentials;
    } catch {
      return null;
    }
  }, [stored]);
  const [copied, setCopied] = useState<string | null>(null);

  // Migrate from sessionStorage to localStorage if needed. Write-only effect:
  // no setState, so it can't trigger cascading renders.
  useEffect(() => {
    if (stored && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, stored);
      sessionStorage.removeItem(storageKey);
    }
  }, [stored, storageKey]);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!creds) {
    return (
      <>
        <Nav />
        <div className="success-page">
          <h1>Document not found</h1>
          <p className="success-desc">
            The credentials for this document are no longer available.
          </p>
          <Link href="/new" className="btn-primary">
            create a new document
          </Link>
        </div>
      </>
    );
  }

  const shareableLink = creds.share_url || creds.url;

  return (
    <>
      <Nav />
      <div className="success-page">
        <div className="success-icon">&#10003;</div>
        <h1>Document created</h1>
        <p className="success-desc">
          Save these credentials — they won&apos;t be shown again.
        </p>

        <div className="cred-cards">
          <div className="cred-card">
            <div className="cred-label">Shareable Link</div>
            {creds.share_url && (
              <div className="cred-hint">
                Anyone with this link can view the document
              </div>
            )}
            <div className="cred-value">
              <code>{shareableLink}</code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(shareableLink, "url")}
              >
                {copied === "url" ? "copied!" : "copy"}
              </button>
            </div>
          </div>

          <div className="cred-card">
            <div className="cred-label">Magic Token</div>
            <div className="cred-hint">
              For editing and deleting this document
            </div>
            <div className="cred-value">
              <code>{creds.magic_token}</code>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard(creds.magic_token, "magic_token")
                }
              >
                {copied === "magic_token" ? "copied!" : "copy"}
              </button>
            </div>
          </div>

          <div className="cred-card">
            <div className="cred-label">API Key</div>
            <div className="cred-hint">
              For programmatic access (comments, reviews, reactions)
            </div>
            <div className="cred-value">
              <code>{creds.api_key}</code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(creds.api_key, "api_key")}
              >
                {copied === "api_key" ? "copied!" : "copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <Link href={`/share/${slug}`} className="btn-primary">
            view document &rarr;
          </Link>
          <Link
            href={`/share/${slug}/edit?token=${encodeURIComponent(creds.magic_token)}`}
            className="btn-ghost"
          >
            edit document
          </Link>
          <Link href="/new" className="btn-ghost">
            create another
          </Link>
        </div>
      </div>
    </>
  );
}
