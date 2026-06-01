"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Cognition Core ────────────────────────────────────────────────────────────

function CognitionCore() {
  const hexPoints = (r: number) =>
    [0, 60, 120, 180, 240, 300]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return `${(200 + r * Math.cos(rad)).toFixed(2)},${(200 + r * Math.sin(rad)).toFixed(2)}`;
      })
      .join(" ");

  const ringDots = (radius: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const rad = ((i * 360) / count) * (Math.PI / 180);
      return {
        x: parseFloat((200 + radius * Math.cos(rad)).toFixed(4)),
        y: parseFloat((200 + radius * Math.sin(rad)).toFixed(4)),
      };
    });

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        viewBox="0 0 400 400"
        className="w-[320px] h-[320px] max-w-full"
        style={{ filter: "drop-shadow(0 0 28px rgba(0,212,255,0.14))" }}
      >
        <defs>
          <radialGradient id="core-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
          <filter id="fglow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="200" cy="200" r="190" fill="url(#core-bg)" />
        <circle cx="200" cy="200" r="175" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.08" />
        <circle cx="200" cy="200" r="155" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.12" />

        {/* Slow CW rotating outer ring */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle cx="200" cy="200" r="135" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.18" />
          {ringDots(135, 8).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="2.5" fill="#00d4ff" opacity="0.55" filter="url(#fglow)" />
          ))}
        </motion.g>

        {/* Medium CCW rotating ring */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle cx="200" cy="200" r="108" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.22" />
          {ringDots(108, 6).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="2" fill="#00d4ff" opacity="0.5" filter="url(#fglow)" />
          ))}
        </motion.g>

        <circle cx="200" cy="200" r="80" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.25" />

        <polygon points={hexPoints(62)} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.42" filter="url(#fglow)" />
        <polygon points={hexPoints(30)} fill="rgba(0,212,255,0.04)" stroke="#00d4ff" strokeWidth="1" opacity="0.62" filter="url(#fglow)" />

        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={(200 + 30 * Math.cos(rad)).toFixed(2)} y1={(200 + 30 * Math.sin(rad)).toFixed(2)}
              x2={(200 + 62 * Math.cos(rad)).toFixed(2)} y2={(200 + 62 * Math.sin(rad)).toFixed(2)}
              stroke="#00d4ff" strokeWidth="0.5" opacity="0.2"
            />
          );
        })}

        {/* Expanding pulse ring */}
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ scale: [1, 1.9], opacity: [0.22, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeOut", repeatDelay: 1.5 }}
        >
          <circle cx="200" cy="200" r="80" fill="none" stroke="#00d4ff" strokeWidth="0.8" />
        </motion.g>

        <motion.circle cx="200" cy="200" r="4" fill="#00d4ff" filter="url(#fglow)"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconDrift() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconSignals() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
    </svg>
  );
}

function IconOps() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
      <line x1="12" y1="9" x2="12" y2="15" />
    </svg>
  );
}

function IconBriefs() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconContact() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ─── Inline Panels ─────────────────────────────────────────────────────────────

const inputCls = "bg-[#05050a] border border-[#1a1a2e] px-3 py-2 text-xs text-white placeholder:text-[#3d3d55] focus:outline-none focus:border-[#00d4ff]/40 transition-colors w-full";
const btnPrimaryCls = "px-5 py-2 bg-[#00d4ff] text-black text-xs font-bold uppercase tracking-wide hover:bg-[#00b8d9] transition-colors";
const btnOutlineCls = "px-5 py-2 border border-[#00d4ff]/50 text-[#00d4ff] text-xs uppercase tracking-wide hover:border-[#00d4ff] transition-colors";
const optionCls = (active: boolean) =>
  `px-4 py-2 border text-xs transition-all duration-150 ${active ? "border-[#00d4ff] text-white" : "border-[#1a1a2e] text-[#6b7280] hover:border-[#00d4ff]/40 hover:text-white"}`;

