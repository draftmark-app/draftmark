import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type NavLink = { href: string; label: string; anchor?: boolean };

export default function Nav({ links }: { links?: NavLink[] }) {
  const defaultLinks: NavLink[] = [
    { href: "/docs", label: "docs" },
    { href: "/about", label: "about" },
  ];

  const navLinks = links ?? defaultLinks;

  return (
    <nav>
      <Link href="/" className="logo">
        draft<span>mark</span>
      </Link>
      <ul>
        {navLinks.map((link) => (
          <li key={link.href}>
            {link.anchor ? (
              <a href={link.href}>{link.label}</a>
            ) : (
              <Link href={link.href}>{link.label}</Link>
            )}
          </li>
        ))}
      </ul>
      <div className="nav-right">
        <ThemeToggle />
        <Link href="/new" className="nav-cta">
          start writing &rarr;
        </Link>
      </div>
    </nav>
  );
}
