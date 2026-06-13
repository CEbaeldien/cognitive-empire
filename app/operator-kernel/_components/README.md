# CE Operator Kernel — `/app/operator-kernel`

Public doctrine page for Cognitive Empire. 21-section sovereign intelligence instrument.

---

## File structure

```
app/operator-kernel/
├── page.tsx                        ← Main route (server component)
└── _components/
    ├── TopNav.tsx                  ← Sticky sovereign nav (server)
    ├── KernelHero.tsx              ← Doctrine hero section (server)
    ├── MiniIndexClient.tsx         ← Left-rail index with active tracking (client)
    ├── DoctrineComponents.tsx      ← SectionShell, CanonPlate, LawCard,
    │                                  MigrationBoard, SignalQuestionCard (server)
    ├── ClosingDoctrine.tsx         ← Section 21 closing frame (server)
    └── DownloadButton.tsx          ← PDF download CTA, nav + hero variants (server)

globals-additions.css               ← Append this to app/globals.css
```

---

## Setup steps

### 1. Append CSS to `app/globals.css`

Copy the entire contents of `globals-additions.css` and append to your project's
`app/globals.css`. This provides the CSS variables, `ce-card`, `canon-plate`,
`law-card`, `migration-row`, `section-shell`, `heading-serif`, `doctrine-prose`,
`section-number` classes, print stylesheet, and reduced-motion support.

### 2. Copy the component folder

Drop `_components/` into `app/operator-kernel/` alongside `page.tsx`.

### 3. PDF asset

Place the doctrine PDF at `/public/downloads/ce-public-kernel.pdf`.
Both download buttons point to `/downloads/ce-public-kernel.pdf`.

### 4. Tailwind config — no changes required

All CE-specific values use Tailwind arbitrary notation (`text-[#C5A26F]`, etc.)
or the CSS classes from step 1. No `tailwind.config.js` extension is needed.

### 5. Font loading

`page.tsx` loads `Inter` and `Playfair_Display` via `next/font/google`.
If you already load `Inter` in your root `layout.tsx`, remove it from `page.tsx`
to avoid double-loading. `Playfair_Display` with `variable: '--font-playfair'`
must be present on the page for `.heading-serif` to work.

---

## Component reference

| Component             | Type   | Purpose |
|-----------------------|--------|---------|
| `TopNav`              | Server | Sticky nav — logo, section links, download CTA |
| `KernelHero`          | Server | Hero with headline, sub-title, three CTAs |
| `MiniIndexClient`     | Client | Left-rail ToC with active section highlight + `?` shortcut |
| `SectionShell`        | Server | Typed `<section>` wrapper with `scroll-margin-top` |
| `CanonPlate`          | Server | Gold-bordered doctrine statement block |
| `LawCard`             | Server | Individual card for each of the Eight Laws |
| `MigrationBoard`      | Server | Bottleneck migration table with hover rows |
| `SignalQuestionCard`  | Server | Plain ce-card for each of the Four Questions |
| `DownloadButton`      | Server | PDF download link — `nav` or `hero` variant |
| `ClosingDoctrine`     | Server | Section 21 centered closing canon frame |

---

## Print

The print stylesheet in `globals-additions.css` hides the nav and sidebar,
sets a white background, converts gold to a warm dark accent, prevents orphaned
headings, and inserts page breaks before major sections (Laws, Signals, Closing).
Print from any browser using standard `Ctrl/Cmd + P`.

---

## Keyboard shortcut

Press `?` with focus on the page body → smooth-scroll to `#eight-laws`.
Implemented in `MiniIndexClient` (client-side event listener).
