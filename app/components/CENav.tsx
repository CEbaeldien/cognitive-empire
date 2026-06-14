"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home",        href: "/home"    },
  { label: "Drift",       href: "/drift"   },
  { label: "Signals",     href: "/signals" },
  { label: "CE Research", href: "/briefs"  },
  { label: "Work",        href: "/work"    },
  { label: "Connect",     href: "/connect" },
];

export default function CENav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while mobile panel is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <style>{`
        .ce-nav-link {
          color: #4D6080;
          text-decoration: none;
          position: relative;
          padding-bottom: 3px;
          font-size: 0.64rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          transition: color 150ms ease;
        }
        .ce-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: transparent;
          transition: background 150ms ease;
        }
        .ce-nav-link:hover { color: #E6EDF7; }
        .ce-nav-link:hover::after { background: rgba(197,162,111,0.28); }

        .ce-nav-active {
          color: #C5A26F;
          text-decoration: none;
          position: relative;
          padding-bottom: 3px;
          font-size: 0.64rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .ce-nav-active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: rgba(197,162,111,0.55);
        }

        .ce-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .ce-wordmark {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #F4F6F8;
          transition: color 150ms ease;
        }
        .ce-brand:hover .ce-wordmark { color: #ffffff; }

        .ce-status-pip {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(197,162,111,0.55);
          flex-shrink: 0; margin-left: 2px; display: inline-block;
        }

        .ce-desktop-links { display: flex; align-items: center; gap: 28px; }

        .ce-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          margin-right: -8px;
        }
        .ce-hamburger span {
          display: block;
          width: 18px;
          height: 1px;
          background: rgba(230,237,247,0.65);
          transition: transform 200ms ease, opacity 200ms ease;
          transform-origin: center;
        }

        .ce-mobile-panel {
          position: fixed;
          inset: 0;
          top: 68px;
          z-index: 49;
          background: #05070B;
          border-top: 1px solid rgba(197,162,111,0.10);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .ce-mobile-nav-item {
          display: block;
          font-size: 0.68rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          padding: 18px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          text-decoration: none;
          transition: color 120ms ease, background 120ms ease;
        }
        .ce-mobile-nav-item:hover { background: rgba(197,162,111,0.03); }

        @media (max-width: 767px) {
          .ce-desktop-links { display: none; }
          .ce-hamburger { display: flex; }
        }
      `}</style>

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 68,
          background: "rgba(5,7,11,0.97)",
          borderBottom: "1px solid rgba(197,162,111,0.14)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            height: "100%",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ── Brand ── */}
          <Link href="/home" className="ce-brand">
            <img
              src="/brand/ce-mark-white.svg"
              alt=""
              aria-hidden="true"
              style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
            />
            <span className="ce-wordmark">Cognitive Empire</span>
            <span className="ce-status-pip" />
          </Link>

          {/* ── Desktop links ── */}
          <div className="ce-desktop-links">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={isActive ? "ce-nav-active" : "ce-nav-link"}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="ce-hamburger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            <span style={open ? { transform: "rotate(45deg) translateY(6px)" }  : {}} />
            <span style={open ? { opacity: 0 }                                   : {}} />
            <span style={open ? { transform: "rotate(-45deg) translateY(-6px)" } : {}} />
          </button>
        </div>
      </nav>

      {/* ── Mobile panel ── */}
      {open && (
        <div className="ce-mobile-panel">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.label}
                href={link.href}
                className="ce-mobile-nav-item"
                style={{ color: isActive ? "#C5A26F" : "#4D6080" }}
              >
                {link.label}
              </Link>
            );
          })}
          <div style={{ padding: "28px 32px", marginTop: "auto" }}>
            <span style={{
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(77,96,128,0.45)",
              fontFamily: "monospace",
            }}>
              CE · Public Interface
            </span>
          </div>
        </div>
      )}
    </>
  );
}
