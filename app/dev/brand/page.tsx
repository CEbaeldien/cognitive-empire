import { readFileSync } from "fs";
import { join } from "path";

function svgInline(publicPath: string, w: number, h?: number): string {
  const file = readFileSync(join(process.cwd(), "public", publicPath), "utf8");
  const dims = h !== undefined ? `width="${w}" height="${h}"` : `width="${w}"`;
  // Inject explicit dimensions into the SVG root so the element has a defined size
  return file.replace(/<svg /, `<svg ${dims} `);
}

const SIZES = [256, 64, 32, 16];

const MARKS = [
  { label: "Full mark",    src: "brand/ce-mark-full.svg"    },
  { label: "Reduced mark", src: "brand/ce-mark-reduced.svg" },
];

const EXTRAS = [
  { label: "Wordmark", src: "brand/ce-wordmark.svg", w: 400, h: undefined },
  { label: "Lockup",   src: "brand/ce-lockup.svg",   w: 360, h: undefined },
  { label: "Favicon SVG (fixed colors)", src: "brand/ce-favicon.svg", w: 128, h: 128 },
];

const DARK  = { background: "#050505", color: "#ffffff" } as const;
const LIGHT = { background: "#ffffff", color: "#050505" } as const;

export default function BrandVerificationPage() {
  return (
    <div style={{ fontFamily: "monospace", background: "#0a0a0f", minHeight: "100vh", padding: 40, color: "#ccc" }}>
      <h1 style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 40, color: "#fff" }}>
        CE Brand — /dev/brand
      </h1>

      {/* Mark scale strips */}
      {MARKS.map((mark) => (
        <section key={mark.src} style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
            {mark.label}
          </p>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-end", flexWrap: "wrap" }}>
            {SIZES.map((size) => (
              <div key={size}>
                {/* Dark tile */}
                <div
                  style={{ ...DARK, display: "inline-block", padding: 8 }}
                  dangerouslySetInnerHTML={{ __html: svgInline(mark.src, size, size) }}
                />
                <p style={{ fontSize: 9, color: "#444", marginTop: 5, textAlign: "center" }}>{size}px dark</p>

                {/* Light tile */}
                <div
                  style={{ ...LIGHT, display: "inline-block", padding: 8, marginTop: 8 }}
                  dangerouslySetInnerHTML={{ __html: svgInline(mark.src, size, size) }}
                />
                <p style={{ fontSize: 9, color: "#444", marginTop: 5, textAlign: "center" }}>{size}px light</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Wordmark, lockup, favicon SVG */}
      {EXTRAS.map((item) => (
        <section key={item.src} style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
            {item.label}
          </p>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div
                style={{ ...DARK, display: "inline-block", padding: 24 }}
                dangerouslySetInnerHTML={{ __html: svgInline(item.src, item.w, item.h) }}
              />
              <p style={{ fontSize: 9, color: "#444", marginTop: 6 }}>dark</p>
            </div>
            <div>
              <div
                style={{ ...LIGHT, display: "inline-block", padding: 24 }}
                dangerouslySetInnerHTML={{ __html: svgInline(item.src, item.w, item.h) }}
              />
              <p style={{ fontSize: 9, color: "#444", marginTop: 6 }}>light</p>
            </div>
          </div>
        </section>
      ))}

      {/* PNG favicon row */}
      <section style={{ marginBottom: 56 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
          Favicon PNGs (generated)
        </p>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
          {[
            { src: "/favicon-16.png",       label: "16px"       },
            { src: "/favicon-32.png",       label: "32px"       },
            { src: "/apple-touch-icon.png", label: "180px (ATC)" },
            { src: "/icon-192.png",         label: "192px"       },
          ].map(({ src, label }) => (
            <div key={src} style={{ ...DARK, display: "inline-block", padding: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={label} style={{ display: "block", imageRendering: "pixelated" }} />
              <p style={{ fontSize: 9, color: "#444", marginTop: 4, textAlign: "center" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
