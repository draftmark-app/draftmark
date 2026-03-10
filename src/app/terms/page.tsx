import Nav from "@/components/Nav";

export const metadata = {
  title: "Terms of Service — Draftmark",
};

export default function TermsPage() {
  return (
    <>
      <Nav />

      <main className="static-page">
        <h1>Terms of Service</h1>
        <p className="page-updated">Last updated: March 2026</p>

        <h2>The basics</h2>
        <p>
          Draftmark is a markdown sharing platform. By using it, you agree to
          these terms. If you don&apos;t agree, don&apos;t use the service.
        </p>

        <h2>Your content</h2>
        <p>
          You own everything you create on Draftmark. We don&apos;t claim any
          rights to your documents, comments, or other content. You can export
          or delete your data at any time.
        </p>

        <h2>Acceptable use</h2>
        <p>Don&apos;t use Draftmark to:</p>
        <ul>
          <li>Host malware, phishing pages, or illegal content.</li>
          <li>Abuse the API with excessive automated requests.</li>
          <li>Impersonate others in comments.</li>
        </ul>
        <p>
          We reserve the right to remove content or restrict access if these
          rules are violated.
        </p>

        <h2>Availability</h2>
        <p>
          We aim for high uptime but provide no SLA guarantees for the free
          tier. The service is provided &quot;as is&quot;.
        </p>

        <h2>API usage</h2>
        <p>
          API keys are your responsibility. Don&apos;t share them publicly. We
          may rate-limit requests to protect the service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. Continued use of Draftmark after changes
          means you accept the new terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach out at{" "}
          <a href="mailto:hello@draftmark.app">hello@draftmark.app</a>.
        </p>
      </main>
    </>
  );
}
