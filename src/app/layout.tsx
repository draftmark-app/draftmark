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
  title: "Draftmark — Share your thinking",
  description:
    "Write in markdown. Render beautifully. Share with humans or agents. Collect feedback — then feed it back into your workflow.",
  openGraph: {
    siteName: "Draftmark",
    type: "website",
    title: "Draftmark — Share your thinking",
    description:
      "Write in markdown. Render beautifully. Share with humans or agents. Collect feedback — then feed it back into your workflow.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary",
    title: "Draftmark — Share your thinking",
    description:
      "Markdown sharing for async collaboration between humans and AI agents.",
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
