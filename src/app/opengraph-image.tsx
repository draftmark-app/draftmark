import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Draftmark — Markdown sharing for async collaboration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "42px",
              fontWeight: 400,
              color: "#e0e0e0",
              letterSpacing: "-0.02em",
            }}
          >
            draft
          </span>
          <span
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            mark
          </span>
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
          }}
        >
          Markdown sharing for
          <br />
          async collaboration
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#888888",
            lineHeight: 1.5,
          }}
        >
          Share with humans and AI agents. Comments, reactions, reviews, and a
          full REST API.
        </div>
      </div>
    ),
    { ...size }
  );
}
