import Link from "next/link";

export default function Nav() {
  return (
    <header style={{ borderBottom: "1px solid var(--ce-border)" }}>
      <div
        style={{
          maxWidth: "64rem",
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--ce-text)",
              letterSpacing: "0.01em",
            }}
          >
            CE
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ce-gold)",
            }}
          >
            Digital Editions
          </span>
        </Link>

        <nav style={{ display: "flex", gap: 20 }}>
          <Link href="/products/operator-kernel" style={{ color: "var(--ce-muted)", fontSize: "0.82rem", textDecoration: "none" }}>
            Operator Kernel
          </Link>
          <Link href="/products/gravity-report" style={{ color: "var(--ce-muted)", fontSize: "0.82rem", textDecoration: "none" }}>
            Gravity Report
          </Link>
        </nav>
      </div>
    </header>
  );
}
