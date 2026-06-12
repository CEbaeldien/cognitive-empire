"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function CELogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <polygon
        points="13,1.5 23.99,7.75 23.99,18.25 13,24.5 2.01,18.25 2.01,7.75"
        fill="rgba(59,130,246,0.06)"
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      <text x="13" y="17" textAnchor="middle" fill="#3b82f6" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        CE
      </text>
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Home",        href: "/home"       },
  { label: "Drift",       href: "/drift"       },
  { label: "Signals",     href: "/signals"     },
  { label: "CE Research", href: "/briefs"      },
  { label: "Work",        href: "/work"        },
  { label: "FoundryLabs", href: "/foundrylabs" },
  { label: "Connect",     href: "/connect"     },
];

export default function CENav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e2a45] bg-[#080d1a]/96 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <CELogoMark />
          <span className="text-white text-sm font-bold tracking-widest uppercase group-hover:text-blue-400 transition-colors">
            Cognitive Empire
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive
                    ? "text-blue-400 border-b border-blue-500 pb-px"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
