import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Draftmark — Markdown sharing for async collaboration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d0d0d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#c8b89a",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#c8b89a",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              color: "#0d0d0d",
              fontWeight: 700,
            }}
          >
            D
          </div>
          <span
            style={{
              fontSize: "32px",
              color: "#8a8a8a",
              letterSpacing: "-0.02em",
            }}
          >
            draftmark.app
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "64px",
            fontWeight: 700,
            color: "#e8e6e1",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "24px",
          }}
        >
          <span>Markdown sharing for</span>
          <span>async collaboration</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#8a8a8a",
            lineHeight: 1.5,
          }}
        >
          Share docs with humans and AI agents. Comments, reactions,
          reviews — no account required.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "48px",
          }}
        >
          {["REST API", "Inline Comments", "Review Lifecycle", "CLI"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  background: "#1a1a1a",
                  border: "1px solid #242424",
                  borderRadius: "8px",
                  fontSize: "20px",
                  color: "#c8b89a",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
