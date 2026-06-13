"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CEMark } from "./CEMark";

const NAV_LINKS = [
  { label: "Home",        href: "/home"       },
  { label: "Drift",       href: "/drift"       },
  { label: "Signals",     href: "/signals"     },
  { label: "Doctrine",    href: "/doctrine"    },
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
          <span className="text-white">
            <CEMark className="w-6 h-6" />
          </span>
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
