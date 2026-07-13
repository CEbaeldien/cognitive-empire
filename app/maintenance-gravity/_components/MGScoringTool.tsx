'use client'

import { useState } from 'react'
import Link from 'next/link'

const T = {
  bg:        '#03050A',
  panel:     '#0A1221',
  deep:      '#060C18',
  border:    'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.10)',
  text:      '#EBF1FA',
  muted:     '#7A8DA6',
  dim:       '#4A5A70',
  gold:      '#C9A961',
  goldBorder:'rgba(201,169,97,0.30)',
  input:     '#0D1828',
} as const

type Step = 'input' | 'prompt' | 'result'
type SaveStatus = 'idle' | 'loading' | 'saved' | 'error'

interface ScoreResult {
  ownerless:    number
  loops:        number
  gravityScore: number
  fastestWin:   string
  analysis:     string
}

interface Band {
  key:   string
  label: string
  min:   number
  max:   number
  color: string
  desc:  string
}

const BANDS: Band[] = [
  { key: 'light',       label: 'Light',              min: 0,  max: 20,  color: '#2FB67E',
    desc: 'Your operation carries minimal maintenance mass. Governance is clean.' },
  { key: 'manageable',  label: 'Manageable Drag',    min: 21, max: 40,  color: '#9BB84A',
    desc: 'Some operational debt is accumulating. Still manageable without intervention.' },
  { key: 'operational', label: 'Operational Weight', min: 41, max: 60,  color: '#C9A961',
    desc: 'Maintenance mass is becoming a real cost. Ownership gaps are starting to show.' },
  { key: 'fragility',   label: 'Fragility Zone',     min: 61, max: 80,  color: '#E07640',
    desc: 'Significant maintenance mass detected. Key systems lack clear ownership or oversight.' },
  { key: 'collapse',    label: 'Collapse Risk',      min: 81, max: 100, color: '#E05050',
    desc: 'Operation is under severe maintenance gravity. Immediate governance intervention required.' },
]

function getBand(score: number): Band {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[BANDS.length - 1]
}

function buildPrompt(headline: string, dump: string): string {
  return `You are a Maintenance Gravity Analyst. Evaluate the following operation for accumulated operational debt and governance drag.

CONTEXT: ${headline}

OPERATION DESCRIPTION:
${dump}

Respond ONLY in this exact format — no preamble, no explanation outside the format:

OWNERLESS: [integer — count of processes, systems, or decisions with no clear single owner]
LOOPS: [integer — count of unresolved recurring problems, repeated fires, or cyclic bottlenecks]
GRAVITY_SCORE: [integer 0–100 — overall maintenance gravity score; 100 = maximum operational debt]
FASTEST_WIN: [one specific, actionable step that would reduce maintenance gravity the fastest]

ANALYSIS: [2–3 sentences identifying the primary source of maintenance gravity in this operation]`
}

