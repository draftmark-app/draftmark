import Link from "next/link";

type Props = {
  /** "home" shows the richer footer (open source line, api docs, cli, github). */
  variant?: "home" | "landing";
};

const mailStyle = { color: "inherit", textDecoration: "none" } as const;

export default function SiteFooter({ variant = "landing" }: Props) {
  return (
    <footer>
      <Link href="/" className="logo">
        draft<span>mark</span>
      </Link>
      <p>
        {variant === "home" ? (
          <>
            open source <span>&middot;</span> MIT license{" "}
            <span>&middot;</span>{" "}
          </>
        ) : null}
        <a href="mailto:hello@draftmark.app" style={mailStyle}>
          hello@draftmark.app
        </a>
      </p>
      <nav>
        <ul>
          {variant === "home" ? (
            <>
              <li>
                <Link href="/api-docs">api docs</Link>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/draftmark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cli
                </a>
              </li>
            </>
          ) : (
            <li>
              <Link href="/docs">docs</Link>
            </li>
          )}
          <li>
            <Link href="/about">about</Link>
          </li>
          <li>
            <a
              href="https://rumbolabs.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              rumbo labs
            </a>
          </li>
          {variant === "home" ? (
            <li>
              <a
                href="https://github.com/draftmark-app/draftmark"
                target="_blank"
                rel="noopener noreferrer"
              >
                github
              </a>
            </li>
          ) : null}
          <li>
            <Link href="/privacy">privacy</Link>
          </li>
          <li>
            <Link href="/terms">terms</Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
