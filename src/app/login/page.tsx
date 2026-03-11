"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      setError("Failed to send login link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav />
      <div className="auth-page">
        {sent ? (
          <div className="auth-card">
            <h1>Check your email</h1>
            <p className="auth-subtitle">
              We sent a login link to <strong>{email}</strong>. Click the link to sign in.
            </p>
            <p className="auth-hint">
              The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        ) : (
          <div className="auth-card">
            <h1>Sign in</h1>
            <p className="auth-subtitle">
              Enter your email to receive a magic login link. No password needed.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="btn-primary auth-btn"
                disabled={submitting}
              >
                {submitting ? "sending..." : "send login link"}
              </button>
            </form>
            <p className="auth-hint">
              An account will be created automatically if you don&apos;t have one yet.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
