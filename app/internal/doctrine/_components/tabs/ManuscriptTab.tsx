"use client";

import { useEffect, useRef, useState } from "react";
import { manuscriptParts, manuscriptChapters, manuscriptTitle, manuscriptSubtitle, manuscriptDescription } from "../../_data/manuscript";

export function ManuscriptTab() {
  const articleRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  // Reading progress + back-to-top visibility
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      setProgress(pct);
      setShowBackToTop(scrolled > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Copy canon line buttons — injected once after mount
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const laws = el.querySelectorAll(".law");
    laws.forEach((law) => {
      if (law.querySelector(".copy-canon-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-canon-btn";
      btn.textContent = "Copy canon line";
      btn.style.cssText =
        "margin-top:8px;font-size:10.5px;letter-spacing:0.04em;padding:4px 10px;border-radius:999px;border:1px solid var(--ce-gold-border);background:transparent;color:var(--ce-gold);cursor:pointer;";
      btn.addEventListener("click", () => {
        navigator.clipboard?.writeText(law.textContent?.trim() ?? "");
        const original = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = original), 1200);
      });
      law.appendChild(btn);
    });
  }, []);

  // Search + highlight
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    el.querySelectorAll(".search-highlight").forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent ?? ""), span);
      parent.normalize();
    });

    const term = search.trim().toLowerCase();
    if (term.length < 2) return;

    let firstMatch: Element | null = null;
    const targets = el.querySelectorAll("p, h2, h3, .law, li");
    targets.forEach((node) => {
      if (!node.textContent?.toLowerCase().includes(term)) return;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode())) textNodes.push(n as Text);
      textNodes.forEach((textNode) => {
        const value = textNode.nodeValue ?? "";
        if (!value.toLowerCase().includes(term)) return;
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const wrapper = document.createElement("span");
        wrapper.innerHTML = value.replace(regex, '<span class="search-highlight">$1</span>');
        textNode.parentNode?.replaceChild(wrapper, textNode);
        while (wrapper.firstChild) wrapper.parentNode?.insertBefore(wrapper.firstChild, wrapper);
        wrapper.remove();
      });
      if (!firstMatch) firstMatch = node;
    });

    if (firstMatch) {
      (firstMatch as Element).scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [search]);

  function jumpTo(id: string) {
    document.getElementById(`ms-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  }

  function backToTop() {
    document.getElementById("ms-top")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Reading progress */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: `${progress}%`,
          background: "var(--ce-gold)",
          zIndex: 60,
          transition: "width 100ms ease",
        }}
      />

      <div id="ms-top" />

      {/* Quick jump bar */}
      <div className="command-card" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select
          onChange={(e) => e.target.value && jumpTo(e.target.value)}
          defaultValue=""
          style={{ background: "var(--ce-navy)", border: "1px solid var(--ce-border)", borderRadius: 8, color: "var(--ce-text)", fontSize: 12.5, padding: "7px 10px" }}
        >
          <option value="">Jump to chapter…</option>
          {manuscriptParts.map((part) => (
            <optgroup key={part.id} label={part.label}>
              {part.chapterIds.map((cid) => {
                const ch = manuscriptChapters.find((c) => c.id === cid);
                return ch ? <option key={cid} value={cid}>{ch.title}</option> : null;
              })}
            </optgroup>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the manuscript…"
          style={{ flex: 1, minWidth: 160, background: "var(--ce-navy)", border: "1px solid var(--ce-border)", borderRadius: 8, color: "var(--ce-text)", fontSize: 12.5, padding: "8px 12px" }}
        />
        <button
          className="doctrine-toc-toggle"
          onClick={() => setTocOpen((v) => !v)}
          style={{ display: "none", background: "var(--ce-gold-soft)", border: "1px solid var(--ce-gold-border)", color: "var(--ce-gold)", borderRadius: 8, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
        >
          {tocOpen ? "Hide Contents" : "Table of Contents"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28 }} className="doctrine-manuscript-grid">
        {/* TOC */}
        <div
          className="doctrine-toc-col ce-scroll"
          style={{
            display: tocOpen ? "block" : undefined,
            position: "sticky",
            top: 90,
            alignSelf: "start",
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          {manuscriptParts.map((part) => (
            <div key={part.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ce-gold)", marginBottom: 4, padding: "0 10px" }}>
                {part.label}
              </div>
              {part.chapterIds.map((cid) => {
                const ch = manuscriptChapters.find((c) => c.id === cid);
                if (!ch) return null;
                return (
                  <a key={cid} className="toc-link" onClick={(e) => { e.preventDefault(); jumpTo(cid); }} href={`#ms-${cid}`}>
                    {ch.title}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* Article */}
        <div ref={articleRef} className="doctrine-manuscript" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)", marginBottom: 10 }}>
              Doctrine Text
            </div>
            <h1>{manuscriptTitle}</h1>
            <p style={{ fontSize: 18, color: "var(--ce-muted)" }}>{manuscriptSubtitle}</p>
            <p style={{ fontSize: 13, color: "var(--ce-dim)" }}>{manuscriptDescription}</p>
          </div>

          {manuscriptParts.map((part) => (
            <div key={part.id} style={{ paddingTop: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)", marginBottom: 8 }}>
                {part.label}
              </div>
              {part.chapterIds.map((cid) => {
                const ch = manuscriptChapters.find((c) => c.id === cid);
                if (!ch) return null;
                return (
                  <div key={cid} id={`ms-${cid}`} style={{ scrollMarginTop: 90, paddingBottom: 8 }}>
                    <div dangerouslySetInnerHTML={{ __html: ch.html }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={backToTop}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "1px solid var(--ce-gold-border)",
            background: "var(--ce-panel-elevated)",
            color: "var(--ce-gold)",
            fontSize: 16,
            cursor: "pointer",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      <style>{`
        @media (max-width: 880px) {
          .doctrine-manuscript-grid { grid-template-columns: 1fr !important; }
          .doctrine-toc-toggle { display: inline-block !important; }
          .doctrine-toc-col { display: none; position: static !important; max-height: none !important; margin-bottom: 16px; }
        }
      `}</style>
    </div>
  );
}
