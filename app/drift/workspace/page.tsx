import Link from "next/link";

export const metadata = {
  title: "Drift Workspace — Cognitive Empire",
};

export default function WorkspacePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #05070d 0%, #080d1a 55%, #0b1220 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 45% at 50% 44%, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 480,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0,
        }}
      >
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(59,130,246,0.7)",
          }}
        >
          Drift · Client Workspace
        </p>

        <h1
          style={{
            margin: "0 0 20px",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "#f1f5f9",
          }}
        >
          Workspace access is provisioned per engagement.
        </h1>

        <p
          style={{
            margin: "0 0 40px",
            fontSize: 14,
            lineHeight: 1.75,
            color: "rgba(148,163,184,0.85)",
          }}
        >
          Drift client workspaces are activated as part of an active engagement.
          If your organization has an engagement with Cognitive Empire, access is
          issued directly.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/drift"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "11px 22px",
              border: "1px solid rgba(59,130,246,0.35)",
              background: "rgba(59,130,246,0.07)",
              color: "#93c5fd",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Learn about Drift →
          </Link>

          <Link
            href="/connect"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "11px 22px",
              border: "1px solid rgba(241,245,249,0.1)",
              background: "transparent",
              color: "rgba(148,163,184,0.7)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Contact →
          </Link>
        </div>
      </div>
    </div>
  );
}
