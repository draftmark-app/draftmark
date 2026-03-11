"use client";

import { useState, useEffect } from "react";

type ApiKey = {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
};

export default function AccountApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const res = await fetch("/api/v1/account/api-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.api_keys);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "default" }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data.api_key);
        setNewKeyName("");
        await loadKeys();
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
    }
  }

  return (
    <div className="api-keys-section">
      {revealedKey && (
        <div className="api-key-reveal">
          <p>Copy this key now — it won&apos;t be shown again:</p>
          <code className="api-key-value">{revealedKey}</code>
          <button
            className="btn-ghost btn-small"
            onClick={() => {
              navigator.clipboard.writeText(revealedKey);
            }}
          >
            copy
          </button>
          <button
            className="btn-ghost btn-small"
            onClick={() => setRevealedKey(null)}
          >
            dismiss
          </button>
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

      {keys.length > 0 && (
        <div className="api-keys-list">
          {keys.map((key) => (
            <div key={key.id} className="api-key-item">
              <div className="api-key-info">
                <span className="api-key-name">{key.name}</span>
                <span className="api-key-meta">
                  created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at &&
                    ` · last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                </span>
              </div>
              <button
                className="btn-ghost btn-small"
                onClick={() => handleRevoke(key.id)}
                style={{ color: "var(--method-delete-color)" }}
              >
                revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
