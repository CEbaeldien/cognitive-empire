/**
 * CE Operator Kernel — Public Mini Canon PDF Generator
 * Renders HTML → PDF via Playwright (printBackground: true)
 * Output: public/downloads/ce-public-kernel.pdf
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'downloads', 'ce-public-kernel.pdf')
mkdirSync(join(__dirname, '..', 'public', 'downloads'), { recursive: true })

/* ─── CE Mark SVG ─────────────────────────────────────── */
const CE_MARK = `<svg width="40" height="40" viewBox="0 0 48 48" fill="#F4F7FB" xmlns="http://www.w3.org/2000/svg">
  <path d="M35,5 L13,5 L2,24 L13,43 L35,43 L30,35 L18,35 L11,24 L18,13 L30,13 Z"/>
  <path d="M31,17 L41,17 L41,20 L35,20 L35,22.5 L39,22.5 L39,25.5 L35,25.5 L35,28 L41,28 L41,31 L31,31 Z"/>
</svg>`

/* ─── Page wrapper ─────────────────────────────────────── */
const page = (content, num = '') => `
<div class="page">
  <div class="page-header">
    <span class="page-header-left">Cognitive Empire — Operator Kernel Public Mini Canon</span>
    ${num ? `<span class="page-header-right">${num}</span>` : ''}
  </div>
  ${content}
  <div class="page-footer">
    <span class="footer-text">Cognitive Empire · Public Doctrine</span>
    <span class="footer-page" style="color:rgba(197,162,111,0.4); font-family:'Courier New',monospace; font-size:7pt;">${num}</span>
  </div>
</div>`

/* ─── Section shell ────────────────────────────────────── */
const section = (num, title, body) => `
  <div class="section-number">${num}</div>
  <h2 class="section-title">${title}</h2>
  <div class="section-rule"></div>
  ${body}`

/* ─── Canon plate ──────────────────────────────────────── */
const canon = (...lines) => `
<div class="canon-plate">
  ${lines.map((l, i) => `<p ${i > 0 ? 'class="muted"' : ''}>${l}</p>`).join('')}
</div>`

/* ─── Full HTML ────────────────────────────────────────── */
const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{
  -webkit-print-color-adjust:exact!important;
  print-color-adjust:exact!important;
  box-sizing:border-box;margin:0;padding:0;
}
@page{size:A4;margin:0;}

:root{
  --black:#05070B;
  --navy:#080C14;
  --panel:#0D1524;
  --panel2:#111C30;
  --white:#F4F7FB;
  --text:#E6EDF7;
  --muted:#8B9AB3;
  --dim:#5E6B80;
  --dim2:#3A4558;
  --gold:#C5A26F;
  --border:rgba(255,255,255,0.09);
}

body{
  font-family:'Inter','Helvetica Neue',Arial,sans-serif;
  background:var(--black);
  color:var(--text);
  font-size:11pt;
  line-height:1.72;
}

.page{
  width:210mm;
  min-height:297mm;
  padding:18mm 20mm 20mm;
  page-break-after:always;
  background:var(--black);
  position:relative;
  overflow:hidden;
}
.page:last-child{page-break-after:avoid;}

/* ── Cover ────────────────────────────────────────────── */
.cover{
  padding:22mm 22mm;
  display:flex;
  flex-direction:column;
  min-height:297mm;
  background:linear-gradient(160deg,#080C14 0%,#05070B 55%,#060A10 100%);
  position:relative;
}
.cover-frame{
  position:absolute;
  top:14mm;left:14mm;right:14mm;bottom:14mm;
  border:0.5px solid rgba(197,162,111,0.15);
  pointer-events:none;
}
.cover-tl,.cover-tr,.cover-bl,.cover-br{
  position:absolute;width:22px;height:22px;
}
.cover-tl{top:-1px;left:-1px;border-top:1.5px solid rgba(197,162,111,0.7);border-left:1.5px solid rgba(197,162,111,0.7);}
.cover-tr{top:-1px;right:-1px;border-top:1.5px solid rgba(197,162,111,0.7);border-right:1.5px solid rgba(197,162,111,0.7);}
.cover-bl{bottom:-1px;left:-1px;border-bottom:1.5px solid rgba(197,162,111,0.7);border-left:1.5px solid rgba(197,162,111,0.7);}
.cover-br{bottom:-1px;right:-1px;border-bottom:1.5px solid rgba(197,162,111,0.7);border-right:1.5px solid rgba(197,162,111,0.7);}
.cover-top-row{display:flex;align-items:center;gap:3mm;margin-bottom:auto;}
.cover-wordmark{font-size:8pt;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.26);font-family:'Courier New',monospace;}
.cover-mid{margin:auto 0;padding:18mm 0 14mm;}
.cover-eyebrow{font-size:8pt;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:8mm;font-family:'Courier New',monospace;}
.cover-title{
  font-family:'Playfair Display',Georgia,'Times New Roman',serif;
  font-size:54pt;font-weight:700;
  line-height:0.92;letter-spacing:-2px;
  color:var(--white);margin-bottom:2mm;
}
.cover-title .gold{color:var(--gold);}
.cover-divider{width:44px;height:1px;background:var(--gold);margin:9mm 0;}
.cover-tagline{font-size:11.5pt;color:var(--muted);max-width:110mm;line-height:1.65;font-weight:300;}
.cover-bottom{margin-top:auto;}
.cover-meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3mm 10mm;margin-bottom:6mm;}
.meta-row{display:flex;flex-direction:column;gap:0.5mm;}
.meta-label{font-size:7pt;letter-spacing:2px;text-transform:uppercase;color:var(--dim2);font-family:'Courier New',monospace;}
.meta-value{font-size:8pt;letter-spacing:1px;color:var(--dim);font-family:'Courier New',monospace;text-transform:uppercase;}

