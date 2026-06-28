"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import CENav from "../components/CENav";

// ─── Routing Visual ────────────────────────────────────────────────────────────

function RoutingVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 460 300" className="w-full max-w-[440px] h-[280px]" fill="none">
        <defs>
          <filter id="node-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle horizontal grid */}
        {[55, 100, 150, 200, 245].map((y) => (
          <line key={y} x1="30" y1={y} x2="390" y2={y}
            stroke="rgba(220,220,210,0.04)" strokeWidth="0.4" />
        ))}

        {/* Source ring + node */}
        <circle cx="42" cy="150" r="11" fill="none"
          stroke="rgba(220,220,210,0.14)" strokeWidth="0.5" />
        <circle cx="42" cy="150" r="3.5" fill="rgba(245,245,235,0.55)"
          filter="url(#node-glow)" />

        {/* Trunk */}
        <path d="M46 150 L118 150"
          stroke="rgba(220,220,210,0.32)" strokeWidth="0.85" />

        {/* Branch node */}
        <circle cx="118" cy="150" r="2.5" fill="rgba(245,245,235,0.38)" />

        {/* INTAKE — top lane */}
        <path d="M118 150 Q148 150 168 72 L330 72"
          stroke="rgba(220,220,210,0.28)" strokeWidth="0.78" />
        {/* ROUTE */}
        <path d="M118 150 Q148 150 168 114 L330 114"
          stroke="rgba(220,220,210,0.22)" strokeWidth="0.72" />
        {/* GOVERN */}
        <path d="M118 150 Q148 150 168 186 L330 186"
          stroke="rgba(220,220,210,0.22)" strokeWidth="0.72" />
        {/* CONNECT — bottom lane */}
        <path d="M118 150 Q148 150 168 228 L330 228"
          stroke="rgba(220,220,210,0.26)" strokeWidth="0.78" />

        {/* Mid-path marks */}
        <circle cx="224" cy="72" r="1.5" fill="rgba(245,245,235,0.28)" />
        <circle cx="224" cy="114" r="1.5" fill="rgba(245,245,235,0.22)" />
        <circle cx="224" cy="186" r="1.5" fill="rgba(245,245,235,0.22)" />
        <circle cx="224" cy="228" r="1.5" fill="rgba(245,245,235,0.28)" />

        {/* Chevrons */}
        <polyline points="219,68 224,72 219,76"
          stroke="rgba(220,220,210,0.3)" strokeWidth="0.65" fill="none" />
        <polyline points="219,110 224,114 219,118"
          stroke="rgba(220,220,210,0.22)" strokeWidth="0.65" fill="none" />
        <polyline points="219,182 224,186 219,190"
          stroke="rgba(220,220,210,0.22)" strokeWidth="0.65" fill="none" />
        <polyline points="219,224 224,228 219,232"
          stroke="rgba(220,220,210,0.28)" strokeWidth="0.65" fill="none" />

        {/* Terminal nodes */}
        <circle cx="330" cy="72" r="3" fill="rgba(245,245,235,0.68)"
          filter="url(#node-glow)" />
        <circle cx="330" cy="114" r="2.5" fill="rgba(245,245,235,0.4)" />
        <circle cx="330" cy="186" r="2.5" fill="rgba(245,245,235,0.4)" />
        <circle cx="330" cy="228" r="2.5" fill="rgba(245,245,235,0.52)" />

        {/* Dashed connectors to labels */}
        <line x1="333" y1="72" x2="356" y2="72"
          stroke="rgba(220,220,210,0.14)" strokeWidth="0.5" strokeDasharray="2 2.5" />
        <line x1="333" y1="114" x2="356" y2="114"
          stroke="rgba(220,220,210,0.11)" strokeWidth="0.5" strokeDasharray="2 2.5" />
        <line x1="333" y1="186" x2="356" y2="186"
          stroke="rgba(220,220,210,0.11)" strokeWidth="0.5" strokeDasharray="2 2.5" />
        <line x1="333" y1="228" x2="356" y2="228"
          stroke="rgba(220,220,210,0.13)" strokeWidth="0.5" strokeDasharray="2 2.5" />

        {/* Labels */}
        <text x="360" y="76" fill="rgba(196,197,194,0.62)"
          fontSize="7.5" fontFamily="'Courier New',monospace" letterSpacing="2.5">INTAKE</text>
        <text x="360" y="118" fill="rgba(196,197,194,0.44)"
          fontSize="7.5" fontFamily="'Courier New',monospace" letterSpacing="2.5">ROUTE</text>
        <text x="360" y="190" fill="rgba(196,197,194,0.44)"
          fontSize="7.5" fontFamily="'Courier New',monospace" letterSpacing="2.5">GOVERN</text>
        <text x="360" y="232" fill="rgba(196,197,194,0.55)"
          fontSize="7.5" fontFamily="'Courier New',monospace" letterSpacing="2.5">CONNECT</text>
      </svg>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconRevenue() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconGravity() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="5" y1="10" x2="19" y2="10" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

