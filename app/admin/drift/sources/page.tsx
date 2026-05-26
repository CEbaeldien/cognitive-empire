import Link from "next/link";

export default function DataSourcesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>Drift</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 10 }}>Data Sources</h1>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 32 }}>
          CRM integrations and pipeline data source configuration coming soon.
        </p>
        <Link href="/admin/drift" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Revenue Execution
        </Link>
      </div>
    </div>
  );
}