/* ── Page header / footer ─────────────────────────────── */
.page-header{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:12mm;padding-bottom:3.5mm;
  border-bottom:0.5px solid rgba(255,255,255,0.06);
}
.page-header-left{font-size:6.5pt;letter-spacing:1.8px;text-transform:uppercase;color:var(--dim2);font-family:'Courier New',monospace;}
.page-header-right{font-size:7pt;color:rgba(197,162,111,0.45);font-family:'Courier New',monospace;}
.page-footer{position:absolute;bottom:9mm;left:20mm;right:20mm;display:flex;justify-content:space-between;align-items:center;}
.footer-text{font-size:6.5pt;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim2);font-family:'Courier New',monospace;}

/* ── Section ──────────────────────────────────────────── */
.section-number{font-size:7pt;letter-spacing:3.5px;text-transform:uppercase;color:rgba(197,162,111,0.55);font-family:'Courier New',monospace;margin-bottom:2.5mm;}
.section-title{
  font-family:'Playfair Display',Georgia,serif;
  font-size:21pt;font-weight:700;
  color:var(--white);letter-spacing:-0.5px;line-height:1.1;
  margin-bottom:7mm;
}
.section-rule{width:28px;height:1px;background:rgba(197,162,111,0.4);margin-bottom:6mm;}

/* ── Body ─────────────────────────────────────────────── */
p{font-size:11pt;line-height:1.76;color:var(--text);margin-bottom:4.5mm;}
p.muted{color:var(--muted);}
p.highlight{color:var(--white);font-weight:500;}
p.small{font-size:9.5pt;line-height:1.7;}

/* ── Canon plate ──────────────────────────────────────── */
.canon-plate{
  background:linear-gradient(90deg,rgba(197,162,111,0.09),transparent 55%);
  background-color:var(--panel);
  border:0.5px solid rgba(197,162,111,0.24);
  border-left:2.5px solid var(--gold);
  border-radius:7px;
  padding:5.5mm 7mm;
  margin:5.5mm 0;
}
.canon-plate p{margin:0;color:var(--white);font-size:11pt;line-height:1.65;}
.canon-plate p+p{margin-top:2.5mm;color:var(--muted);}
.canon-plate .gold{color:var(--gold);}

/* ── Cards ────────────────────────────────────────────── */
.card{background:var(--panel);border:0.5px solid var(--border);border-radius:7px;padding:5mm 5.5mm;margin-bottom:3.5mm;}
.card-label{font-size:7pt;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:'Courier New',monospace;margin-bottom:1.5mm;}
.card-title{font-size:11.5pt;font-weight:600;color:var(--white);margin-bottom:1.5mm;letter-spacing:-0.2px;}
.card p{font-size:9.5pt;color:var(--muted);margin:0;line-height:1.6;}

/* ── Two-col ─────────────────────────────────────────── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:5mm;}

/* ── Eight Laws grid ─────────────────────────────────── */
.laws-grid{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:4mm;}
.law-card{background:var(--panel);border:0.5px solid var(--border);border-radius:6px;padding:4.5mm 5mm;}
.law-numeral{font-size:7pt;letter-spacing:2.5px;color:var(--gold);font-family:'Courier New',monospace;margin-bottom:1.5mm;}
.law-title{font-size:10.5pt;font-weight:600;color:var(--white);margin-bottom:1.5mm;letter-spacing:-0.2px;line-height:1.2;}
.law-desc{font-size:9pt;color:var(--muted);line-height:1.55;}

