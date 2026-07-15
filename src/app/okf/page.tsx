import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Draftmark & the Open Knowledge Format",
  description:
    "Draftmark speaks OKF — Google Cloud's open, vendor-neutral markdown format for agent knowledge. Export any doc as an OKF concept document and any collection as an OKF bundle, consumable by any agent framework.",
  openGraph: {
    title: "Draftmark is OKF compatible",
    description:
      "Export docs and collections as Open Knowledge Format bundles — plain markdown + YAML frontmatter, git-native, consumable by any agent.",
  },
};

export default function OkfPage() {
  return (
    <>
      <Nav />

      <section className="agents-hero">
        <div className="agents-hero-left">
          <div className="tag">open knowledge format</div>
          <h1>
            Markdown your
            <br />
            agents can <em>read</em>.
          </h1>
          <p className="hero-desc">
            <a
              href="https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              OKF
            </a>{" "}
            is Google Cloud&apos;s open, vendor-neutral spec for representing
            knowledge as a directory of markdown files with YAML frontmatter —
            git-native, no SDK, consumable by any agent. Draftmark speaks it:
            export any doc as an OKF <em>concept document</em>, or any
            collection as an OKF <em>bundle</em>. Same markdown you already
            share, now in a format any agent framework can traverse.
          </p>
          <div className="hero-actions">
            <a
              href="https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              read the OKF spec
            </a>
            <Link href="/docs" className="btn-ghost">
              read the API docs &rarr;
            </Link>
          </div>
        </div>
        <div className="agents-hero-right">
          <div className="code-block">
            <span className="code-comment"># any doc → an OKF concept document</span>
            <br />
            <span className="code-method">$</span>{" "}
            <span className="code-url">curl draftmark.app/share/a1b2c3d4.okf.md</span>
            <br />
            <br />
            <span className="code-key">---</span>
            <br />
            <span className="code-key">type:</span>{" "}
            <span className="code-string">&quot;BigQuery Table&quot;</span>
            <br />
            <span className="code-key">title:</span>{" "}
            <span className="code-string">&quot;Orders&quot;</span>
            <br />
            <span className="code-key">description:</span>{" "}
            <span className="code-string">&quot;One row per order.&quot;</span>
            <br />
            <span className="code-key">resource:</span>{" "}
            <span className="code-string">&quot;draftmark.app/share/a1b2c3d4&quot;</span>
            <br />
            <span className="code-key">tags:</span> [
            <span className="code-string">&quot;sales&quot;</span>]
            <br />
            <span className="code-key">timestamp:</span>{" "}
            <span className="code-string">&quot;2026-07-15T14:30:00Z&quot;</span>
            <br />
            <span className="code-key">---</span>
            <br />
            <br />
            <span className="code-comment"># Orders</span>
            <br />
            One row per completed order.
          </div>
        </div>
      </section>

      {/* WHAT IS OKF */}
      <section className="agents-section">
        <div className="agents-section-label">// what is OKF</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[md]</div>
            <h3>The &quot;LLM wiki&quot; pattern</h3>
            <p>
              LLMs work better with a curated, linked, maintainable library of
              markdown than with repeated document search. OKF formalizes what
              Obsidian vaults, <code>AGENTS.md</code>, and <code>CLAUDE.md</code>{" "}
              already do — into one portable standard.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[type]</div>
            <h3>One required field</h3>
            <p>
              A concept document needs only a <code>type</code> — a free string
              like <code>Runbook</code> or <code>API Endpoint</code>. Everything
              else (<code>title</code>, <code>description</code>,{" "}
              <code>tags</code>) is optional. Consumers tolerate anything.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[git]</div>
            <h3>Git-native</h3>
            <p>
              A bundle is just a directory of <code>.md</code> files. Commit it,
              diff it, read it on GitHub. No database, no registry, no
              proprietary export format to reverse-engineer later.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[∅]</div>
            <h3>No vendor lock-in</h3>
            <p>
              Plain markdown plus YAML — parseable by any LLM or agent
              framework. No Google-specific SDK, no dependency. Works with
              Claude, GPT, open-source models, or anything that reads text.
            </p>
          </div>
        </div>
      </section>

      {/* HOW DRAFTMARK PRODUCES IT */}
      <section className="agents-section">
        <div className="agents-section-label">// how Draftmark produces it</div>
        <div className="agents-steps">
          <div className="agents-step">
            <div className="step-num">00</div>
            <h3>A doc becomes a concept</h3>
            <p>
              Add <code>.okf.md</code> to any share URL — or{" "}
              <code>?format=okf</code> on the API — and Draftmark wraps the
              markdown in OKF frontmatter. <code>title</code>,{" "}
              <code>resource</code>, and <code>timestamp</code> are synthesized;{" "}
              <code>type</code>, <code>description</code>, and <code>tags</code>{" "}
              come from the doc&apos;s <code>meta</code>.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span>{" "}
              <span className="code-url">curl draftmark.app/share/a1b2c3d4.okf.md</span>
              <br />
              <span className="code-comment"># or the API</span>
              <br />
              <span className="code-method">$</span> curl
              &quot;draftmark.app/api/v1/docs/a1b2c3d4?format=okf&quot;
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">01</div>
            <h3>A collection becomes a bundle</h3>
            <p>
              Ask a <Link href="/docs">collection</Link> for{" "}
              <code>?format=okf</code> and Draftmark returns a bundle manifest —
              a generated <code>index.md</code>, a <code>log.md</code> changelog
              built from edit history, and one{" "}
              <code>concepts/&#123;slug&#125;.md</code> per member, ordered as
              you arranged them. Labels become the index entries, and links
              between members are rewritten to bundle-relative paths so the tree
              navigates offline. Want the whole thing as a file? Hit{" "}
              <code>/c/&#123;slug&#125;.okf</code> for a gzipped tarball you can{" "}
              <code>tar -xz</code> straight into a repo.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> curl
              &quot;draftmark.app/api/v1/collections/sales?format=okf&quot;
              <br />
              <br />
              <span className="code-key">okf_version:</span>{" "}
              <span className="code-string">&quot;0.1&quot;</span>
              <br />
              <span className="code-key">files:</span>
              <br />
              &nbsp;&nbsp;- index.md
              <br />
              &nbsp;&nbsp;- concepts/orders.md
              <br />
              &nbsp;&nbsp;- concepts/customers.md
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">02</div>
            <h3>Private stays private</h3>
            <p>
              Anonymous exports include public docs only. A collection owner —
              with the magic token, API key, or owning account — gets private
              members too. Nothing leaks that the caller couldn&apos;t already
              read with the doc&apos;s own credential.
            </p>
            <div className="agents-code">
              <span className="code-comment"># public docs only</span>
              <br />
              <span className="code-method">$</span> curl
              &quot;.../collections/sales?format=okf&quot;
              <br />
              <span className="code-comment"># + private members</span>
              <br />
              <span className="code-method">$</span> curl -H{" "}
              <span className="code-string">&quot;Authorization: Bearer key_...&quot;</span>{" "}
              ...
            </div>
          </div>

          <div className="agents-step">
            <div className="step-num">03</div>
            <h3>Any agent consumes it</h3>
            <p>
              The output is plain markdown. Feed a concept doc into a prompt,
              stream a bundle into a vector store, or unpack the tarball into a
              repo your agents already read. Nothing about it is
              Draftmark-specific.
            </p>
            <div className="agents-code">
              <span className="code-method">$</span> curl -L
              draftmark.app/c/sales.okf \
              <br />
              &nbsp;&nbsp;| tar -xz
              <br />
              <span className="code-comment">
                # → sales/index.md, sales/log.md, sales/concepts/…
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* THE MAPPING */}
      <section className="agents-section">
        <div className="agents-section-label">// the mapping</div>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">[→]</div>
            <h3>Collection → bundle</h3>
            <p>
              A collection is a directory of concepts. Its title heads the
              generated <code>index.md</code>; member order and labels drive the
              listing.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[→]</div>
            <h3>Doc → concept document</h3>
            <p>
              Each doc becomes one <code>concepts/&#123;slug&#125;.md</code> with
              synthesized frontmatter and its markdown body, untouched.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[→]</div>
            <h3>meta → frontmatter</h3>
            <p>
              <code>meta.type</code>, <code>meta.description</code>, and{" "}
              <code>meta.tags</code> flow straight into the OKF fields.{" "}
              <code>type</code> defaults to <code>Document</code>.
            </p>
          </div>
          <div className="feature">
            <div className="feature-icon">[→]</div>
            <h3>share URL → resource</h3>
            <p>
              The canonical share link becomes the concept&apos;s{" "}
              <code>resource</code> URI; the doc&apos;s last update becomes its{" "}
              <code>timestamp</code>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="agents-cta">
        <h2>
          Curated markdown,
          <br />
          <em>portable knowledge.</em>
        </h2>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/new" className="btn-primary">
            create a doc
          </Link>
          <a
            href="https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            read the OKF spec &rarr;
          </a>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
