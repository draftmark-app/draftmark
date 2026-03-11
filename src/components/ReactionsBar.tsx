"use client";

import { useState, useEffect, useCallback } from "react";

const EMOJI_MAP: Record<string, string> = {
  thumbs_up: "\ud83d\udc4d",
  check: "\u2705",
  thinking: "\ud83e\udd14",
  cross: "\u274c",
};

type Props = {
  slug: string;
};

export default function ReactionsBar({ slug }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({
    thumbs_up: 0,
    check: 0,
    thinking: 0,
    cross: 0,
  });
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchReactions = useCallback(async () => {
    const res = await fetch(`/api/v1/docs/${slug}/reactions`);
    if (res.ok) {
      const data = await res.json();
      setCounts(data.reactions);
    }
  }, [slug]);

  useEffect(() => {
    fetchReactions();
    // Load reacted state from localStorage
    const stored = localStorage.getItem(`reactions:${slug}`);
    if (stored) {
      setReacted(new Set(JSON.parse(stored)));
    }
  }, [fetchReactions, slug]);

  const handleReact = async (emoji: string) => {
    if (loading || reacted.has(emoji)) return;
    setLoading(true);

    // Use a stable identifier from localStorage
    let identifier = localStorage.getItem("draftmark:identifier");
    if (!identifier) {
      identifier = crypto.randomUUID();
      localStorage.setItem("draftmark:identifier", identifier);
    }

    const res = await fetch(`/api/v1/docs/${slug}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, identifier }),
    });

    if (res.ok) {
      setCounts((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
      const newReacted = new Set(reacted);
      newReacted.add(emoji);
      setReacted(newReacted);
      localStorage.setItem(
        `reactions:${slug}`,
        JSON.stringify([...newReacted])
      );
    }

    setLoading(false);
  };

  return (
    <div className="reactions-bar">
      {Object.entries(EMOJI_MAP).map(([key, emoji]) => (
        <button
          key={key}
          className={`reaction-btn ${reacted.has(key) ? "reacted" : ""}`}
          onClick={() => handleReact(key)}
          disabled={loading || reacted.has(key)}
          title={key.replace("_", " ")}
        >
          <span className="reaction-emoji">{emoji}</span>
          {counts[key] > 0 && (
            <span className="reaction-count">{counts[key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