// Tolerant field matchers — models add preambles, markdown bold, and
// inconsistent spacing, so fields are matched anywhere in the text rather
// than anchored to a line start.
function matchInt(raw: string, names: string[]): number | null {
  for (const name of names) {
    const re = new RegExp(`\\*{0,2}${name}\\*{0,2}\\s*:?\\s*\\*{0,2}\\s*(\\d+)`, 'i')
    const m = raw.match(re)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

function matchLine(raw: string, name: string): string | null {
  const re = new RegExp(`\\*{0,2}${name}\\*{0,2}\\s*:\\s*\\*{0,2}\\s*(.+)`, 'i')
  const m = raw.match(re)
  return m ? m[1].trim() : null
}

function matchRest(raw: string, name: string): string | null {
  const re = new RegExp(`\\*{0,2}${name}\\*{0,2}\\s*:\\s*\\*{0,2}\\s*([\\s\\S]+)`, 'i')
  const m = raw.match(re)
  return m ? m[1].trim() : null
}

type ParseOutcome = { result: ScoreResult } | { missingField: string }

function parseResult(raw: string): ParseOutcome {
  const score = matchInt(raw, ['GRAVITY_SCORE', 'DEBT_SCORE'])
  if (score === null) return { missingField: 'GRAVITY_SCORE (or DEBT_SCORE)' }

  return {
    result: {
      gravityScore: Math.min(100, Math.max(0, score)),
      ownerless:    matchInt(raw, ['OWNERLESS']) ?? 0,
      loops:        matchInt(raw, ['LOOPS']) ?? 0,
      fastestWin:   matchLine(raw, 'FASTEST_WIN') ?? '',
      analysis:     matchRest(raw, 'ANALYSIS') ?? '',
    },
  }
}

const baseInput: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0D1828', border: '1px solid rgba(255,255,255,0.10)',
  color: '#EBF1FA', padding: '10px 14px',
  fontSize: '0.9rem', lineHeight: '1.5', outline: 'none',
  fontFamily: 'inherit',
}

export function MGScoringTool() {
  const [step,       setStep]       = useState<Step>('input')
  const [headline,   setHeadline]   = useState('')
  const [dump,       setDump]       = useState('')
  const [response,   setResponse]   = useState('')
  const [result,     setResult]     = useState<ScoreResult | null>(null)
  const [parseErrorField, setParseErrorField] = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)

  const [scoreId,   setScoreId]   = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)

  const [emailInput,  setEmailInput]  = useState('')
  const [emailStatus, setEmailStatus] = useState<SaveStatus>('idle')

  const [testimonialComment, setTestimonialComment] = useState('')
  const [testimonialStatus,  setTestimonialStatus]  = useState<SaveStatus>('idle')

  const generated = buildPrompt(
    headline.trim() || 'AI-assisted operation',
    dump.trim()     || '(no description provided)',
  )

  const band = result ? getBand(result.gravityScore) : null

  function handleGenerate() {
    if (!headline.trim() && !dump.trim()) return
    setStep('prompt')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCalculate() {
    const outcome = parseResult(response)
    if (!('result' in outcome)) {
      setParseErrorField(outcome.missingField)
      return
    }
    setParseErrorField(null)
    setResult(outcome.result)
    setStep('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setSaveError(false)
    try {
      const res = await fetch('/api/maintenance-gravity/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline:     headline.trim(),
          dump:         dump.trim(),
          ownerless:    outcome.result.ownerless,
          loops:        outcome.result.loops,
          gravityScore: outcome.result.gravityScore,
          band:         getBand(outcome.result.gravityScore).label,
          analysis:     outcome.result.analysis,
          fastestWin:   outcome.result.fastestWin,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json()
      setScoreId(data.id)
      setCreatedAt(data.createdAt)
    } catch {
      setSaveError(true)
    }
  }

  async function handleSaveEmail() {
    if (!scoreId || !emailInput.includes('@')) return
    setEmailStatus('loading')
    try {
      const res = await fetch(`/api/maintenance-gravity/score/${scoreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      })
      if (!res.ok) throw new Error()
      setEmailStatus('saved')
    } catch {
      setEmailStatus('error')
    }
  }

  async function handleTestimonialYes() {
    if (!scoreId) return
    setTestimonialStatus('loading')
    try {
      const res = await fetch(`/api/maintenance-gravity/score/${scoreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialPermission: true,
          testimonial: testimonialComment.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setTestimonialStatus('saved')
    } catch {
      setTestimonialStatus('error')
    }
  }

  function handleDownload() {
    window.print()
  }

  function handleGetStartedClick() {
    if (!scoreId) return
    fetch(`/api/maintenance-gravity/score/${scoreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditInterest: true }),
    }).catch(() => {})
  }

  function handleReset() {
    setStep('input'); setHeadline(''); setDump('')
    setResponse(''); setResult(null); setParseErrorField(null)
    setScoreId(null); setCreatedAt(null); setSaveError(false)
    setEmailInput(''); setEmailStatus('idle')
    setTestimonialComment(''); setTestimonialStatus('idle')
  }

  return (
    <>
      <style>{`
        .mgt-input:focus { border-color: rgba(201,169,97,0.45) !important; }
        .mgt-btn {
          cursor: pointer; border: none; outline: none; font-family: inherit;
          transition: opacity 150ms ease;
        }
        .mgt-btn:hover:not(:disabled) { opacity: 0.85; }
        .mgt-btn:disabled { opacity: 0.40; cursor: not-allowed; }
        .mgt-step-num {
          display: block; font-size: 0.52rem; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          font-family: monospace; color: rgba(201,169,97,0.65);
          margin-bottom: 3px;
        }
        .mgt-step-label {
          display: block; font-size: 0.78rem; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: #EBF1FA; margin-bottom: 18px;
        }
        .mgt-field-label {
          display: block; font-size: 0.68rem; color: #4A5A70;
          letter-spacing: 0.08em; margin-bottom: 6px;
          font-family: monospace; text-transform: uppercase;
        }
        .mgt-back {
          background: none; border: none; cursor: pointer; padding: 0;
          font-size: 0.68rem; color: #4A5A70; letter-spacing: 0.06em;
          text-decoration: underline; text-decoration-color: #2A3548;
          font-family: inherit; transition: color 150ms ease;
        }
        .mgt-back:hover { color: #7A8DA6; }
        .mgt-row {
          display: flex; align-items: baseline; gap: 14px;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .mgt-row:last-child { border-bottom: none; }

        .mg-print-card { display: none; }
        @media print {
          body * { visibility: hidden; }
          .mg-print-card, .mg-print-card * { visibility: visible; }
          .mg-print-card {
            display: block !important;
            position: absolute; top: 0; left: 0; width: 100%;
            background: #05070B; color: #FFFFFF;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .mg-print-inner { max-width: 640px; margin: 0 auto; padding: 48px 40px; }
          .mg-print-brand {
            font-size: 0.62rem; font-weight: 700; letter-spacing: 0.3em;
            color: #C9A961; font-family: monospace; margin-bottom: 6px;
          }
          .mg-print-label { font-size: 0.9rem; color: #B9C4D6; margin-bottom: 28px; }
          .mg-print-score { font-size: 4.2rem; font-weight: 300; font-family: monospace; color: #FFFFFF; }
          .mg-print-score span { font-size: 1.2rem; color: #7A8DA6; margin-left: 4px; }
          .mg-print-band {
            font-size: 0.72rem; font-weight: 700; letter-spacing: 0.2em;
            text-transform: uppercase; color: #C9A961; margin: 8px 0 24px;
          }
          .mg-print-rule { height: 1px; background: rgba(255,255,255,0.15); margin-bottom: 20px; }
          .mg-print-row {
            display: flex; gap: 12px; align-items: baseline; padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem;
          }
          .mg-print-row span:first-child { font-family: monospace; color: #7A8DA6; min-width: 100px; }
          .mg-print-row b { font-size: 1rem; }
          .mg-print-block { margin-top: 20px; }
          .mg-print-block-label {
            font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em;
            text-transform: uppercase; color: #C9A961; margin-bottom: 6px;
          }
          .mg-print-block p { font-size: 0.84rem; line-height: 1.6; color: #D5DCE8; margin: 0; }
          .mg-print-footer {
            display: flex; justify-content: space-between; margin-top: 36px;
            padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 0.7rem; color: #7A8DA6; font-family: monospace;
          }
        }
      `}</style>

      <div style={{
        maxWidth: 760,
        background: T.panel,
        border: `1px solid ${T.borderMid}`,
        borderTop: `2px solid ${T.goldBorder}`,
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 22px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', fontFamily: 'monospace',
              color: T.gold, background: 'rgba(201,169,97,0.10)',
              border: '1px solid rgba(201,169,97,0.20)', padding: '3px 8px',
            }}>
              Free Tool
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, letterSpacing: '-0.01em' }}>
              Maintenance Gravity Score
            </span>
          </div>
          {step !== 'input' && (
            <button className="mgt-back" onClick={handleReset}>← Start over</button>
          )}
        </div>

        {/* ── STEP A ── */}
        {step === 'input' && (
          <div style={{ padding: '26px 22px' }}>
            <span className="mgt-step-num">Step 01</span>
            <span className="mgt-step-label">Describe your operation</span>

            <div style={{ marginBottom: 14 }}>
              <label className="mgt-field-label">What are you building or running?</label>
              <input
                type="text"
                className="mgt-input"
                style={baseInput}
                placeholder="e.g. AI customer support, sales automation stack, internal ops..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label className="mgt-field-label">
                Describe it — systems, tools, team, problems. Messy is fine.
              </label>
              <textarea
                className="mgt-input"
                style={{ ...baseInput, minHeight: 160, resize: 'vertical' }}
                placeholder={"We use five different AI tools, nobody owns the outputs, our support team keeps getting surprised by what the model says, we've had to manually fix things three times this month..."}
                value={dump}
                onChange={(e) => setDump(e.target.value)}
              />
            </div>

            <button
              className="mgt-btn"
              style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: T.bg,
                background: T.gold, padding: '11px 24px',
              }}
              disabled={!headline.trim() && !dump.trim()}
              onClick={handleGenerate}
            >
              Generate my prompt →
            </button>

            <p style={{ marginTop: 12, fontSize: '0.72rem', color: T.dim, lineHeight: 1.55 }}>
              We'll build a structured analysis prompt. Paste it into Claude, ChatGPT, or any AI model — then paste the response back here to calculate your score.
            </p>
          </div>
        )}

        {/* ── STEP B ── */}
        {step === 'prompt' && (
          <div style={{ padding: '26px 22px' }}>

            <div style={{ marginBottom: 28 }}>
              <span className="mgt-step-num">Step 02</span>
              <span className="mgt-step-label">Copy this prompt</span>
              <p style={{ fontSize: '0.78rem', color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
                Paste this into <strong style={{ color: T.text }}>Claude, ChatGPT, or any AI model</strong> and copy the full response.
              </p>
              <div style={{ position: 'relative' }}>
                <textarea
                  readOnly
                  className="mgt-input"
                  style={{
                    ...baseInput, minHeight: 200, resize: 'none',
                    fontFamily: 'monospace', fontSize: '0.76rem', color: T.muted,
                  }}
                  value={generated}
                />
                <button
                  className="mgt-btn"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: copied ? '#2FB67E' : T.text,
                    background: 'rgba(6,12,24,0.96)',
                    border: `1px solid ${copied ? 'rgba(47,182,126,0.40)' : T.borderMid}`,
                    padding: '6px 12px',
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy prompt'}
                </button>
              </div>
            </div>

            <div>
              <span className="mgt-step-num">Step 03</span>
              <span className="mgt-step-label">Paste the AI's response</span>
              <textarea
                className="mgt-input"
                style={{ ...baseInput, minHeight: 160, resize: 'vertical', marginBottom: 14 }}
                placeholder="Paste the full AI response here..."
                value={response}
                onChange={(e) => { setResponse(e.target.value); setParseErrorField(null) }}
              />
              {parseErrorField && (
                <p style={{ fontSize: '0.74rem', color: '#E05050', marginBottom: 12, lineHeight: 1.5 }}>
                  Couldn't find {parseErrorField} in the response. Make sure the AI followed the format — check the response contains "GRAVITY_SCORE: [number]".
                </p>
              )}
              <button
                className="mgt-btn"
                style={{
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: T.bg,
                  background: T.gold, padding: '11px 24px',
                }}
                disabled={!response.trim()}
                onClick={handleCalculate}
              >
                Calculate my score →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP C ── */}
        {step === 'result' && result && band && (
          <div style={{ padding: '26px 22px' }}>

            {saveError && (
              <p style={{ fontSize: '0.72rem', color: '#E05050', textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>
                Your results are shown below but couldn't be saved — email delivery and download are unavailable this session.
              </p>
            )}

            {/* Score */}
            <div style={{
              textAlign: 'center', marginBottom: 28,
              paddingBottom: 24, borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{
                fontSize: 'clamp(4.5rem, 14vw, 7.5rem)', fontWeight: 300,
                fontFamily: 'monospace', lineHeight: 1,
                color: band.color, letterSpacing: '-0.04em',
              }}>
                {result.gravityScore}
                <span style={{ fontSize: '1.4rem', color: T.dim, marginLeft: 4 }}>/100</span>
              </div>
              <div style={{
                display: 'inline-block', marginTop: 12,
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.28em',
                textTransform: 'uppercase', fontFamily: 'monospace',
                color: band.color,
                background: `${band.color}18`,
                border: `1px solid ${band.color}44`,
                padding: '4px 12px',
              }}>
                {band.label}
              </div>
              <p style={{
                marginTop: 14, fontSize: '0.84rem', color: T.muted,
                maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
              }}>
                {band.desc}
              </p>
            </div>

            {/* Breakdown */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.28em',
                textTransform: 'uppercase', fontFamily: 'monospace',
                color: 'rgba(201,169,97,0.65)', marginBottom: 10,
              }}>
                Breakdown
              </div>
              <div>
                {([
                  { key: 'OWNERLESS',      val: result.ownerless,    desc: 'processes or systems with no clear single owner', color: T.text },
                  { key: 'LOOPS',          val: result.loops,        desc: 'unresolved recurring problems or cyclic bottlenecks', color: T.text },
                  { key: 'GRAVITY_SCORE',  val: result.gravityScore, desc: 'overall maintenance gravity (0–100)', color: band.color },
                ] as const).map(({ key, val, desc, color }) => (
                  <div key={key} className="mgt-row">
                    <span style={{ fontSize: '0.72rem', color: T.dim, fontFamily: 'monospace', minWidth: 120, flexShrink: 0 }}>{key}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color, fontFamily: 'monospace', minWidth: 36, flexShrink: 0 }}>{val}</span>
                    <span style={{ fontSize: '0.76rem', color: T.dim, lineHeight: 1.45 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis */}
            {result.analysis && (
              <div style={{
                marginBottom: 18, padding: '14px 16px',
                background: T.deep, border: `1px solid ${T.border}`,
                borderLeft: '2px solid rgba(201,169,97,0.30)',
              }}>
                <div style={{
                  fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.28em',
                  textTransform: 'uppercase', fontFamily: 'monospace',
                  color: 'rgba(201,169,97,0.55)', marginBottom: 8,
                }}>
                  Analysis
                </div>
                <p style={{ fontSize: '0.84rem', color: T.muted, lineHeight: 1.7, margin: 0 }}>
                  {result.analysis}
                </p>
              </div>
            )}

            {/* Fastest Win */}
            {result.fastestWin && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: 'rgba(47,182,126,0.05)',
                border: '1px solid rgba(47,182,126,0.22)',
              }}>
                <div style={{
                  fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.28em',
                  textTransform: 'uppercase', fontFamily: 'monospace',
                  color: 'rgba(47,182,126,0.70)', marginBottom: 8,
                }}>
                  Fastest Win
                </div>
                <p style={{ fontSize: '0.9rem', color: '#EBF1FA', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {result.fastestWin}
                </p>
              </div>
            )}

            {/* Email capture + testimonial + download — only once the row is persisted */}
            {scoreId && (
              <>
                <div style={{ marginBottom: 14, padding: '16px 18px', background: T.deep, border: `1px solid ${T.border}` }}>
                  <div style={{
                    fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.28em',
                    textTransform: 'uppercase', fontFamily: 'monospace',
                    color: 'rgba(201,169,97,0.65)', marginBottom: 10,
                  }}>
                    Email me my scorecard
                  </div>
                  {emailStatus === 'saved' ? (
                    <p style={{ fontSize: '0.82rem', color: '#2FB67E', margin: 0 }}>
                      Saved — you can now download your scorecard below.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        className="mgt-input"
                        style={{ ...baseInput, flex: '1 1 220px' }}
                        placeholder="you@company.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                      <button
                        className="mgt-btn"
                        style={{
                          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: T.bg, background: T.gold, padding: '10px 18px',
                        }}
                        disabled={!emailInput.includes('@') || emailStatus === 'loading'}
                        onClick={handleSaveEmail}
                      >
                        {emailStatus === 'loading' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                  {emailStatus === 'error' && (
                    <p style={{ fontSize: '0.72rem', color: '#E05050', marginTop: 8 }}>Couldn't save that — try again.</p>
                  )}
                </div>

                <div style={{ marginBottom: 18, padding: '16px 18px', background: T.deep, border: `1px solid ${T.border}` }}>
                  <div style={{
                    fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.28em',
                    textTransform: 'uppercase', fontFamily: 'monospace',
                    color: 'rgba(201,169,97,0.65)', marginBottom: 10,
                  }}>
                    May we cite your score anonymously in our benchmark?
                  </div>
                  {testimonialStatus === 'saved' ? (
                    <p style={{ fontSize: '0.82rem', color: '#2FB67E', margin: 0 }}>Thanks — noted.</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="mgt-input"
                        style={{ ...baseInput, marginBottom: 10 }}
                        placeholder="Optional one-line comment"
                        value={testimonialComment}
                        onChange={(e) => setTestimonialComment(e.target.value)}
                        maxLength={280}
                      />
                      <button
                        className="mgt-btn"
                        style={{
                          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em',
                          textTransform: 'uppercase', color: T.text, background: T.input,
                          border: `1px solid ${T.borderMid}`, padding: '9px 18px',
                        }}
                        disabled={testimonialStatus === 'loading'}
                        onClick={handleTestimonialYes}
                      >
                        {testimonialStatus === 'loading' ? 'Saving…' : 'Yes, you may'}
                      </button>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <button
                    className="mgt-btn"
                    style={{
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: emailStatus === 'saved' ? T.bg : T.dim,
                      background: emailStatus === 'saved' ? T.gold : 'transparent',
                      border: `1px solid ${emailStatus === 'saved' ? T.gold : T.border}`,
                      padding: '11px 24px', width: '100%',
                    }}
                    disabled={emailStatus !== 'saved'}
                    onClick={handleDownload}
                  >
                    Download scorecard
                  </button>
                  {emailStatus !== 'saved' && (
                    <p style={{ marginTop: 8, fontSize: '0.72rem', color: T.dim }}>
                      Save your email above to unlock the download.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Upgrade CTA */}
            <div style={{
              padding: '18px 20px',
              background: 'linear-gradient(135deg, #0D1828 0%, #0A1221 100%)',
              border: `1px solid ${T.goldBorder}`,
              borderTop: '2px solid rgba(201,169,97,0.35)',
              display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'space-between', gap: 14,
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.text, marginBottom: 4, letterSpacing: '-0.01em' }}>
                  Ready to reduce your maintenance gravity?
                </div>
                <div style={{ fontSize: '0.76rem', color: T.dim, lineHeight: 1.5 }}>
                  Weekly MG reports and intervention recommendations — from $49/mo.
                </div>
              </div>
              <Link
                href="/maintenance-gravity/subscribe?tier=starter"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleGetStartedClick}
                style={{
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: T.bg, background: T.gold,
                  padding: '10px 20px', textDecoration: 'none', flexShrink: 0,
                  display: 'inline-block',
                }}
              >
                Get started →
              </Link>
            </div>

            {/* Printable scorecard — hidden on screen, shown via print stylesheet */}
            <div className="mg-print-card">
              <div className="mg-print-inner">
                <div className="mg-print-brand">COGNITIVE EMPIRE</div>
                <div className="mg-print-label">Maintenance Gravity Scorecard</div>
                <div className="mg-print-score">
                  {result.gravityScore}<span>/100</span>
                </div>
                <div className="mg-print-band">{band.label}</div>
                <div className="mg-print-rule" />
                <div className="mg-print-row">
                  <span>OWNERLESS</span><b>{result.ownerless}</b>
                </div>
                <div className="mg-print-row">
                  <span>LOOPS</span><b>{result.loops}</b>
                </div>
                {result.analysis && (
                  <div className="mg-print-block">
                    <div className="mg-print-block-label">Analysis</div>
                    <p>{result.analysis}</p>
                  </div>
                )}
                {result.fastestWin && (
                  <div className="mg-print-block">
                    <div className="mg-print-block-label">Fastest Win</div>
                    <p>{result.fastestWin}</p>
                  </div>
                )}
                <div className="mg-print-footer">
                  <span>
                    {new Date(createdAt ?? Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                  <span>cognitiveempire.com/maintenance-gravity</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  )
}
