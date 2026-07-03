import type { ReactNode } from "react";

/*
 * Data for the /vs/[competitor] comparison pages.
 * Add a competitor by adding an entry here — the route, sitemap helper, and
 * cross-links pick it up automatically. Keep comparisons HONEST: include rows
 * where the competitor genuinely wins (draftmark: "no").
 */

export type CompareRow = {
  feature: string;
  /** "yes" | "no" render as ✓ / — ; any other string renders as literal text. */
  draftmark: string;
  competitor: string;
};

export type VisualNode = {
  icon: string;
  label: string;
  highlight?: "accent" | "blue" | "green";
};

export type WhyCard = { icon: string; title: string; body: ReactNode };

export type Comparison = {
  slug: string;
  competitor: string;
  metaDescription: string;
  ogDescription: string;
  heroDesc: ReactNode;
  heroVisual: VisualNode[];
  rows: CompareRow[];
  whyLabel: string;
  whyCards: WhyCard[];
  faq: { q: string; a: string }[];
  cta: ReactNode;
};

const githubGist: Comparison = {
  slug: "github-gist",
  competitor: "GitHub Gist",
  metaDescription:
    "Draftmark vs GitHub Gist for sharing markdown: inline comments, review tracking, agent-friendly REST API, and no account required. See how they compare.",
  ogDescription:
    "Share markdown with inline comments, review tracking, and a full REST API — no account required.",
  heroDesc: (
    <>
      GitHub Gist is great for dropping a snippet online. But if you want people
      — or AI agents — to actually <em>review</em> your markdown, you need
      inline comments, review tracking, and an API. That&apos;s Draftmark.
    </>
  ),
  heroVisual: [
    { icon: "✎", label: "Write markdown", highlight: "accent" },
    { icon: "↗", label: "Share link" },
    { icon: "💬", label: "Inline comments", highlight: "blue" },
    { icon: "✓", label: "Feedback via API", highlight: "green" },
  ],
  rows: [
    { feature: "Shareable markdown link", draftmark: "yes", competitor: "yes" },
    { feature: "Inline line-anchored comments", draftmark: "yes", competitor: "no" },
    { feature: "Reviewers need an account", draftmark: "No", competitor: "GitHub account required" },
    { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
    { feature: "Reactions", draftmark: "yes", competitor: "no" },
    { feature: "Review API (comments/status) for AI agents", draftmark: "yes", competitor: "General gist API, no review model" },
    { feature: "Mermaid diagrams", draftmark: "yes", competitor: "no" },
    { feature: "Raw markdown endpoint", draftmark: "yes", competitor: "yes" },
    { feature: "Version history", draftmark: "yes", competitor: "yes (revisions)" },
    { feature: "Self-hostable (MIT)", draftmark: "yes", competitor: "no" },
  ],
  whyLabel: "// why teams switch",
  whyCards: [
    {
      icon: "[#42]",
      title: "Comments where they belong",
      body: (
        <>
          Feedback anchored to specific lines, not buried in a thread below the
          snippet. Reviewers point at the exact line that needs work.
        </>
      ),
    },
    {
      icon: "[👤]",
      title: "No account for readers",
      body: (
        <>
          Public docs are open to anyone with the link. No GitHub login, no
          sign-up wall between your reviewer and the feedback you need.
        </>
      ),
    },
    {
      icon: "[api]",
      title: "Built for agents",
      body: (
        <>
          A full REST API and CLI. Agents create docs, poll{" "}
          <code>review_complete</code>, and consume comments as JSON — the agent
          &rarr; human &rarr; agent loop, automated.
        </>
      ),
    },
    {
      icon: "[✓]",
      title: "Review lifecycle",
      body: (
        <>
          Set <code>expected_reviews</code> and a <code>review_deadline</code>.
          Draftmark tracks who reviewed, signals when the threshold is met, and
          stops accepting feedback on the deadline or when you close the review.
          Gist has no concept of &ldquo;done.&rdquo;
        </>
      ),
    },
  ],
  faq: [
    {
      q: "Is Draftmark a GitHub Gist alternative?",
      a: "Yes. Both let you share a markdown document via a link. Draftmark adds inline commenting, review tracking, reactions, and a REST API built for AI agents — without requiring the reader to have an account.",
    },
    {
      q: "Do reviewers need an account to comment?",
      a: "No. Anyone with the link can read a public doc and leave inline comments. GitHub Gist requires a GitHub account to comment.",
    },
    {
      q: "Can AI agents use Draftmark programmatically?",
      a: "Yes. Draftmark has a full REST API — agents create docs, poll for feedback, and consume comments as structured JSON. There's also a CLI (npm install -g draftmark).",
    },
  ],
  cta: (
    <>
      Sharing is easy.
      <br />
      <em>Getting reviewed is the hard part.</em>
    </>
  ),
};

const hackmd: Comparison = {
  slug: "hackmd",
  competitor: "HackMD",
  metaDescription:
    "Draftmark vs HackMD for markdown collaboration: review tracking, inline comments, an agent-friendly REST API, and no account required for readers. See how they compare.",
  ogDescription:
    "Review tracking, inline comments, and a full REST API for humans and AI agents.",
  heroDesc: (
    <>
      HackMD is built for writing markdown together in real time. Draftmark is
      built for what happens next — publishing a doc and getting it{" "}
      <em>reviewed</em>, by humans or AI agents, with inline comments, review
      tracking, and an API.
    </>
  ),
  heroVisual: [
    { icon: "✎", label: "Write markdown", highlight: "accent" },
    { icon: "↗", label: "Share link" },
    { icon: "💬", label: "Async review", highlight: "blue" },
    { icon: "✓", label: "review_complete", highlight: "green" },
  ],
  rows: [
    { feature: "Shareable markdown link", draftmark: "yes", competitor: "yes" },
    { feature: "Real-time collaborative editing", draftmark: "no", competitor: "yes" },
    { feature: "Inline line-anchored review comments", draftmark: "yes", competitor: "Comments, not review-oriented" },
    { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
    { feature: "Reviewers need an account to comment", draftmark: "No (public docs)", competitor: "Account required" },
    { feature: "Reactions", draftmark: "yes", competitor: "no" },
    { feature: "REST API built for AI agents", draftmark: "yes", competitor: "Limited API" },
    { feature: "Mermaid diagrams", draftmark: "yes", competitor: "yes" },
    { feature: "Version history", draftmark: "yes", competitor: "yes" },
    { feature: "Self-hostable", draftmark: "yes (MIT)", competitor: "yes (CodiMD)" },
  ],
  whyLabel: "// pick the right tool",
  whyCards: [
    {
      icon: "[✎]",
      title: "Choose HackMD when…",
      body: (
        <>
          You want several people typing in the same document at the same time —
          live co-writing, meeting notes, workshops. Real-time collaboration is
          what it does best.
        </>
      ),
    },
    {
      icon: "[✓]",
      title: "Choose Draftmark when…",
      body: (
        <>
          The doc is written and you need a decision. Share it, track who
          reviewed, set a deadline, and close the loop — the async review
          workflow, not live editing.
        </>
      ),
    },
    {
      icon: "[api]",
      title: "Built for agents",
      body: (
        <>
          A full REST API and CLI. Agents create docs, poll{" "}
          <code>review_complete</code>, and consume comments as JSON — the agent
          &rarr; human &rarr; agent loop, automated.
        </>
      ),
    },
    {
      icon: "[👤]",
      title: "No account for readers",
      body: (
        <>
          Public docs are open to anyone with the link — no sign-up wall between
          your reviewer and the feedback you need.
        </>
      ),
    },
  ],
  faq: [
    {
      q: "Is Draftmark a HackMD alternative?",
      a: "Partly. HackMD is a real-time collaborative markdown editor — great for co-writing a note live. Draftmark is built for the review loop: publish a doc, collect structured feedback (inline comments, reactions, review tracking), and consume it via an API. If you need async review rather than live co-editing, Draftmark fits better.",
    },
    {
      q: "Does HackMD do real-time collaboration and Draftmark doesn't?",
      a: "Correct. HackMD's strength is simultaneous live editing. Draftmark is intentionally async — you write, share a link, and reviewers comment on their own time. Different jobs.",
    },
    {
      q: "Can AI agents use Draftmark programmatically?",
      a: "Yes. Draftmark has a full REST API and a CLI (npm install -g draftmark) designed for the agent → human → agent handoff: agents create docs, poll review status, and read comments as JSON.",
    },
  ],
  cta: (
    <>
      Co-writing is solved.
      <br />
      <em>Getting reviewed isn&apos;t.</em>
    </>
  ),
};

const stackedit: Comparison = {
  slug: "stackedit",
  competitor: "StackEdit",
  metaDescription:
    "Draftmark vs StackEdit: StackEdit is an in-browser markdown editor; Draftmark is for sharing markdown and collecting reviews — inline comments, review tracking, and an agent-friendly REST API.",
  ogDescription:
    "Share markdown and collect structured feedback — inline comments, review tracking, and a full REST API.",
  heroDesc: (
    <>
      StackEdit is a great place to <em>write</em> markdown with cloud sync.
      Draftmark is where you <em>share</em> it — a hosted link with inline
      comments, review tracking, and an API for humans and AI agents.
    </>
  ),
  heroVisual: [
    { icon: "✎", label: "Write markdown", highlight: "accent" },
    { icon: "↗", label: "Share link" },
    { icon: "💬", label: "Inline comments", highlight: "blue" },
    { icon: "✓", label: "Feedback via API", highlight: "green" },
  ],
  rows: [
    { feature: "In-browser markdown editor", draftmark: "yes", competitor: "yes" },
    { feature: "Hosted shareable link", draftmark: "yes", competitor: "Publish/export only" },
    { feature: "Cloud sync (Drive / Dropbox / GitHub)", draftmark: "no", competitor: "yes" },
    { feature: "Inline line-anchored comments", draftmark: "yes", competitor: "no" },
    { feature: "Review tracking & deadlines", draftmark: "yes", competitor: "no" },
    { feature: "Reactions", draftmark: "yes", competitor: "no" },
    { feature: "REST API built for AI agents", draftmark: "yes", competitor: "no" },
    { feature: "Mermaid diagrams", draftmark: "yes", competitor: "yes" },
    { feature: "Version history", draftmark: "yes", competitor: "no" },
    { feature: "Self-hostable", draftmark: "yes (MIT)", competitor: "yes (open source)" },
  ],
  whyLabel: "// pick the right tool",
  whyCards: [
    {
      icon: "[✎]",
      title: "Choose StackEdit when…",
      body: (
        <>
          You want a powerful personal editor with live preview and cloud sync
          to Drive, Dropbox, or GitHub. It&apos;s an excellent writing surface.
        </>
      ),
    },
    {
      icon: "[#42]",
      title: "Choose Draftmark when…",
      body: (
        <>
          You need someone to read and comment. Share a link, get inline
          feedback anchored to specific lines, and track when review is done.
        </>
      ),
    },
    {
      icon: "[api]",
      title: "Built for agents",
      body: (
        <>
          A full REST API and CLI. Agents create docs, poll{" "}
          <code>review_complete</code>, and consume comments as JSON — the agent
          &rarr; human &rarr; agent loop, automated.
        </>
      ),
    },
    {
      icon: "[👤]",
      title: "No account for readers",
      body: (
        <>
          Public docs are open to anyone with the link — no sign-up wall between
          your reviewer and the feedback you need.
        </>
      ),
    },
  ],
  faq: [
    {
      q: "Is Draftmark a StackEdit alternative?",
      a: "They overlap but solve different problems. StackEdit is a rich in-browser markdown editor that syncs to Google Drive, Dropbox, and GitHub. Draftmark is about the step after writing: publishing a doc to a link and collecting structured feedback — inline comments, reactions, and review tracking — from humans or AI agents.",
    },
    {
      q: "Does StackEdit sync to cloud storage and Draftmark doesn't?",
      a: "Correct. StackEdit's strength is editing with cloud sync to Drive, Dropbox, and GitHub. Draftmark stores the doc and gives you a hosted share link plus a review API instead.",
    },
    {
      q: "Can AI agents use Draftmark programmatically?",
      a: "Yes. Draftmark has a full REST API and a CLI (npm install -g draftmark): agents create docs, poll review status, and read comments as JSON. StackEdit has no comparable review API.",
    },
  ],
  cta: (
    <>
      Writing is the easy part.
      <br />
      <em>Getting reviewed is the hard part.</em>
    </>
  ),
};

export const comparisons: Record<string, Comparison> = {
  [githubGist.slug]: githubGist,
  [hackmd.slug]: hackmd,
  [stackedit.slug]: stackedit,
};

export const comparisonSlugs = Object.keys(comparisons);

export function getComparison(slug: string): Comparison | undefined {
  return comparisons[slug];
}
