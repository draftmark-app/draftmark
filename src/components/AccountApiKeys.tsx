"use client";

import { useState, useEffect, useCallback } from "react";

type ApiKey = {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
};

function getMaskedKey(length = 40): string {
  return "•".repeat(length);
}

function readAndClearWelcomeCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)draftmark_welcome_key=([^;]*)/);
  if (match) {
    // Clear the cookie
    document.cookie =
      "draftmark_welcome_key=; path=/; max-age=0; samesite=lax";
    return decodeURIComponent(match[1]);
  }
  return null;
}

export default function AccountApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  // Map of key id → raw key value (only available at creation time)
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({});
  // Set of key ids currently revealed
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/v1/account/api-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.api_keys);
      return data.api_keys as ApiKey[];
    }
    return [];
  }, []);

  useEffect(() => {
    async function init() {
      const loaded = await loadKeys();
      // Check for welcome cookie (new user's first key)
      const welcomeKey = readAndClearWelcomeCookie();
      if (welcomeKey && loaded.length > 0) {
        // The default key is the most recently created one
        const defaultKey = loaded[loaded.length - 1];
        setRawKeys({ [defaultKey.id]: welcomeKey });
        setRevealed(new Set([defaultKey.id]));
      }
    }
    init();
  }, [loadKeys]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default key" }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyName("");
        const updated = await loadKeys();
        // Find the newly created key
        const newest = updated[updated.length - 1];
        if (newest) {
          setRawKeys((prev) => ({ ...prev, [newest.id]: data.api_key }));
          setRevealed((prev) => new Set(prev).add(newest.id));
        }
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/v1/account/api-keys/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setRawKeys((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setRevealed((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function toggleReveal(id: string) {
    // Can only reveal if we have the raw key
    if (!rawKeys[id]) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleCopy(id: string) {
    const raw = rawKeys[id];
    if (!raw) return;
    navigator.clipboard.writeText(raw);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="api-keys-section">
      {keys.length > 0 && (
        <div className="api-keys-table">
          <div className="api-keys-table-header">
            <span className="api-keys-col-name">Name</span>
            <span className="api-keys-col-key">API Key</span>
            <span className="api-keys-col-actions"></span>
          </div>
          {keys.map((key) => {
            const hasRaw = !!rawKeys[key.id];
            const isRevealed = revealed.has(key.id);

            return (
              <div key={key.id} className="api-keys-table-row">
                <div className="api-keys-col-name">
                  <span className="api-key-name">{key.name}</span>
                  <span className="api-key-meta">
                    {key.last_used_at
                      ? `last used ${new Date(key.last_used_at).toLocaleDateString()}`
                      : `created ${new Date(key.created_at).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="api-keys-col-key">
                  <code className="api-key-masked-value">
                    {isRevealed && hasRaw ? rawKeys[key.id] : getMaskedKey()}
                  </code>
                </div>
                <div className="api-keys-col-actions">
                  {hasRaw && (
                    <>
                      <button
                        className="api-key-icon-btn"
                        onClick={() => toggleReveal(key.id)}
                        title={isRevealed ? "Hide key" : "Show key"}
                        aria-label={isRevealed ? "Hide key" : "Show key"}
                      >
                        {isRevealed ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="api-key-icon-btn"
                        onClick={() => handleCopy(key.id)}
                        title={copiedId === key.id ? "Copied!" : "Copy key"}
                        aria-label="Copy key"
                      >
                        {copiedId === key.id ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                  <button
                    className="api-key-icon-btn api-key-revoke-btn"
                    onClick={() => handleRevoke(key.id)}
                    title="Revoke key"
                    aria-label="Revoke key"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="api-key-create">
        <input
          type="text"
          className="api-key-name-input"
          placeholder="Key name (optional)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <button
          className="btn-primary btn-small"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "creating..." : "create key"}
        </button>
      </div>
    </div>
  );
}
