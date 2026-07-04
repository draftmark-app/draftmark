"use client";

import { useState, useEffect, useCallback } from "react";

type Review = {
  id: string;
  reviewer_name: string;
  reviewer_type: string;
  created_at: string;
};

type Props = {
  slug: string;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
  authToken?: string;
};

export default function ReviewsSection({ slug, reviewerName, setReviewerName, persistReviewerName, authToken }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server dedup is by IP/account, so "you reviewed this" is tracked locally
  // (per-doc, per-browser) rather than derived from the response.
  const reviewedKey = `draftmark:reviewed:${slug}`;

  const fetchReviews = useCallback(async () => {
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/reviews${tokenParam}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews);
      setHasReviewed(localStorage.getItem(reviewedKey) === "1");
    }
  }, [slug, authToken, reviewedKey]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReview = async () => {
    if (loading || hasReviewed) return;
    setLoading(true);

    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    const res = await fetch(`/api/v1/docs/${slug}/reviews${tokenParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewer_name: reviewerName.trim() || "anonymous",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setReviews((prev) => [...prev, data]);
      setHasReviewed(true);
      localStorage.setItem(reviewedKey, "1");
      persistReviewerName(reviewerName);
    }

    setLoading(false);
  };

  return (
    <div className="reviews-section">
      <h3>reviews ({reviews.length})</h3>

      {reviews.length > 0 && (
        <div className="review-badges">
          {reviews.map((r) => (
            <span key={r.id} className="review-badge" title={`Reviewed ${new Date(r.created_at).toLocaleDateString()}`}>
              {r.reviewer_name}
              {r.reviewer_type === "agent" && (
                <span className="badge-agent badge-agent-inline">agent</span>
              )}
            </span>
          ))}
        </div>
      )}

      {!hasReviewed && (
        <div className="review-form">
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="your name (optional)"
            className="comment-author-input"
          />
          <button
            onClick={handleReview}
            disabled={loading}
            className="btn-primary comment-submit"
          >
            {loading ? "submitting..." : "mark as reviewed"}
          </button>
        </div>
      )}
    </div>
  );
}
