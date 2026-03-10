import Link from "next/link";

export const metadata = {
  title: "About — Draftmark",
};

export default function AboutPage() {
  return (
    <>
      <nav>
        <Link href="/" className="logo">
          draft<span>mark</span>
        </Link>
        <ul>
          <li>
            <Link href="/docs">docs</Link>
          </li>
          <li>
            <Link href="/about">about</Link>
          </li>
        </ul>
        <div className="nav-right">
          <a href="/" className="nav-cta">
            get started &rarr;
          </a>
        </div>
      </nav>

      <main className="static-page">
        <h1>About Draftmark</h1>

        <p>
          Draftmark is an open-source markdown sharing platform designed for
          async collaboration between humans and AI agents. Write a plan, share
          a link, collect structured feedback — then feed it back into your
          workflow.
        </p>

        <h2>Why</h2>
        <p>
          Developers and AI agent workflows produce markdown documents — plans,
          RFCs, proposals, summaries — that need to be shared for review.
          Existing tools weren&apos;t built for the agent &rarr; human &rarr;
          agent handoff pattern. Draftmark is.
        </p>

        <h2>Rumbo Labs</h2>
        <p>
          Draftmark is a{" "}
          <a
            href="https://rumbolabs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rumbo Labs
          </a>{" "}
          project — a small studio focused on building practical tools for
          content and developer teams.
        </p>
      </main>
    </>
  );
}