function PanelHeader({ quote, onClose }: { quote: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <p className="text-[#9ca3af] text-sm max-w-2xl leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <button onClick={onClose} className="text-[#4b5563] hover:text-white text-xs ml-8 shrink-0 transition-colors">
        close ×
      </button>
    </div>
  );
}

function DriftPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const opts = ["Fractional CRO / RevOps", "Founder-led sales", "Small sales team", "Multi-client operator"];
  return (
    <div>
      <PanelHeader onClose={onClose} quote="Drift detects revenue decay before it becomes revenue loss. Designed for operators managing active pipelines, interventions, and execution accountability." />
      <p className="text-white text-[10px] uppercase tracking-widest mb-4 font-semibold">What type of environment are you managing?</p>
      <div className="flex flex-wrap gap-3 mb-6">
        {opts.map((o) => (
          <button key={o} onClick={() => setSelected(o)} className={optionCls(selected === o)}>{o}</button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex gap-4">
            <Link href="/drift" className={btnPrimaryCls}>Start Drift Trial</Link>
            <a href="mailto:contact@cognitiveempire.com?subject=Drift%20Walkthrough%20Request" className={btnOutlineCls}>Request Walkthrough</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SignalsPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const opts = ["AI", "Robotics", "Infrastructure", "Market shifts", "Multi-domain convergence"];
  return (
    <div>
      <PanelHeader onClose={onClose} quote="Signals surfaces structural shifts before they become public knowledge. Built for analysts and operators tracking multi-domain convergence." />
      <p className="text-white text-[10px] uppercase tracking-widest mb-4 font-semibold">What are you trying to monitor more effectively?</p>
      <div className="flex flex-wrap gap-3 mb-6">
        {opts.map((o) => (
          <button key={o} onClick={() => setSelected(o)} className={optionCls(selected === o)}>{o}</button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex gap-4">
            <Link href="/signals" className={btnPrimaryCls}>Access Signals</Link>
            <a href="mailto:contact@cognitiveempire.com?subject=Signals%20Demo%20Request" className={btnOutlineCls}>Request Demo</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OpsPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [problem, setProblem] = useState("");
  const [form, setForm] = useState({ name: "", email: "", org: "", message: "" });
  const problems = ["Revenue execution", "Workflow chaos", "Signal overload", "Operational visibility", "Governance / escalation", "Other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(`Problem Area: ${problem}\nName: ${form.name}\nOrganization: ${form.org}\n\nMessage:\n${form.message}`);
    window.location.href = `mailto:ops@cognitiveempire.com?subject=${encodeURIComponent(`Operational Inquiry: ${problem}`)}&body=${body}`;
  };

  return (
    <div>
      <PanelHeader onClose={onClose} quote="Cognitive Empire builds execution systems for operators who can't afford operational drift. Tell us what you're trying to solve." />
      {step === "select" ? (
        <>
          <p className="text-white text-[10px] uppercase tracking-widest mb-4 font-semibold">What operational problem are you trying to solve?</p>
          <div className="flex flex-wrap gap-3">
            {problems.map((p) => (
              <button key={p} onClick={() => { setProblem(p); setStep("form"); }}
                className="px-4 py-2 border border-[#1a1a2e] text-[#6b7280] text-xs hover:border-[#00d4ff]/40 hover:text-white transition-all duration-150">
                {p}
              </button>
            ))}
          </div>
        </>
      ) : (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[#00d4ff] text-xs border border-[#00d4ff]/30 px-3 py-1">{problem}</span>
            <button type="button" onClick={() => setStep("select")} className="text-[#4b5563] text-xs hover:text-white transition-colors">change</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
            <input placeholder="Organization" value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} className={inputCls} />
          </div>
          <textarea required placeholder="Describe what you're trying to solve..." rows={3} value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className={`${inputCls} resize-none mb-5`} />
          <button type="submit" className={btnPrimaryCls}>Route Inquiry →</button>
        </motion.form>
      )}
    </div>
  );
}

function ContactPanel({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", org: "", inquiryType: "", message: "" });
  const types = ["Product Inquiry", "Strategic Partnership", "Press & Media", "Investment", "General"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(`Name: ${form.name}\nOrganization: ${form.org}\nInquiry Type: ${form.inquiryType || "General"}\n\nMessage:\n${form.message}`);
    window.location.href = `mailto:contact@cognitiveempire.com?subject=${encodeURIComponent(form.inquiryType || "Contact Inquiry")}&body=${body}`;
  };

  return (
    <div>
      <PanelHeader onClose={onClose} quote="Direct institutional contact for partnerships, strategic discussions, and serious inquiries." />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
          <input placeholder="Organization" value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} className={inputCls} />
        </div>
        <select value={form.inquiryType} onChange={(e) => setForm((f) => ({ ...f, inquiryType: e.target.value }))}
          className={`${inputCls} mb-3 appearance-none`}>
          <option value="">Inquiry Type</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea required placeholder="Your message..." rows={4} value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={`${inputCls} resize-none mb-5`} />
        <button type="submit" className={btnPrimaryCls}>Route Inquiry →</button>
      </form>
    </div>
  );
}

// ─── Card data ─────────────────────────────────────────────────────────────────

type CardDef = { id: number; number: string; Icon: React.FC; title: string; description: string };

const CARDS: CardDef[] = [
  { id: 1, number: "01", Icon: IconDrift, title: "EXPLORE DRIFT", description: "Revenue decay detection and intervention systems for active pipeline environments." },
  { id: 2, number: "02", Icon: IconSignals, title: "EXPLORE SIGNALS", description: "Strategic signal intelligence and convergence analysis for informed advantage." },
  { id: 3, number: "03", Icon: IconOps, title: "DISCUSS OPERATIONAL SYSTEMS", description: "Execution, governance, and operational intelligence systems built for serious operators." },
  { id: 4, number: "04", Icon: IconBriefs, title: "READ CE RESEARCH", description: "Operator-grade intelligence, execution reports, and structural analysis." },
  { id: 5, number: "05", Icon: IconContact, title: "CONTACT COGNITIVE EMPIRE", description: "Direct inquiries, partnerships, and strategic discussions." },
];

const NAV_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Drift", href: "/drift" },
  { label: "Signals", href: "/signals" },
  { label: "CE Research", href: "/briefs" },
  { label: "Work", href: "/work" },
  { label: "FoundryLabs", href: "/foundrylabs" },
  { label: "Connect", href: "/connect", active: true },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const router = useRouter();

  const handleCardClick = (id: number) => {
    if (id === 4) { router.push("/briefs"); return; }
    setActiveCard((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor-blink { animation: cursor-blink 1s step-end infinite; }
        select option { background-color: #0a0a0f; color: #fff; }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a2e] bg-[#050505]/96 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/home" className="text-white text-base font-bold tracking-widest uppercase">
            Cognitive Empire
          </Link>
          <div className="flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href}
                className={`text-sm px-1 transition-colors ${link.active ? "text-white border-b border-white pb-px" : "text-[#6b7280] hover:text-white"}`}>
                {link.label}
              </Link>
            ))}
          </div>
          <span className="text-[#00d4ff] text-sm font-mono tracking-wider">• DR. E INTERFACE</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 gap-16 items-center">
          <div>
            <h1
              className="leading-none font-mono font-[200] tracking-wider text-white mb-3"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}
            >
              DR. E<span className="cursor-blink font-[400]" style={{ letterSpacing: 0 }}>_</span>
            </h1>
            <p className="text-sm text-[#00d4ff] uppercase tracking-[0.45em] mb-3">
              Public Interface of Cognitive Empire
            </p>
            <p className="text-xl text-white/65 max-w-lg leading-relaxed mb-5">
              Structured operational routing for serious systems and strategic engagements.
            </p>
            <div className="w-10 border-t border-[#00d4ff]/30 mb-5" />
            <p className="text-sm text-[#00d4ff] uppercase tracking-[0.45em]">
              Select Your Entry Point.
            </p>
          </div>
          <div className="flex items-center justify-center h-[320px]">
            <CognitionCore />
          </div>
        </div>
      </section>

      {/* Routing Cards */}
      <section className="max-w-7xl mx-auto px-8 pb-6">
        <div className="grid grid-cols-5 gap-3">
          {CARDS.map((card) => (
            <button key={card.id} onClick={() => handleCardClick(card.id)}
              className={`relative text-left p-5 bg-[#0a0a0f] border cursor-pointer transition-all duration-200 group flex flex-col ${
                activeCard === card.id
                  ? "border-[#00d4ff]/50 shadow-[0_0_22px_rgba(0,212,255,0.10)]"
                  : "border-[#1a1a2e] hover:border-[#00d4ff]/30 hover:shadow-[0_0_16px_rgba(0,212,255,0.06)]"
              }`}
            >
              <span className="text-[#00d4ff] text-base font-mono tracking-wider block mb-3">{card.number}</span>
              <span className="text-[#4b5563] group-hover:text-[#6b7280] transition-colors mb-3 block">
                <card.Icon />
              </span>
              <h3 className="text-white font-bold text-lg uppercase tracking-[0.1em] mb-2 leading-snug">{card.title}</h3>
              <p className="text-[#6b7280] text-base leading-relaxed flex-1">{card.description}</p>
              <span className={`text-xl mt-3 block transition-colors ${activeCard === card.id ? "text-[#00d4ff]" : "text-[#3d3d55] group-hover:text-[#00d4ff]"}`}>
                →
              </span>
            </button>
          ))}
        </div>

        {/* Inline Panel */}
        <AnimatePresence mode="wait">
          {activeCard && activeCard !== 4 && (
            <motion.div key={activeCard}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mt-3 p-8 bg-[#0a0a0f] border border-[#1a1a2e]"
            >
              {activeCard === 1 && <DriftPanel onClose={() => setActiveCard(null)} />}
              {activeCard === 2 && <SignalsPanel onClose={() => setActiveCard(null)} />}
              {activeCard === 3 && <OpsPanel onClose={() => setActiveCard(null)} />}
              {activeCard === 5 && <ContactPanel onClose={() => setActiveCard(null)} />}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] py-6">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <span className="text-[#3b3b4f] text-[10px] tracking-[0.3em] uppercase">Cognitive Empire</span>
          <span className="text-[#3b3b4f] text-sm">·</span>
          <span className="text-[#3b3b4f] text-[10px] tracking-[0.3em] uppercase">Intelligence. Structure. Empire.</span>
        </div>
      </footer>
    </div>
  );
}
