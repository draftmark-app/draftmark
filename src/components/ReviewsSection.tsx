"use client";

import { useState, useEffect, useCallback } from "react";

type Review = {
  id: string;
  reviewer_name: string;
  identifier: string;
  created_at: string;
};

type Props = {
  slug: string;
  reviewerName: string;
  setReviewerName: (name: string) => void;
  persistReviewerName: (name: string) => void;
};

export default function ReviewsSection({ slug, reviewerName, setReviewerName, persistReviewerName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(false);

  const getIdentifier = () => {
    let identifier = localStorage.getItem("draftmark:identifier");
    if (!identifier) {
      identifier = crypto.randomUUID();
      localStorage.setItem("draftmark:identifier", identifier);
    }
    return identifier;
  };

  const fetchReviews = useCallback(async () => {
    const res = await fetch(`/api/v1/docs/${slug}/reviews`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews);
      const identifier = getIdentifier();
      setHasReviewed(data.reviews.some((r: Review) => r.identifier === identifier));
    }
  }, [slug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReview = async () => {
    if (loading || hasReviewed) return;
    setLoading(true);

    const identifier = getIdentifier();
    const res = await fetch(`/api/v1/docs/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        reviewer_name: reviewerName.trim() || "anonymous",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setReviews((prev) => [...prev, data]);
      setHasReviewed(true);
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
