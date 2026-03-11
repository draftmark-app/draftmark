import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://draftmark.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Draftmark — Markdown sharing for async collaboration",
    template: "%s | Draftmark",
  },
  description:
    "Share markdown docs with humans and AI agents. Inline comments, reactions, reviews, and a full REST API. No account required.",
  keywords: [
    "markdown sharing",
    "async collaboration",
    "AI agent feedback",
    "code review",
    "document sharing",
    "markdown preview",
    "inline comments",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    siteName: "Draftmark",
    type: "website",
    title: "Draftmark — Markdown sharing for async collaboration",
    description:
      "Share markdown docs with humans and AI agents. Inline comments, reactions, reviews, and a full REST API. No account required.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Draftmark — Markdown sharing for async collaboration",
    description:
      "Share markdown docs with humans and AI agents. Inline comments, reactions, reviews, and a full REST API.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
