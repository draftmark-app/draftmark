import { ImageResponse } from "next/og";

// Shared 1200×630 OG card matching the root opengraph-image design.
// Landing-page routes call renderOgImage() with page-specific copy so each
// social card is tailored while staying visually consistent with the brand.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type OgImageOptions = {
  /** Small mono-style label above the title, e.g. "// cli". Optional. */
  eyebrow?: string;
  /** Title lines, rendered stacked. */
  title: string[];
  /** Supporting sentence under the title. */
  subtitle: string;
  /** Short pills along the bottom. */
  pills: string[];
};

export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  pills,
}: OgImageOptions) {
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

        {/* Eyebrow */}
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#c8b89a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            {eyebrow}
          </div>
        ) : null}

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
          {title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "#8a8a8a",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "48px",
          }}
        >
          {pills.map((label) => (
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
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
