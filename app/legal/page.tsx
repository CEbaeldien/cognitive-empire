import Link from "next/link";
import CENav from "../components/CENav";
import CEFooter from "../components/CEFooter";

export const metadata = {
  title: "Legal — Cognitive Empire",
};

const POLICIES = [
  { label: "Privacy Policy",  href: "/privacy",    desc: "How we collect, use, and protect personal data." },
  { label: "Terms of Use",    href: "/terms",       desc: "Conditions governing use of CE sites and products." },
  { label: "Refund Policy",   href: "/refund",      desc: "Purchase, subscription, and refund eligibility." },
  { label: "Cookie Policy",   href: "/cookies",     desc: "Cookies and tracking technologies we use." },
  { label: "Disclaimer",      href: "/disclaimer",  desc: "Scope and limits of CE content and outputs." },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-[#f1f5f9]">
      <CENav />

      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-6">
          Legal
        </p>
        <h1 className="text-4xl font-thin text-[#f1f5f9] mb-6">
          Legal Information
        </h1>
        <p className="text-[#64748b] leading-relaxed mb-12">
          Cognitive Empire Systems Ltd operates this website and its associated products. The pages below govern your use of our site, products, and services.
        </p>

        {/* Entity identity */}
        <div className="p-6 bg-[#0f1629] border border-[#1e2a45] mb-12">
          <h2 className="text-sm font-semibold text-[#f1f5f9] uppercase tracking-widest mb-5">
            Operator Identity
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Legal name</dt>
              <dd className="text-[#94a3b8]">Cognitive Empire Systems Ltd</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Company type</dt>
              <dd className="text-[#94a3b8]">Private company limited by shares</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Jurisdiction</dt>
              <dd className="text-[#94a3b8]">Registered in England and Wales</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Company number</dt>
              <dd className="text-[#94a3b8]">17272459</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Registered office</dt>
              <dd className="text-[#94a3b8]">71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-[#475569] w-44 shrink-0">Contact</dt>
              <dd>
                <a href="mailto:founder@cognitiveempire.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                  founder@cognitiveempire.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Policy links */}
        <h2 className="text-sm font-semibold text-[#f1f5f9] uppercase tracking-widest mb-5">
          Policies
        </h2>
        <div className="space-y-3">
          {POLICIES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="flex items-start justify-between gap-4 p-5 bg-[#0f1629] border border-[#1e2a45] hover:border-blue-500/30 transition-colors group"
            >
              <div>
                <p className="text-[#f1f5f9] text-sm font-medium group-hover:text-blue-400 transition-colors">{p.label}</p>
                <p className="text-[#64748b] text-xs mt-1">{p.desc}</p>
              </div>
              <span className="text-[#334155] group-hover:text-blue-400 transition-colors shrink-0 mt-0.5">→</span>
            </Link>
          ))}
        </div>
      </div>

      <CEFooter />
    </div>
  );
}
