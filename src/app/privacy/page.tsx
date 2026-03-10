import Nav from "@/components/Nav";

export const metadata = {
  title: "Privacy Policy — Draftmark",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />

      <main className="static-page">
        <h1>Privacy Policy</h1>
        <p className="page-updated">Last updated: March 2026</p>

        <h2>What we collect</h2>
        <p>
          Draftmark collects the minimum data needed to operate the service:
        </p>
        <ul>
          <li>
            <strong>Documents</strong> — the markdown content you create, along
            with titles and visibility settings.
          </li>
          <li>
            <strong>Comments</strong> — comment text and the optional display
            name you provide.
          </li>
          <li>
            <strong>Usage data</strong> — view counts, likes, and review
            markers. Likes and reviews are deduplicated using a hashed
            IP/session identifier. We do not store raw IP addresses.
          </li>
        </ul>

        <h2>What we don&apos;t collect</h2>
        <ul>
          <li>No user accounts or email addresses (v1).</li>
          <li>No tracking cookies or third-party analytics.</li>
          <li>No advertising or data sales.</li>
        </ul>

        <h2>API keys &amp; tokens</h2>
        <p>
          API keys and magic tokens are stored hashed. We cannot retrieve your
          original tokens — if lost, you&apos;ll need to generate new ones.
        </p>

        <h2>Data retention</h2>
        <p>
          Documents and comments are stored until you delete them. Deleted
          documents are permanently removed from our database.
        </p>

        <h2>Self-hosting</h2>
        <p>
          If you self-host Draftmark, you control all data. This policy only
          applies to the hosted version at draftmark.app.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach out at{" "}
          <a href="mailto:privacy@draftmark.app">privacy@draftmark.app</a>.
        </p>
      </main>
    </>
  );
}
