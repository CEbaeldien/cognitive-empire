import Link from "next/link";
import { CEMark } from "./CEMark";

export default function CEFooter() {
  return (
    <footer className="border-t border-[#1e2a45] bg-[#080d1a]">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white">
                <CEMark className="w-5 h-5" />
              </span>
              <span className="text-white text-xs font-bold tracking-widest uppercase">
                Cognitive Empire
              </span>
            </div>
            <p className="text-[#475569] text-xs tracking-widest">
              Signal. Judgment. Systems.
            </p>
          </div>

          {/* Intelligence */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/signals" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Signals
                </Link>
              </li>
              <li>
                <Link href="/ce-research" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  CE Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Systems */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Systems
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/work" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Work
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/connect" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Connect
                </Link>
              </li>
              <li>
                <a
                  href="mailto:founder@cognitiveempire.com"
                  className="text-[#64748b] text-xs hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Legal Hub
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Refunds
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-[#64748b] text-xs hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1e2a45] pt-6 space-y-3">
          <p className="text-[#334155] text-[11px] leading-relaxed max-w-3xl">
            COGNITIVE EMPIRE SYSTEMS LTD is a private company limited by shares registered in England and Wales.
            Company number: 17272459. Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[#334155] text-xs">
              © 2026 Cognitive Empire Systems Ltd. All rights reserved.
            </span>
            <div className="flex items-center gap-2 text-[#334155] text-xs">
              <Link href="/privacy"    className="hover:text-[#64748b] transition-colors">Privacy</Link>
              <span>·</span>
              <Link href="/terms"      className="hover:text-[#64748b] transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/refund"     className="hover:text-[#64748b] transition-colors">Refunds</Link>
              <span>·</span>
              <Link href="/cookies"    className="hover:text-[#64748b] transition-colors">Cookies</Link>
              <span>·</span>
              <Link href="/disclaimer" className="hover:text-[#64748b] transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
