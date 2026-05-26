import Link from "next/link";

function CELogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
      <polygon
        points="13,1.5 23.99,7.75 23.99,18.25 13,24.5 2.01,18.25 2.01,7.75"
        fill="rgba(0,212,255,0.05)"
        stroke="#00d4ff"
        strokeWidth="1.5"
      />
      <text x="13" y="17" textAnchor="middle" fill="#00d4ff" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        CE
      </text>
    </svg>
  );
}

export default function CEFooter() {
  return (
    <footer className="border-t border-[#1a1a2e] bg-[#050505]">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <div className="grid grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CELogoMark />
              <span className="text-white text-xs font-bold tracking-widest uppercase">
                Cognitive Empire
              </span>
            </div>
            <p className="text-[#4b5563] text-xs tracking-widest">
              Signal. Judgment. Systems.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Products
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/drift" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  Drift
                </Link>
              </li>
            </ul>
          </div>

          {/* Intelligence */}
          <div>
            <h4 className="text-white text-[10px] font-semibold uppercase tracking-widest mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/signals" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  Signals
                </Link>
              </li>
              <li>
                <Link href="/briefs" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  CE Briefs
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
                <Link href="/work" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  Work
                </Link>
              </li>
              <li>
                <Link href="/foundrylabs" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  FoundryLabs
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
                <Link href="/connect" className="text-[#6b7280] text-xs hover:text-white transition-colors">
                  Dr. E Interface
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@cognitiveempire.com"
                  className="text-[#6b7280] text-xs hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a2e] pt-6 flex items-center justify-between">
          <span className="text-[#3b3b4f] text-xs">
            © 2025 Cognitive Empire. All rights reserved.
          </span>
          <div className="flex items-center gap-2 text-[#3b3b4f] text-xs">
            <Link href="/privacy" className="hover:text-[#6b7280] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#6b7280] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/status" className="hover:text-[#6b7280] transition-colors">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
