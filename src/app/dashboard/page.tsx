"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import AccountApiKeys from "@/components/AccountApiKeys";

type Doc = {
  slug: string;
  seo_slug: string | null;
  title: string | null;
  visibility: string;
  status: string;
  views_count: number;
  comments_count: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

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
                <Link
                  key={doc.slug}
                  href={`/d/${doc.slug}`}
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
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Account API keys</h2>
          <p className="dashboard-hint">
            Use account API keys (<code>acct_...</code>) to create and manage docs via the API.
          </p>
          <AccountApiKeys />
        </section>
      </div>
    </>
  );
}
