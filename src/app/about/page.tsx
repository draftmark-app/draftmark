import Nav from "@/components/Nav";

export const metadata = {
  title: "About",
  description:
    "Draftmark is a markdown sharing platform for async collaboration between humans and AI agents. Part of Rumbo Labs.",
  openGraph: {
    title: "About Draftmark",
    description:
      "A markdown sharing platform for async collaboration between humans and AI agents.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Nav />

      <main className="static-page">
        <h1>About Draftmark</h1>

        <p>
          Draftmark is a markdown sharing platform designed for async
          collaboration between humans and AI agents. Write a plan, share a
          link, collect structured feedback — then feed it back into your
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
          Draftmark is a Rumbo Labs project — a small studio focused on
          building practical tools for content and developer teams.
        </p>

        <h2>Contact</h2>
        <p>
          Reach out at{" "}
          <a href="mailto:hello@draftmark.app">hello@draftmark.app</a>.
        </p>
      </main>
    </>
  );
}
