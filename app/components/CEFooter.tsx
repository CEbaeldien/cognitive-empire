import Link from "next/link";
import { CEMark } from "./CEMark";

export default function CEFooter() {
  return (
    <footer style={{ borderTop: "1px solid #1e2a45", background: "#080d1a" }}>
      <style>{`
        .cef-link {
          color: #64748b; font-size: 0.72rem; text-decoration: none;
          transition: color 150ms ease;
        }
        .cef-link:hover { color: #fff; }
        .cef-link-dim {
          color: #334155; font-size: 0.72rem; text-decoration: none;
          transition: color 150ms ease;
        }
        .cef-link-dim:hover { color: #64748b; }
        @media (max-width: 640px) {
          .cef-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "48px 32px 28px" }}>

        {/* Brand + Legal columns */}
        <div className="cef-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 48,
          marginBottom: 32,
          alignItems: "flex-start",
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CEMark className="w-5 h-5" style={{ color: "#fff" }} />
              <span style={{
                color: "#fff", fontSize: "0.7rem", fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
              }}>
                Cognitive Empire Systems Ltd
              </span>
            </div>
            <p style={{ color: "#475569", fontSize: "0.7rem", letterSpacing: "0.16em", margin: 0 }}>
              Signal. Judgment. Systems.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              color: "#fff", fontSize: "0.6rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.22em",
              margin: "0 0 14px",
            }}>
              Legal
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Legal Hub",   href: "/legal"      },
                { label: "Privacy",     href: "/privacy"    },
                { label: "Terms",       href: "/terms"      },
                { label: "Refunds",     href: "/refund"     },
                { label: "Cookies",     href: "/cookies"    },
                { label: "Disclaimer",  href: "/disclaimer" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="cef-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom compliance */}
        <div style={{ borderTop: "1px solid #1e2a45", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "#334155", fontSize: "0.69rem", lineHeight: 1.7, maxWidth: "48rem", margin: 0 }}>
            COGNITIVE EMPIRE SYSTEMS LTD is a private company limited by shares registered in England and Wales.
            Company number: 17272459. Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#334155", fontSize: "0.72rem" }}>
              © {new Date().getFullYear()} Cognitive Empire Systems Ltd. All rights reserved.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[
                { label: "Privacy",    href: "/privacy"    },
                { label: "Terms",      href: "/terms"      },
                { label: "Refunds",    href: "/refund"     },
                { label: "Cookies",    href: "/cookies"    },
                { label: "Disclaimer", href: "/disclaimer" },
              ].map(({ label, href }, i, arr) => (
                <span key={href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Link href={href} className="cef-link-dim">{label}</Link>
                  {i < arr.length - 1 && <span style={{ color: "#1e2a45" }}>·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