function IconContact() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ─── Attachment Module ─────────────────────────────────────────────────────────

function AttachmentModule({
  files,
  onChange,
}: {
  files: File[];
  onChange: (f: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onChange([...files, ...Array.from(list)]);
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] mb-2.5"
        style={{ color: "rgba(196,197,194,0.48)" }}>
        Attachment Optional
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer flex flex-col items-center justify-center gap-2.5 py-8 px-5 transition-all duration-200"
        style={{
          border: `1px dashed ${dragOver ? "rgba(245,242,232,0.38)" : "rgba(245,242,232,0.16)"}`,
          background: dragOver ? "rgba(245,242,232,0.025)" : "rgba(8,10,12,0.55)",
        }}
      >
        <span style={{ color: "rgba(196,197,194,0.38)" }}>
          <IconUpload />
        </span>
        <p className="text-[11px] text-center leading-relaxed"
          style={{ color: "rgba(196,197,194,0.5)" }}>
          Upload supporting files
        </p>
        <p className="text-[10px] text-center leading-relaxed"
          style={{ color: "rgba(196,197,194,0.3)" }}>
          Attach documents, screenshots,<br />or supporting material
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p className="text-[9px] mt-1.5 tracking-wide"
        style={{ color: "rgba(196,197,194,0.28)" }}>
        PDF, DOCX, XLSX, PNG, JPG · Max 25MB
      </p>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between pb-1.5 text-[10px]"
              style={{
                color: "rgba(196,197,194,0.52)",
                borderBottom: "1px solid rgba(245,242,232,0.05)",
              }}>
              <span className="truncate mr-2">{f.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="shrink-0 transition-colors hover:opacity-80"
                style={{ color: "rgba(196,197,194,0.35)" }}
              >×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputCls = [
  "px-3 py-2 text-[11px] w-full tracking-wide transition-colors",
  "focus:outline-none",
].join(" ");

const inputStyle = {
  background: "rgba(8,10,12,0.65)",
  border: "1px solid rgba(245,242,232,0.1)",
  color: "rgba(246,244,238,0.82)",
};

const optionCls = (active: boolean) =>
  [
    "px-4 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-all duration-150 border",
    active
      ? "border-[rgba(245,242,232,0.48)] text-[rgba(246,244,238,0.88)] bg-[rgba(245,242,232,0.04)]"
      : "border-[rgba(245,242,232,0.11)] text-[rgba(196,197,194,0.48)] hover:border-[rgba(245,242,232,0.26)] hover:text-[rgba(246,244,238,0.7)]",
  ].join(" ");

// ─── Panel Header ──────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  quote,
  onClose,
}: {
  title: string;
  quote: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 shrink-0 inline-block"
            style={{
              border: "1px solid rgba(199,178,118,0.45)",
              background: "rgba(199,178,118,0.1)",
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "rgba(246,244,238,0.72)" }}
          >
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 ml-8 text-[9px] uppercase tracking-[0.18em] transition-colors hover:opacity-70"
          style={{ color: "rgba(196,197,194,0.32)" }}
        >
          Close Panel —
        </button>
      </div>
      <p
        className="text-xs leading-relaxed max-w-2xl"
        style={{ color: "rgba(196,197,194,0.54)" }}
      >
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

// ─── Submitted State ───────────────────────────────────────────────────────────

function SubmittedState({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-4">
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: "rgba(199,178,118,0.75)" }}>✓</span>
        <p className="text-sm tracking-wide" style={{ color: "rgba(246,244,238,0.78)" }}>
          {label} received. We will be in touch.
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-[9px] uppercase tracking-[0.18em] transition-colors hover:opacity-70"
        style={{ color: "rgba(196,197,194,0.32)" }}
      >
        Close Panel —
      </button>
    </div>
  );
}

// ─── Styled input helper ────────────────────────────────────────────────────────

function Field({
  tag = "input",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  tag?: "input" | "textarea";
}) {
  const shared = {
    className: inputCls,
    style: { ...inputStyle, ...(props.style ?? {}) },
  };
  if (tag === "textarea") {
    return (
      <textarea
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        {...shared}
      />
    );
  }
  return (
    <input
      {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      {...shared}
    />
  );
}

// ─── Panel: Revenue Discipline Audit ──────────────────────────────────────────

function RevenueDisciplinePanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", org: "", auditContext: "", message: "" });
  const [files, setFiles] = useState<File[]>([]);

  const opts = [
    "Fractional CRO / RevOps",
    "Founder-led sales",
    "Small sales team",
    "Multi-client operator",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to Supabase insert or n8n webhook
    console.log("[ConnectPage] submission:", {
      route_type: "revenue_discipline_audit",
      internal_product: "Drift",
      selected_option: selected,
      name: form.name,
      email: form.email,
      organization: form.org,
      context_or_inquiry_type: form.auditContext,
      message: form.message,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      created_at: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  if (submitted)
    return <SubmittedState label="Revenue Discipline Audit" onClose={onClose} />;

  return (
    <div>
      <PanelHeader
        title="Revenue Discipline Audit"
        quote="Revenue discipline audits expose where pipeline activity, follow-up, accountability, and intervention timing are decaying."
        onClose={onClose}
      />
      <p className="text-[10px] uppercase tracking-[0.22em] mb-3"
        style={{ color: "rgba(246,244,238,0.48)" }}>
        What type of environment are you managing?
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => setSelected(o)} className={optionCls(selected === o)}>
            {o}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.form
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_268px]">
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field required placeholder="Name" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
                  <Field required type="email" placeholder="Email" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))} />
                </div>
                <Field placeholder="Organization" value={form.org}
                  onChange={(e) => setForm((f) => ({ ...f, org: (e.target as HTMLInputElement).value }))} />
                <Field placeholder="Audit Context" value={form.auditContext}
                  onChange={(e) => setForm((f) => ({ ...f, auditContext: (e.target as HTMLInputElement).value }))} />
                <Field tag="textarea" required placeholder="Message" rows={4} value={form.message}
                  style={{ ...inputStyle, resize: "none" }}
                  onChange={(e) => setForm((f) => ({ ...f, message: (e.target as HTMLTextAreaElement).value }))} />
                <div className="pt-2">
                  <button type="submit" className="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200"
                    style={{
                      border: "1px solid rgba(245,242,232,0.26)",
                      color: "rgba(246,244,238,0.78)",
                    }}>
                    REQUEST AUDIT →
                  </button>
                </div>
              </div>
              <div>
                <AttachmentModule files={files} onChange={setFiles} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panel: Maintenance Gravity Audit ─────────────────────────────────────────

function MaintenanceGravityPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", org: "", systemUnderReview: "", message: "" });
  const [files, setFiles] = useState<File[]>([]);

  const opts = [
    "Software / product system",
    "AI or automation workflow",
    "Operations process",
    "Team execution system",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to Supabase insert or n8n webhook
    console.log("[ConnectPage] submission:", {
      route_type: "maintenance_gravity_audit",
      internal_product: "Maintenance Gravity",
      selected_option: selected,
      name: form.name,
      email: form.email,
      organization: form.org,
      context_or_inquiry_type: form.systemUnderReview,
      message: form.message,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      created_at: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  if (submitted)
    return <SubmittedState label="Maintenance Gravity Audit" onClose={onClose} />;

  return (
    <div>
      <PanelHeader
        title="Maintenance Gravity Audit"
        quote="Maintenance Gravity audits expose the hidden operational weight that makes systems harder to sustain, scale, or delegate."
        onClose={onClose}
      />
      <p className="text-[10px] uppercase tracking-[0.22em] mb-3"
        style={{ color: "rgba(246,244,238,0.48)" }}>
        What system is under pressure?
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => setSelected(o)} className={optionCls(selected === o)}>
            {o}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.form
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_268px]">
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field required placeholder="Name" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
                  <Field required type="email" placeholder="Email" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))} />
                </div>
                <Field placeholder="Organization" value={form.org}
                  onChange={(e) => setForm((f) => ({ ...f, org: (e.target as HTMLInputElement).value }))} />
                <Field placeholder="System Under Review" value={form.systemUnderReview}
                  onChange={(e) => setForm((f) => ({ ...f, systemUnderReview: (e.target as HTMLInputElement).value }))} />
                <Field tag="textarea" required placeholder="Message" rows={4} value={form.message}
                  style={{ ...inputStyle, resize: "none" }}
                  onChange={(e) => setForm((f) => ({ ...f, message: (e.target as HTMLTextAreaElement).value }))} />
                <div className="pt-2">
                  <button type="submit" className="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200"
                    style={{
                      border: "1px solid rgba(245,242,232,0.26)",
                      color: "rgba(246,244,238,0.78)",
                    }}>
                    REQUEST AUDIT →
                  </button>
                </div>
              </div>
              <div>
                <AttachmentModule files={files} onChange={setFiles} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panel: Contact Cognitive Empire ──────────────────────────────────────────

function ContactPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", org: "", inquiryType: "", message: "" });
  const [files, setFiles] = useState<File[]>([]);

  const opts = [
    "Partnership",
    "Strategic discussion",
    "Institutional inquiry",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to Supabase insert or n8n webhook
    console.log("[ConnectPage] submission:", {
      route_type: "general_contact",
      internal_product: "CE",
      selected_option: selected,
      name: form.name,
      email: form.email,
      organization: form.org,
      context_or_inquiry_type: form.inquiryType || selected,
      message: form.message,
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      created_at: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  if (submitted)
    return <SubmittedState label="Inquiry" onClose={onClose} />;

  return (
    <div>
      <PanelHeader
        title="Contact Cognitive Empire"
        quote="Direct institutional contact for partnerships, strategic discussions, and serious inquiries."
        onClose={onClose}
      />
      <p className="text-[10px] uppercase tracking-[0.22em] mb-3"
        style={{ color: "rgba(246,244,238,0.48)" }}>
        What type of inquiry is this?
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => setSelected(o)} className={optionCls(selected === o)}>
            {o}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_268px]">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field required placeholder="Name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
              <Field required type="email" placeholder="Email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))} />
            </div>
            <Field placeholder="Organization" value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: (e.target as HTMLInputElement).value }))} />
            <Field placeholder="Inquiry Type" value={form.inquiryType}
              onChange={(e) => setForm((f) => ({ ...f, inquiryType: (e.target as HTMLInputElement).value }))} />
            <Field tag="textarea" required placeholder="Message" rows={4} value={form.message}
              style={{ ...inputStyle, resize: "none" }}
              onChange={(e) => setForm((f) => ({ ...f, message: (e.target as HTMLTextAreaElement).value }))} />
            <div className="pt-2">
              <button type="submit" className="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200"
                style={{
                  border: "1px solid rgba(245,242,232,0.26)",
                  color: "rgba(246,244,238,0.78)",
                }}>
                ROUTE INQUIRY →
              </button>
            </div>
          </div>
          <div>
            <AttachmentModule files={files} onChange={setFiles} />
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Card data ─────────────────────────────────────────────────────────────────

