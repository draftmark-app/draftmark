"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import AccountApiKeys from "@/components/AccountApiKeys";

type Doc = {
  slug: string;
  seo_slug: string | null;
  title: string | null;
  visibility: string;
  status: string;
  share_token: string | null;
  views_count: number;
  comments_count: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<><Nav /><div className="dashboard-page"><p style={{ color: "var(--muted)" }}>Loading...</p></div></>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [meRes, docsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/v1/account/docs"),
      ]);

      if (!meRes.ok || !docsRes.ok) {
        router.push("/login");
        return;
      }

      const meData = await meRes.json();
      const docsData = await docsRes.json();

      if (!meData.user) {
        router.push("/login");
        return;
      }

      setUserEmail(meData.user.email);
      setDocs(docsData.docs);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="dashboard-page">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-email">{userEmail}</p>
          </div>
          <button className="btn-ghost" onClick={handleLogout}>
            sign out
          </button>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Your documents</h2>
            <Link href="/new" className="btn-primary btn-small">
              new doc
            </Link>
          </div>

          {docs.length === 0 ? (
            <p className="dashboard-empty">
              No documents yet. <Link href="/new">Create your first one.</Link>
            </p>
          ) : (
            <div className="dashboard-docs">
              {docs.map((doc) => (
                <div key={doc.slug} className="dashboard-doc-row">
                  <Link
                    href={`/share/${doc.slug}`}
                    className="dashboard-doc-card"
                  >
                    <div className="dashboard-doc-title">
                      {doc.title || "Untitled"}
                      <span className={`badge-vis badge-${doc.visibility}`}>
                        {doc.visibility}
                      </span>
                      {doc.status === "review_closed" && (
                        <span className="badge-status">closed</span>
                      )}
                    </div>
                    <div className="dashboard-doc-stats">
                      <span>{doc.views_count} views</span>
                      <span>{doc.comments_count} comments</span>
                      <span>{doc.reviews_count} reviews</span>
                      <span className="dashboard-doc-date">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                  {doc.visibility === "private" && doc.share_token && (
                    <button
                      className="dashboard-share-btn"
                      title={copiedSlug === doc.slug ? "Copied!" : "Copy share link"}
                      onClick={() => {
                        const url = `${window.location.origin}/share/${doc.slug}?share_token=${encodeURIComponent(doc.share_token!)}`;
                        navigator.clipboard.writeText(url);
                        setCopiedSlug(doc.slug);
                        setTimeout(() => setCopiedSlug(null), 2000);
                      }}
                    >
                      {copiedSlug === doc.slug ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 10.5L10 6.5" />
                          <path d="M8.5 4.5L9.5 3.5a2.12 2.12 0 0 1 3 3L11.5 7.5" />
                          <path d="M7.5 8.5L6.5 9.5a2.12 2.12 0 0 0 3 3l1-1" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>API Keys</h2>
          <p className="dashboard-hint">
            {isWelcome
              ? "Your default API key is ready. Copy it now — it won't be shown again."
              : "Use account API keys to create and manage docs via the API."}
          </p>
          <AccountApiKeys />
        </section>
      </div>
    </>
  );
}
