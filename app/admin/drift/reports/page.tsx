import Link from "next/link";

export default function ReportsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>Drift</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 10 }}>Reports</h1>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 32 }}>
          Revenue leaking reports and decay trend analysis coming soon.
        </p>
        <Link href="/admin/drift" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Revenue Execution
        </Link>
      </div>
    </div>
  );
}