/* ── Migration board ─────────────────────────────────── */
.migration-board{background:var(--panel);border:0.5px solid var(--border);border-radius:8px;overflow:hidden;margin-top:5mm;}
.migration-row{display:flex;justify-content:space-between;align-items:center;padding:3mm 6mm;border-bottom:0.5px solid rgba(255,255,255,0.05);}
.migration-row:last-child{border-bottom:none;}
.migration-from{font-size:10.5pt;color:var(--text);}
.migration-to{font-size:8.5pt;color:var(--gold);font-family:'Courier New',monospace;letter-spacing:1px;}

/* ── Question cards ──────────────────────────────────── */
.questions-grid{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin-top:5mm;}
.q-card{background:var(--panel);border:0.5px solid var(--border);border-radius:6px;padding:4.5mm 5mm;display:flex;gap:3mm;}
.q-num{font-size:8pt;color:var(--gold);font-family:'Courier New',monospace;flex-shrink:0;margin-top:0.5mm;font-weight:600;}
.q-text{font-size:10pt;color:var(--text);line-height:1.5;}

/* ── Closing ─────────────────────────────────────────── */
.closing{
  min-height:297mm;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  text-align:center;
  padding:22mm;
  background:linear-gradient(160deg,#080C14 0%,#05070B 60%,#060A10 100%);
  position:relative;
}
.closing-ring{
  width:72mm;height:72mm;border-radius:50%;
  border:0.5px solid rgba(197,162,111,0.18);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:9mm;position:relative;
}
.closing-ring::before{
  content:'';position:absolute;inset:5mm;border-radius:50%;
  border:0.5px dashed rgba(197,162,111,0.10);
}
.closing-title{
  font-family:'Playfair Display',Georgia,serif;
  font-size:22pt;font-weight:700;color:var(--white);
  line-height:1.2;letter-spacing:-0.5px;margin-bottom:2mm;
}
.closing-gold{
  font-family:'Playfair Display',Georgia,serif;
  font-size:22pt;font-weight:700;color:var(--gold);
  line-height:1.2;letter-spacing:-0.5px;margin-bottom:8mm;
}
.closing-divider{width:28px;height:1px;background:rgba(197,162,111,0.28);margin:0 auto 6mm;}
.closing-mark{font-size:7.5pt;letter-spacing:3px;text-transform:uppercase;color:var(--dim2);font-family:'Courier New',monospace;line-height:1.9;}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════
     COVER
════════════════════════════════════════ -->
<div class="page cover">
  <div class="cover-frame">
    <div class="cover-tl"></div><div class="cover-tr"></div>
    <div class="cover-bl"></div><div class="cover-br"></div>
  </div>

  <div class="cover-top-row">
    ${CE_MARK}
    <span class="cover-wordmark">Cognitive Empire</span>
  </div>

  <div class="cover-mid">
    <div class="cover-eyebrow">Operator Kernel · Public Mini Canon</div>
    <div class="cover-title">
      Intelligence<br>Is Abundant.<br>
      <span class="gold">Judgment<br>Is Power.</span>
    </div>
    <div class="cover-divider"></div>
    <div class="cover-tagline">A public doctrine for operators, builders, and institutions navigating intelligence-abundant systems.</div>
  </div>

  <div class="cover-bottom">
    <div class="cover-meta-grid">
      <div class="meta-row"><span class="meta-label">Canon Status</span><span class="meta-value">Public</span></div>
      <div class="meta-row"><span class="meta-label">Class</span><span class="meta-value">Doctrine</span></div>
      <div class="meta-row"><span class="meta-label">Version</span><span class="meta-value">1.0</span></div>
      <div class="meta-row"><span class="meta-label">Release</span><span class="meta-value">2026</span></div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════
     01 — THE PRIME DOCTRINE
════════════════════════════════════════ -->
${page(section('01', 'The Prime Doctrine', `
<p class="highlight">When intelligence becomes abundant, confusion becomes the bottleneck.</p>
<p>The defining shift of this era is not that machines can produce more text, code, images, analysis, or workflows. That is the visible layer.</p>
<p>The deeper shift is structural.</p>
<p>Execution simplifies. Production cheapens. Iteration accelerates. Output multiplies.</p>
<p>When production becomes frictionless, the constraint migrates. It moves from the capacity to produce to the capacity to direct, evaluate, govern, and maintain.</p>
${canon('What changes is not capability. <span class="gold">What changes is constraint.</span>')}
<p>The operator who understands this operates differently. They do not compete with intelligence abundance. They orient within it.</p>
<p class="muted">This is the first principle. Every section of this document follows from it.</p>
`), '01')}


<!-- ═══════════════════════════════════════
     02 — JUDGMENT IS POWER
════════════════════════════════════════ -->
${page(section('02', 'Judgment Is Power', `
<p>Judgment has two layers. Understanding both is the foundation of operating effectively under intelligence abundance.</p>
<div class="two-col" style="margin: 5mm 0;">
  <div class="card">
    <div class="card-label">Layer One</div>
    <div class="card-title">Cognitive Judgment</div>
    <p>Analysis, synthesis, pattern recognition, option comparison, and reasoning. This layer can increasingly be assisted by intelligent systems.</p>
  </div>
  <div class="card">
    <div class="card-label">Layer Two</div>
    <div class="card-title">Consequential Judgment</div>
    <p>Accountable commitment under uncertainty, where objectives, constraints, escalation, and irreversible outcomes remain attributable to a responsible actor.</p>
  </div>
</div>
${canon('Cognitive judgment can be assisted. <span class="gold">Consequential judgment must be owned.</span>')}
<p>The operator does not win by outproducing machines. The operator wins by preserving direction, accountability, and coherence while machines expand the production surface.</p>
<p class="muted">Intelligence abundance does not diminish the need for judgment. It sharpens the distinction between the two kinds.</p>
`), '02')}


<!-- ═══════════════════════════════════════
     03 — THE EIGHT LAWS
════════════════════════════════════════ -->
${page(section('03', 'The Eight Laws', `
<p class="muted">These are the structural laws governing intelligence-abundant systems. They do not describe a specific technology. They describe the structural dynamics produced when intelligence becomes widely accessible.</p>
<div class="laws-grid">
  <div class="law-card">
    <div class="law-numeral">I</div>
    <div class="law-title">Intelligence Abundance</div>
    <div class="law-desc">When intelligence becomes abundant, output inflates and value migrates upstream.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">II</div>
    <div class="law-title">Bottleneck Migration</div>
    <div class="law-desc">When one constraint collapses, another becomes dominant. Optimizing the wrong layer amplifies instability.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">III</div>
    <div class="law-title">Responsibility Migration</div>
    <div class="law-desc">Automation increases ambiguity. Ownership becomes economic currency.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">IV</div>
    <div class="law-title">Output Inflation</div>
    <div class="law-desc">When everyone can produce, differentiation shifts to selection, constraint design, and outcome integrity.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">V</div>
    <div class="law-title">Decision Half-Life</div>
    <div class="law-desc">Some decisions must be defended. Others must adapt. Confusing the two destroys cognitive capital.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">VI</div>
    <div class="law-title">Escalation Preservation</div>
    <div class="law-desc">Outsource analysis. Never outsource responsibility.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">VII</div>
    <div class="law-title">Optimization Fragility</div>
    <div class="law-desc">Systems optimized for speed without governance become brittle under scale.</div>
  </div>
  <div class="law-card">
    <div class="law-numeral">VIII</div>
    <div class="law-title">Human Differentiation</div>
    <div class="law-desc">Perfect logic commoditizes brands. Emotional signal preserves leverage.</div>
  </div>
</div>
`), '03')}


<!-- ═══════════════════════════════════════
     04 — SIGNAL VS. NOISE
════════════════════════════════════════ -->
${page(section('04', 'Signal vs. Noise', `
<p>Intelligence abundance does not eliminate information asymmetry. It reorganizes it.</p>
<p>When production becomes inexpensive, visibility becomes a lagging indicator of structural reality. The information that matters — the signal — is increasingly separated from the information that circulates.</p>
${canon('Search visibility is a distribution event, not a discovery event.')}
<p>Signal compounds quietly. Noise scales rapidly.</p>
<p>In the attention era, distribution was the constraint. In the abundance era, orientation is the constraint. The operator who can distinguish structural signal from produced noise holds a durable advantage.</p>
<p class="muted">The volume of information available has no relationship to the quality of orientation it produces. Those are two separate functions, and abundance serves only one of them.</p>
`), '04')}


<!-- ═══════════════════════════════════════
     05 — BOTTLENECK MIGRATION
════════════════════════════════════════ -->
${page(section('05', 'Bottleneck Migration', `
<p>Every system operates under constraint. When one constraint dissolves, another becomes dominant. This is not a problem to be solved — it is a structural property of complex systems operating under change.</p>
<p>In intelligence-abundant environments, the bottleneck has migrated away from production and toward governance, ownership, and survivability.</p>
<div class="migration-board">
  <div class="migration-row"><span class="migration-from">Production</span><span class="migration-to">→ SELECTION</span></div>
  <div class="migration-row"><span class="migration-from">Execution</span><span class="migration-to">→ OWNERSHIP</span></div>
  <div class="migration-row"><span class="migration-from">Access</span><span class="migration-to">→ ORCHESTRATION</span></div>
  <div class="migration-row"><span class="migration-from">Building</span><span class="migration-to">→ GOVERNANCE</span></div>
  <div class="migration-row"><span class="migration-from">Analysis</span><span class="migration-to">→ RESPONSIBILITY</span></div>
  <div class="migration-row"><span class="migration-from">Creation</span><span class="migration-to">→ CONTINUITY</span></div>
  <div class="migration-row"><span class="migration-from">Visibility</span><span class="migration-to">→ VERIFIABILITY</span></div>
  <div class="migration-row"><span class="migration-from">Speed</span><span class="migration-to">→ SURVIVABILITY</span></div>
</div>
${canon('Optimizing the wrong layer amplifies instability. <span class="gold">Know where the constraint is now.</span>')}
`), '05')}


<!-- ═══════════════════════════════════════
     06 — MODULAR COGNITION
════════════════════════════════════════ -->
${page(section('06', 'Modular Cognition', `
<p>Access is not architecture. Using multiple models is not orchestration.</p>
<p>Modular Cognition is the deliberate structuring of distributed intelligence into a governed system — one where each component has a defined role, clear inputs and outputs, and a bounded scope of authority.</p>
${canon('Architecture determines outcome. The operator commits.')}
<p>The operator who assembles tools without designing the system creates complexity without coherence. Components interact without governance. Outputs accumulate without direction.</p>
<p>Modular Cognition is not about using fewer or more systems. It is about understanding how they relate, what each one owns, and what the operator is responsible for regardless of what the systems produce.</p>
<p class="muted">Orchestration without ownership is exposure. The operator who governs the architecture governs the outcome.</p>
`), '06')}


<!-- ═══════════════════════════════════════
     07 — DECISION HALF-LIFE
════════════════════════════════════════ -->
${page(section('07', 'Decision Half-Life', `
<p>Not all decisions should be treated equally. Some decisions have short half-lives — they must be revisited, adapted, and updated as conditions change. Others have long half-lives — they must be defended, held, and resisted from drift even under pressure to adapt.</p>
<div class="two-col" style="margin: 5mm 0;">
  <div class="card">
    <div class="card-label">Short Half-Life</div>
    <div class="card-title">Adapt Quickly</div>
    <p>Tactical choices, execution approaches, tooling selections, and response patterns in rapidly shifting environments. Optimize for speed of revision.</p>
  </div>
  <div class="card">
    <div class="card-label">Long Half-Life</div>
    <div class="card-title">Hold Against Drift</div>
    <p>Principles, structural commitments, governance frameworks, and identity constraints. Optimize for durability and coherence under pressure.</p>
  </div>
</div>
${canon('A system incapable of adaptation becomes obsolete. <span class="gold">A system incapable of stability becomes incoherent.</span>')}
<p class="muted">The operator who treats all decisions as equally revisable loses coherence. The operator who treats all decisions as equally permanent loses adaptability. Distinguishing between the two is a core operator skill.</p>
`), '07')}


<!-- ═══════════════════════════════════════
     08 — FAILURE MODES OF ABUNDANCE
════════════════════════════════════════ -->
${page(section('08', 'Failure Modes of Abundance', `
<p>In constrained environments, incompetence fails visibly. In abundant environments, intelligence fails silently.</p>
<p>These are structural failures caused by optimizing the visible layer — production, output, speed, coverage — after the bottleneck has migrated upward to governance, coherence, and accountability.</p>
<div class="card" style="margin: 5mm 0; border-left: 2.5px solid rgba(255,80,60,0.5);">
  <div class="card-title" style="color:#FF7B6B;">Fails Visibly</div>
  <p>In constrained environments, failure is detectable. Output stops, systems break, incompetence surfaces through visible results.</p>
</div>
<div class="card" style="margin-bottom: 5mm; border-left: 2.5px solid rgba(255,200,60,0.5);">
  <div class="card-title" style="color:#FFC84A;">Fails Silently</div>
  <p>In abundant environments, failure is harder to detect. Output continues. Systems appear operational. The failure lives in the invisible layer — in governance, accountability, and structural coherence — not in production.</p>
</div>
${canon('The absence of visible failure is not evidence of health. <span class="gold">It may be evidence of an invisible layer problem.</span>')}
`), '08')}


<!-- ═══════════════════════════════════════
     09 — GOVERNANCE UNDER ABUNDANCE
════════════════════════════════════════ -->
${page(section('09', 'Governance Under Abundance', `
<p>Intelligence abundance expands capability. Governance determines consequence.</p>
<p>Every intelligent system requires three layers: computation, commitment, and consequence. Collapsing these layers creates exposure that compounds invisibly until it breaks.</p>
<div class="card" style="margin: 5mm 0;">
  <div class="card-label">Layer 1</div>
  <div class="card-title">Computation</div>
  <p>Can be distributed. Accessible to most actors. No longer a structural advantage by itself.</p>
</div>
<div class="card" style="margin-bottom: 3.5mm;">
  <div class="card-label">Layer 2</div>
  <div class="card-title">Commitment</div>
  <p>Must be bounded by authority. Who decided? Under what constraints? With what escalation path?</p>
</div>
<div class="card" style="margin-bottom: 5mm;">
  <div class="card-label">Layer 3</div>
  <div class="card-title">Consequence</div>
  <p>Must be owned by identifiable actors. The organization that cannot name who is responsible for a system's outcomes does not govern that system.</p>
</div>
${canon('Computation can be distributed. Commitment must be bounded. <span class="gold">Consequence must be owned.</span>')}
`), '09')}


<!-- ═══════════════════════════════════════
     10 — STRATEGIC IMPERFECTION
════════════════════════════════════════ -->
${page(section('10', 'Strategic Imperfection', `
<p>Perfection scales. Imitation scales faster.</p>
<p>Strategic Imperfection is deliberate asymmetry: the disciplined refusal to optimize every surface into sameness. When every actor in a system can produce flawlessly, the marginal value of production quality approaches zero.</p>
${canon('Under abundance, identity becomes scarce. <span class="gold">Constraint signals authorship.</span>')}
<p>The operator who refuses to smooth every edge, who preserves deliberate friction, who constrains output to maintain voice — that operator is not failing to optimize. They are optimizing for a different variable: distinctiveness under abundance.</p>
<p>Strategic Imperfection is not sloppiness. It is the deliberate preservation of signal in an environment saturated by noise.</p>
<p class="muted">When everyone can produce perfectly, imperfection becomes the marker of intention. The decision not to optimize is itself a structural signal.</p>
`), '10')}


<!-- ═══════════════════════════════════════
     11 — AGENTIC COMMERCE
════════════════════════════════════════ -->
${page(section('11', 'Agentic Commerce', `
<p>Intelligence abundance does not eliminate markets. It restructures them.</p>
<p>Commerce shifts from attention markets — where human persuasion, emotional appeal, and narrative drive conversion — toward agent-mediated markets, where structured verifiability, legibility, and reliability determine selection.</p>
${canon('Persuasion loses power where verification dominates.')}
<p>When the buyer is an agent rather than a human, the currency of commerce changes. Emotional resonance becomes less relevant. Structural legibility becomes the primary selection criterion.</p>
<p>The organization whose offerings are structurally legible — clearly defined, verifiable, and interpretable by non-human decision systems — will hold a durable advantage in agent-mediated markets.</p>
<p class="muted">Agentic Commerce is not the end of marketing. It is the end of marketing built primarily for emotional persuasion. The structure of the offer becomes the message.</p>
`), '11')}


<!-- ═══════════════════════════════════════
     12 — AGENT ENGINE OPTIMIZATION
════════════════════════════════════════ -->
${page(section('12', 'Agent Engine Optimization', `
<p>Search Engine Optimization shaped the attention era. Agent Engine Optimization shapes the abundance era.</p>
<p>In the attention era, the goal was visibility — ranking high in search results, capturing human eyeballs, driving traffic through algorithmic distribution. The audience was human.</p>
<p>In the abundance era, the audience increasingly includes agents. AI systems that source, evaluate, summarize, recommend, and act on information on behalf of humans.</p>
${canon('Structural legibility is the new visibility.')}
<p>Agent Engine Optimization is the practice of making your organization's information, offers, and outputs legible to non-human systems. Not just findable — interpretable. Not just visible — verifiable.</p>
<p>The organization that cannot be accurately represented by an intelligent agent is effectively invisible in agent-mediated environments — regardless of how well it ranks in traditional search.</p>
<p class="muted">The shift from SEO to AEO is not a tactic change. It is a structural reconfiguration of what it means to be discoverable.</p>
`), '12')}


<!-- ═══════════════════════════════════════
     13 — THE GREAT FILTER
════════════════════════════════════════ -->
${page(section('13', 'The Great Filter', `
<p>Abundance does not eliminate competition. It intensifies selection.</p>
<p>The Great Filter of abundance does not ask who can produce. Production is no longer the discriminator. The Great Filter asks a different question.</p>
${canon('<span class="gold">Who can remain coherent?</span>')}
<p>Coherence under abundance means: maintaining a clear identity while expanding capability. Maintaining governance while increasing speed. Maintaining accountability while distributing intelligence. Maintaining direction while operating in volatile conditions.</p>
<p>The organizations that pass through the Great Filter are not the ones with the most capability. They are the ones whose capability is matched by their coherence — organizations that can expand without dissolving, produce without losing direction, and operate at scale without losing accountability.</p>
<p class="muted">Capability without coherence is not strength. It is exposure. The organizations that will matter most are the ones that can hold together while everything around them accelerates.</p>
`), '13')}


<!-- ═══════════════════════════════════════
     14 — THE RENAISSANCE OPERATOR
════════════════════════════════════════ -->
${page(section('14', 'The Renaissance Operator', `
<p>The Renaissance Operator does not outproduce abundance. They orchestrate it.</p>
<p>In the constrained era, the most valuable operator was the specialist — deep expertise in a narrow domain, producing outputs that few could match. In the abundance era, that advantage erodes as intelligence systems can replicate narrow expertise at scale.</p>
<p>The Renaissance Operator is defined not by what they can produce but by how they orchestrate. They can:</p>
<div class="card" style="margin: 5mm 0;">
  <p style="margin:0; color: var(--text); line-height:1.8;">Move between domains without losing coherence. Direct distributed intelligence without losing accountability. Evaluate outputs without needing to produce all of them. Commit to direction without needing certainty. Hold governance while expanding capability.</p>
</div>
${canon('They are more stable, more deliberate, and more difficult to replace.')}
<p class="muted">The Renaissance Operator is not a generalist who knows a little about everything. They are a synthesist who can govern complexity — who understands how intelligence systems interact, where accountability lies, and what direction the organization must hold.</p>
`), '14')}


<!-- ═══════════════════════════════════════
     15 — MAINTENANCE GRAVITY
════════════════════════════════════════ -->
${page(section('15', 'Maintenance Gravity', `
<p>Creation friction is falling faster than continuity capacity is expanding.</p>
<p>Starting becomes inexpensive. Deploying becomes fast. Building becomes accessible. But the capacity to sustain, govern, and maintain what has been built does not scale at the same rate.</p>
${canon('Starting becomes inexpensive. <span class="gold">Sustaining compounds.</span>')}
<p>Maintenance Gravity is the accumulating operational drag created when intelligent systems enter production. Every system deployed increases the total maintenance load — the complexity to understand, govern, repair, and safely depend upon.</p>
<p>The organization that deploys faster than its governance capacity can absorb does not become more capable. It becomes heavier. It appears faster while becoming less governable.</p>
<p>The question is no longer only: <em>Can this be built?</em><br>The question is: <em>Can this remain coherent?</em></p>
<p class="muted">The organizations that will endure are not those that build the most. They are those that build within the boundary of what they can maintain — and design governance capacity as a structural constraint alongside speed.</p>
`), '15')}


<!-- ═══════════════════════════════════════
     16 — SURVIVABLE SYSTEMS
════════════════════════════════════════ -->
${page(section('16', 'Survivable Systems', `
<p>Abundance rewards expansion. Survival rewards coherence.</p>
<p>The systems that endure will be the systems that remain governable under pressure — not the fastest, not the most capable in isolation, but the ones that can be understood, audited, adjusted, and trusted during volatility.</p>
${canon('The organizations that will matter most are not those that can scale the fastest, <span class="gold">but those that remain coherent while scaling.</span>')}
<p>Survivability is not a product feature. It is a structural property. It is designed in — through governance architecture, through accountability frameworks, through the deliberate constraint of capability within bounds that humans can govern.</p>
<p>A survivable system is one that can be explained. That can be adjusted. That fails transparently when it fails. That has clear ownership at every layer. That can be safely depended upon across time, not just in the moment of deployment.</p>
<p class="muted">Survivable Systems are not less ambitious than fragile systems. They are more disciplined — and in a volatile environment, discipline compounds into durability.</p>
`), '16')}


<!-- ═══════════════════════════════════════
     17 — DIRECTION WITHOUT PREDICTION
════════════════════════════════════════ -->
${page(section('17', 'Direction Without Prediction', `
<p>Prediction seeks certainty. Direction preserves coherence.</p>
<p>In high-velocity, high-uncertainty environments, prediction becomes increasingly unreliable. The events are too complex, the feedback loops too fast, the second-order effects too distributed. Operators who depend on accurate prediction are structurally exposed.</p>
${canon('The operator does not need to predict every event. <span class="gold">They need to understand which constraint is becoming dominant.</span>')}
<p>Direction Without Prediction is the capacity to operate with clear structural orientation — to understand the direction of pressure, the dominant bottleneck, and the governing constraint — without requiring accurate foresight of specific events.</p>
<p>The operator who knows which law is becoming active can act with direction while remaining agnostic about the precise path. They are not forecasting. They are orienting.</p>
<p class="muted">In an intelligence-abundant environment, prediction is produced at scale. Direction is scarce. The operator with structural orientation holds the advantage that matters.</p>
`), '17')}


<!-- ═══════════════════════════════════════
     18 — PHYSICAL CONSTRAINTS
════════════════════════════════════════ -->
${page(section('18', 'Physical Constraints', `
<p>Intelligence abundance appears digital. Its constraints are physical.</p>
<p>The systems that generate, transmit, store, and act on intelligence are not software abstractions. They are physical infrastructure — data centers, energy systems, semiconductor supply chains, bandwidth capacity, and the physical labor that builds, maintains, and operates all of it.</p>
${canon('Digital intelligence remains bounded by physical systems.')}
<p>The bottleneck that emerges as intelligence becomes widely available is not software. It is physical capacity: the energy to power inference at scale, the semiconductors to build systems that can run it, the infrastructure to distribute it.</p>
<p>The operator who understands that intelligence abundance is physically constrained can orient toward the physical layer — toward the energy infrastructure required, the hardware supply chains that govern capability expansion, and the physical systems that determine the ceiling of what is possible at scale.</p>
<p class="muted">Intelligence is not weightless. Every inference runs on power. Every model runs on hardware. The physical constraint is not a temporary limitation — it is a structural reality that shapes the strategic landscape.</p>
`), '18')}


<!-- ═══════════════════════════════════════
     19 — SECOND-ORDER EFFECTS
════════════════════════════════════════ -->
${page(section('19', 'Second-Order Effects', `
<p>First-order effects are visible. Second-order effects are harder to see, yet more consequential.</p>
<p>The first-order effect of intelligence abundance is obvious: production becomes faster, cheaper, and more accessible. That is the visible layer — the one that generates excitement, investment, and immediate adaptation.</p>
${canon('Design for consequence, not excitement.')}
<p>The second-order effects are structural: as production becomes abundant, the bottleneck migrates. As automation increases, accountability becomes ambiguous. As systems multiply, maintenance gravity accumulates. As speed increases, coherence becomes fragile.</p>
<p>The operator oriented toward second-order effects does not ask: <em>What can this enable?</em> They ask: <em>What does this change structurally? What constraint does this dissolve, and what constraint does it create?</em></p>
<p>The organizations that will navigate intelligence abundance most effectively are those that were oriented toward second-order consequences before the first-order effects became visible to everyone else.</p>
<p class="muted">By the time first-order effects are obvious, the second-order structural consequences are already in motion. The advantage belongs to those who were thinking one layer deeper.</p>
`), '19')}


<!-- ═══════════════════════════════════════
     20 — THE SIGNALS APPLICATION
════════════════════════════════════════ -->
${page(section('20', 'The Signals Application of the Operator Kernel', `
<p>Applied to CE Signals, the Operator Kernel provides a doctrine-governed method for structural orientation. Signals is not forecasting. Signals is structural orientation under volatility.</p>
${canon('Signals are not news. A single update does not create a signal. <span class="gold">Signals emerge when accumulated evidence reveals structural pressure.</span>')}
<p class="muted" style="margin-bottom: 5mm;">The Four Questions that govern Signals evaluation:</p>
<div class="questions-grid">
  <div class="q-card"><span class="q-num">01</span><span class="q-text">What changed?</span></div>
  <div class="q-card"><span class="q-num">02</span><span class="q-text">What structural direction does it support?</span></div>
  <div class="q-card"><span class="q-num">03</span><span class="q-text">What pressure is accumulating?</span></div>
  <div class="q-card"><span class="q-num">04</span><span class="q-text">What second-order consequence follows?</span></div>
</div>
<p style="margin-top: 5mm;">Every signal evaluated through CE Signals is assessed against the Eight Laws — not as a news event, but as structural evidence. The signal is not the event. The signal is what the event reveals about the direction of structural pressure.</p>
<p class="muted">Signals is the applied intelligence layer of the Operator Kernel. Where the Kernel provides doctrine, Signals provides ongoing orientation — the live feed of structural evidence evaluated against the framework.</p>
`), '20')}


<!-- ═══════════════════════════════════════
     21 — CLOSING DOCTRINE
════════════════════════════════════════ -->
<div class="page closing">
  <div class="closing-ring">
    ${CE_MARK.replace('width="40" height="40"', 'width="52" height="52"')}
  </div>
  <div class="closing-title">Intelligence is abundant.</div>
  <div class="closing-gold">Judgment is power.</div>
  <div class="closing-divider"></div>
  <p style="max-width:100mm; color:var(--muted); font-size:10.5pt; line-height:1.75; text-align:center; margin-bottom: 8mm;">For operators, builders, and institutions navigating intelligence-abundant systems.</p>
  <p style="max-width:100mm; color:var(--dim); font-size:10pt; line-height:1.75; text-align:center; margin-bottom: 10mm;">The organizations that will matter most are not those that automate the most, but those that can carry the weight of what they automate.</p>
  <div class="closing-mark">
    Cognitive Empire<br>
    Operator Kernel — Public Mini Canon<br>
    Classification: Public · Version 1.0 · 2026
  </div>
</div>

</body>
</html>`

/* ─── Render ───────────────────────────────────────────── */
const browser = await chromium.launch()
const pg = await browser.newPage()

await pg.setContent(html, { waitUntil: 'networkidle' })
await pg.waitForTimeout(2000)

const pdf = await pg.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
})

await browser.close()

writeFileSync(OUT, pdf)
console.log(`✓ PDF written → ${OUT} (${(pdf.length / 1024).toFixed(0)} KB)`)
