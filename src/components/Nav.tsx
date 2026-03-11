"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type NavLink = { href: string; label: string; anchor?: boolean };

export default function Nav({ links }: { links?: NavLink[] }) {
  const defaultLinks: NavLink[] = [
    { href: "/docs", label: "docs" },
    { href: "/about", label: "about" },
  ];

  const navLinks = links ?? defaultLinks;
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(!!data.user))
      .catch(() => setLoggedIn(false));
  }, []);

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
        {loggedIn === true ? (
          <Link href="/dashboard" className="nav-cta">
            dashboard
          </Link>
        ) : loggedIn === false ? (
          <>
            <Link href="/login" className="nav-link-muted">
              sign in
            </Link>
            <Link href="/new" className="nav-cta">
              start writing &rarr;
            </Link>
          </>
        ) : (
          <Link href="/new" className="nav-cta">
            start writing &rarr;
          </Link>
        )}
      </div>
    </nav>
  );
}
