'use client'

import { useState, useRef } from 'react'
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

type Step     = 'input' | 'prompt' | 'result'
type Severity = 'low' | 'moderate' | 'high' | 'critical'

interface ScoreResult {
  ownerless:  number
  loops:      number
  debtScore:  number
  fastestWin: string
  analysis:   string
  severity:   Severity
}

function buildPrompt(headline: string, dump: string): string {
  return `You are a Maintenance Gravity Analyst. Evaluate the following operation for accumulated operational debt and governance drag.

CONTEXT: ${headline}

OPERATION DESCRIPTION:
${dump}

Respond ONLY in this exact format — no preamble, no explanation outside the format:

OWNERLESS: [integer — count of processes, systems, or decisions with no clear single owner]
LOOPS: [integer — count of unresolved recurring problems, repeated fires, or cyclic bottlenecks]
DEBT_SCORE: [integer 0–100 — overall maintenance gravity score; 100 = maximum operational debt]
FASTEST_WIN: [one specific, actionable step that would reduce maintenance gravity the fastest]

ANALYSIS: [2–3 sentences identifying the primary source of maintenance gravity in this operation]`
}

function parseResult(raw: string): ScoreResult | null {
  const ownerlessMatch = raw.match(/OWNERLESS:\s*(\d+)/i)
  const loopsMatch     = raw.match(/LOOPS:\s*(\d+)/i)
  const debtMatch      = raw.match(/DEBT_SCORE:\s*(\d+)/i)
  const winMatch       = raw.match(/FASTEST_WIN:\s*(.+)/i)
  const analysisMatch  = raw.match(/ANALYSIS:\s*([\s\S]+)/i)

  if (!debtMatch) return null

  const debtScore = Math.min(100, Math.max(0, parseInt(debtMatch[1], 10)))
  const severity: Severity =
    debtScore <= 35 ? 'low' :
    debtScore <= 60 ? 'moderate' :
    debtScore <= 80 ? 'high' :
    'critical'

  return {
    ownerless:  ownerlessMatch ? parseInt(ownerlessMatch[1], 10) : 0,
    loops:      loopsMatch     ? parseInt(loopsMatch[1],     10) : 0,
    debtScore,
    fastestWin: winMatch      ? winMatch[1].trim()              : '',
    analysis:   analysisMatch ? analysisMatch[1].trim()         : '',
    severity,
  }
}

const SEV_COLORS: Record<Severity, string> = {
  low:      '#2FB67E',
  moderate: '#C9A961',
  high:     '#E07640',
  critical: '#E05050',
}

const SEV_LABELS: Record<Severity, string> = {
  low:      'LOW GRAVITY',
  moderate: 'MODERATE GRAVITY',
  high:     'HIGH GRAVITY',
  critical: 'CRITICAL GRAVITY',
}

const SEV_DESCS: Record<Severity, string> = {
  low:      'Your operation carries manageable maintenance mass. Governance structures are functional.',
  moderate: 'Operational debt is accumulating. Without intervention, gravity compounds.',
  high:     'Significant maintenance mass detected. Key systems lack clear ownership or oversight.',
  critical: 'Operation is under severe maintenance gravity. Immediate governance intervention required.',
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
  const [parseError, setParseError] = useState(false)
  const [copied,     setCopied]     = useState(false)
  const promptRef = useRef<HTMLTextAreaElement>(null)

  const generated = buildPrompt(
    headline.trim() || 'AI-assisted operation',
    dump.trim()     || '(no description provided)',
  )

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

  function handleCalculate() {
    const parsed = parseResult(response)
    if (!parsed) { setParseError(true); return }
    setParseError(false)
    setResult(parsed)
    setStep('result')
  }

  function handleReset() {
    setStep('input'); setHeadline(''); setDump('')
    setResponse(''); setResult(null); setParseError(false)
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
                  ref={promptRef}
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
                onChange={(e) => { setResponse(e.target.value); setParseError(false) }}
              />
              {parseError && (
                <p style={{ fontSize: '0.74rem', color: '#E05050', marginBottom: 12, lineHeight: 1.5 }}>
                  Could not find a DEBT_SCORE in the response. Make sure the AI followed the format — check the response contains "DEBT_SCORE: [number]".
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
        {step === 'result' && result && (
          <div style={{ padding: '26px 22px' }}>

            {/* Score */}
            <div style={{
              textAlign: 'center', marginBottom: 28,
              paddingBottom: 24, borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{
                fontSize: 'clamp(4.5rem, 14vw, 7.5rem)', fontWeight: 300,
                fontFamily: 'monospace', lineHeight: 1,
                color: SEV_COLORS[result.severity], letterSpacing: '-0.04em',
              }}>
                {result.debtScore}
                <span style={{ fontSize: '1.4rem', color: T.dim, marginLeft: 4 }}>/100</span>
              </div>
              <div style={{
                display: 'inline-block', marginTop: 12,
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.28em',
                textTransform: 'uppercase', fontFamily: 'monospace',
                color: SEV_COLORS[result.severity],
                background: `${SEV_COLORS[result.severity]}18`,
                border: `1px solid ${SEV_COLORS[result.severity]}44`,
                padding: '4px 12px',
              }}>
                {SEV_LABELS[result.severity]}
              </div>
              <p style={{
                marginTop: 14, fontSize: '0.84rem', color: T.muted,
                maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
              }}>
                {SEV_DESCS[result.severity]}
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
                  { key: 'OWNERLESS', val: result.ownerless, desc: 'processes or systems with no clear single owner', color: T.text },
                  { key: 'LOOPS',     val: result.loops,     desc: 'unresolved recurring problems or cyclic bottlenecks', color: T.text },
                  { key: 'DEBT_SCORE',val: result.debtScore, desc: 'overall maintenance gravity (0–100)', color: SEV_COLORS[result.severity] },
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

          </div>
        )}

      </div>
    </>
  )
}
