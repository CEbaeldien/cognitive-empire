import { siteHoldActive, siteHoldMessage } from "@/lib/site-status";

export default function SiteHoldBanner() {
  if (!siteHoldActive) return null;
  return (
    <div
      role="status"
      style={{
        background: "#050A14",
        borderBottom: "1px solid rgba(197,162,111,0.22)",
        padding: "9px 24px",
        textAlign: "center",
      }}
    >
      <p style={{
        fontSize: "0.7rem",
        letterSpacing: "0.07em",
        color: "#8A9AB8",
        margin: 0,
        lineHeight: 1.65,
      }}>
        {siteHoldMessage}
      </p>
    </div>
  );
}