type CardDef = {
  id: number;
  number: string;
  Icon: React.FC;
  title: string;
  description: string;
  cta: string;
};

const CARDS: CardDef[] = [
  {
    id: 1,
    number: "01",
    Icon: IconRevenue,
    title: "REVENUE DISCIPLINE AUDIT",
    description: "Detect revenue decay, intervention gaps, and execution accountability leaks before they become loss.",
    cta: "Request Audit →",
  },
  {
    id: 2,
    number: "02",
    Icon: IconGravity,
    title: "MAINTENANCE GRAVITY AUDIT",
    description: "Identify where systems accumulate hidden upkeep, coordination drag, tooling friction, and continuity debt.",
    cta: "Request Audit →",
  },
  {
    id: 3,
    number: "03",
    Icon: IconContact,
    title: "CONTACT COGNITIVE EMPIRE",
    description: "Direct inquiries, partnerships, strategic discussions, and serious institutional contact.",
    cta: "Route Inquiry →",
  },
];


// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  const handleCardClick = (id: number) => {
    setActiveCard((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#030405" }}>
      <style>{`
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor-blink { animation: cursor-blink 1s step-end infinite; }
        .ce-input:focus { border-color: rgba(245,242,232,0.28) !important; }
        .ce-card:hover { background: rgba(7,9,11,0.9) !important; }
        .ce-card:hover .ce-card-border { border-color: rgba(245,242,232,0.22) !important; }
        .ce-btn-primary:hover { background: rgba(245,242,232,0.04); border-color: rgba(245,242,232,0.46) !important; }
      `}</style>

      <CENav />

      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-5 lg:px-10 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center"
          style={{ minHeight: "260px" }}>
          <div>
            <h1
              className="font-mono font-[200] leading-none tracking-[0.06em] mb-5"
              style={{
                fontSize: "clamp(3.2rem, 5.5vw, 5.5rem)",
                color: "rgba(246,244,238,0.88)",
              }}
            >
              DR. E<span className="cursor-blink" style={{ letterSpacing: 0, fontWeight: 400 }}>_</span>
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.44em] mb-4"
              style={{ color: "rgba(196,197,194,0.5)" }}
            >
              Public Interface of Cognitive Empire
            </p>
            <p
              className="text-[15px] leading-relaxed mb-6 max-w-md"
              style={{ color: "rgba(196,197,194,0.56)" }}
            >
              Structured operational routing for serious systems
              <br />and strategic engagements.
            </p>
            <div
              className="mb-6"
              style={{
                width: "2.25rem",
                borderTop: "1px solid rgba(245,242,232,0.14)",
              }}
            />
            <p
              className="text-[10px] uppercase tracking-[0.4em]"
              style={{ color: "rgba(196,197,194,0.4)" }}
            >
              Select Your Entry Point.
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center h-[280px]">
            <RoutingVisual />
          </div>
        </div>
      </section>

      {/* Routing Cards */}
      <section className="max-w-[1440px] mx-auto px-5 lg:px-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CARDS.map((card) => {
            const isActive = activeCard === card.id;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="relative text-left p-6 flex flex-col cursor-pointer transition-all duration-200 group"
                style={{
                  background: isActive ? "rgba(9,11,14,0.92)" : "rgba(7,9,11,0.75)",
                  border: `1px solid ${isActive ? "rgba(245,242,232,0.42)" : "rgba(245,242,232,0.1)"}`,
                }}
              >
                <span
                  className="text-[10px] font-mono tracking-[0.24em] block mb-4"
                  style={{ color: "rgba(196,197,194,0.3)" }}
                >
                  {card.number}
                </span>
                <span
                  className="mb-4 block transition-colors"
                  style={{
                    color: isActive
                      ? "rgba(246,244,238,0.72)"
                      : "rgba(196,197,194,0.38)",
                  }}
                >
                  <card.Icon />
                </span>
                <h3
                  className="font-semibold text-[12px] uppercase tracking-[0.12em] mb-2.5 leading-snug"
                  style={{ color: "rgba(246,244,238,0.82)" }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-[13px] leading-relaxed flex-1"
                  style={{ color: "rgba(196,197,194,0.48)" }}
                >
                  {card.description}
                </p>
                <span
                  className="text-[10px] font-mono mt-5 block tracking-[0.16em] transition-colors"
                  style={{
                    color: isActive
                      ? "rgba(246,244,238,0.65)"
                      : "rgba(196,197,194,0.28)",
                  }}
                >
                  {card.cta}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inline Panel */}
        <AnimatePresence mode="wait">
          {activeCard && (
            <motion.div
              key={activeCard}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-3 p-5 lg:p-8"
              style={{
                background: "rgba(7,9,11,0.88)",
                border: "1px solid rgba(245,242,232,0.1)",
              }}
            >
              {activeCard === 1 && (
                <RevenueDisciplinePanel onClose={() => setActiveCard(null)} />
              )}
              {activeCard === 2 && (
                <MaintenanceGravityPanel onClose={() => setActiveCard(null)} />
              )}
              {activeCard === 3 && (
                <ContactPanel onClose={() => setActiveCard(null)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer
        className="mt-16"
        style={{ borderTop: "1px solid rgba(245,242,232,0.07)" }}
      >
        <div className="max-w-[1440px] mx-auto px-5 lg:px-10 py-6 flex items-center justify-between">
          <span
            className="text-[9px] tracking-[0.34em] uppercase"
            style={{ color: "rgba(196,197,194,0.22)" }}
          >
            Cognitive Empire
          </span>
          <span style={{ color: "rgba(196,197,194,0.22)", fontSize: "11px" }}>·</span>
          <span
            className="text-[9px] tracking-[0.34em] uppercase"
            style={{ color: "rgba(196,197,194,0.22)" }}
          >
            Intelligence. Structure. Empire.
          </span>
        </div>
      </footer>
    </div>
  );
}
