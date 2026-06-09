'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RoastAnnotation, RoastVerdict } from '@/lib/resume-schema'
import { CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface RoastedResumeProps {
  resumeText: string
  annotations: RoastAnnotation[]
  roastScore?: number
  roastScoreMeaning?: string
  overallVerdict?: string
  funniesLine?: string
  biggestMissedOpportunity?: string
  verdict?: RoastVerdict
  hasFile?: boolean  // true if PDF/image was uploaded
}

const SEV = {
  fatal:   { ink: '#dc2626', bg: 'rgba(220,38,38,0.15)',   border: '#dc2626', label: 'FATAL',   size: 16 },
  error:   { ink: '#ea580c', bg: 'rgba(234,88,12,0.13)',   border: '#ea580c', label: 'ERROR',   size: 15 },
  warning: { ink: '#d97706', bg: 'rgba(217,119,6,0.12)',   border: '#d97706', label: 'WARNING', size: 14 },
  note:    { ink: '#2563eb', bg: 'rgba(37,99,235,0.10)',   border: '#2563eb', label: 'NOTE',    size: 13 },
}

const SHORTLIST_CFG = {
  'strong-yes': { color: '#16a34a', label: '✅ Strong Yes — shortlisting' },
  'yes':        { color: '#22c55e', label: '✓ Yes — would interview' },
  'maybe':      { color: '#d97706', label: '🤔 Maybe — on the fence' },
  'no':         { color: '#dc2626', label: '✗ No — pass' },
  'strong-no':  { color: '#991b1b', label: '❌ Strong No — immediate reject' },
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function AnnotationCard({ ann, index }: { ann: RoastAnnotation; index: number }) {
  const [open, setOpen] = useState(true)
  const cfg = SEV[ann.severity] || SEV.note
  const rotations = [-2, -1, 0, 1, 2]
  const rot = rotations[index % rotations.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: cfg.border, borderLeftWidth: 3 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
        style={{ background: cfg.bg }}
      >
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
          style={{ background: cfg.ink, color: '#fff', fontFamily: 'monospace' }}
        >
          {cfg.label}
        </span>
        <span className="text-[11px] font-mono text-gray-500 flex-shrink-0 mt-0.5 truncate max-w-[120px]">
          "{ann.targetText.slice(0, 25)}{ann.targetText.length > 25 ? '…' : ''}"
        </span>
        <div className="flex-1" />
        {open ? <ChevronUp className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: cfg.ink }} />
               : <ChevronDown className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: cfg.ink }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 bg-[var(--bg-raised)] space-y-2">
              <p
                className="text-xs leading-relaxed"
                style={{ fontFamily: 'var(--font-caveat)', fontSize: '15px', color: cfg.ink, transform: `rotate(${rot}deg)`, transformOrigin: 'left top', display: 'inline-block' }}
              >
                {ann.comment}
              </p>
              {(ann.fix || ann.suggestion) && (
                <div className="rounded px-2.5 py-2 text-[11px] text-[var(--text)]"
                  style={{ background: 'rgba(22,163,74,0.08)', borderLeft: '2px solid #16a34a' }}>
                  <span className="font-semibold text-[#16a34a]">Fix: </span>
                  {ann.fix || ann.suggestion}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function RoastedResume({
  resumeText, annotations, roastScore, roastScoreMeaning,
  overallVerdict, funniesLine, biggestMissedOpportunity, verdict, hasFile
}: RoastedResumeProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Build HTML with inline annotation markers
  const annotatedHTML = useMemo(() => {
    if (!resumeText || !annotations.length) return `<pre style="white-space:pre-wrap;font-family:Georgia,serif;font-size:12px;line-height:1.7;color:#111;">${escapeHtml(resumeText)}</pre>`

    const sorted = [...annotations]
      .filter(a => a.targetText?.length > 3)
      .sort((a, b) => b.targetText.length - a.targetText.length)

    let html = escapeHtml(resumeText)
    const used = new Set<string>()

    sorted.forEach((ann) => {
      const escaped = escapeHtml(ann.targetText)
      if (used.has(escaped)) return
      const idx = html.indexOf(escaped)
      if (idx === -1) return
      used.add(escaped)

      const cfg = SEV[ann.severity] || SEV.note
      const marker = `<mark
        data-id="${ann.id}"
        style="background:${cfg.bg};border-bottom:2.5px ${ann.severity === 'fatal' ? 'double' : 'solid'} ${cfg.ink};cursor:pointer;padding:0 1px;border-radius:2px;position:relative;"
        onclick="document.dispatchEvent(new CustomEvent('roast-click',{detail:'${ann.id}'}))"
        title="${ann.comment.replace(/"/g, '&quot;').slice(0, 80)}…"
      >${escaped}<sup style="font-size:8px;color:${cfg.ink};font-weight:bold;margin-left:1px;">${ann.severity === 'fatal' ? '✕' : ann.severity === 'error' ? '!' : ann.severity === 'warning' ? '?' : '·'}</sup></mark>`
      html = html.slice(0, idx) + marker + html.slice(idx + escaped.length)
    })

    return `<pre style="white-space:pre-wrap;font-family:Georgia,serif;font-size:12px;line-height:1.8;color:#111;">${html}</pre>`
  }, [resumeText, annotations])

  const fatalCount = annotations.filter(a => a.severity === 'fatal').length
  const scoreColor = !roastScore ? '#6b7280'
    : roastScore >= 8 ? '#16a34a'
    : roastScore >= 6 ? '#d97706'
    : roastScore >= 4 ? '#ea580c'
    : '#dc2626'

  return (
    <div className="flex gap-5">
      {/* ── Left: annotated resume document ── */}
      <div className="flex-1 min-w-0">
        {!hasFile && (
          <div className="mb-3 px-3 py-2 rounded text-[11px] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-raised)]">
            💡 Upload a PDF or image of your resume to get visual annotations directly on the document.
          </div>
        )}

        <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Red margin rule */}
          <div className="absolute left-[68px] top-0 bottom-0 w-px pointer-events-none" style={{ background: 'rgba(220,38,38,0.3)' }} />
          {/* Horizontal lines like a notepad */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(220,38,38,0.06) 30px)',
            backgroundSize: '100% 30px',
          }} />

          {/* REJECTED stamp for fatal issues */}
          {fatalCount > 0 && (
            <div className="absolute top-6 right-6 z-20 pointer-events-none select-none" style={{
              fontFamily: 'var(--font-caveat)',
              fontSize: 56,
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '3px #dc2626',
              transform: 'rotate(-14deg)',
              opacity: 0.7,
              letterSpacing: '0.04em',
            }}>
              REJECTED
            </div>
          )}

          <div className="flex">
            {/* Margin — annotation numbers */}
            <div className="w-[68px] flex-shrink-0 pt-5 pb-4 pr-1.5 flex flex-col gap-0">
              {annotations.map((ann, i) => {
                const cfg = SEV[ann.severity] || SEV.note
                const rots = [-3, -2, -1, 1, 2, 3]
                const rot = rots[i % rots.length]
                return (
                  <div
                    key={ann.id}
                    onClick={() => setActiveId(activeId === ann.id ? null : ann.id)}
                    className="cursor-pointer mb-2 ml-1 text-right select-none"
                    title={ann.comment}
                    style={{
                      fontFamily: 'var(--font-caveat)',
                      fontSize: cfg.size - 2,
                      color: cfg.ink,
                      transform: `rotate(${rot}deg)`,
                      transformOrigin: 'right center',
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {shortAnnotation(ann.comment)}
                  </div>
                )
              })}
            </div>

            {/* Resume body */}
            <div className="flex-1 px-5 py-5 min-w-0"
              dangerouslySetInnerHTML={{ __html: annotatedHTML }}
            />
          </div>

          {/* Footer */}
          {overallVerdict && (
            <div className="border-t px-5 py-2.5" style={{ borderColor: 'rgba(220,38,38,0.2)', fontFamily: 'var(--font-caveat)', fontSize: 16, color: '#dc2626', fontWeight: 700 }}>
              📝 {overallVerdict}
            </div>
          )}
          {funniesLine && (
            <div className="px-5 pb-3" style={{ fontFamily: 'var(--font-caveat)', fontSize: 14, color: '#ea580c' }}>
              😬 {funniesLine}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-2.5 px-1 flex-wrap">
          {(['fatal','error','warning','note'] as const).map(s => {
            const n = annotations.filter(a => a.severity === s).length
            if (!n) return null
            const cfg = SEV[s]
            return (
              <div key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: cfg.ink }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.ink, opacity: 0.8 }} />
                <span className="capitalize font-medium">{s}</span>
                <span style={{ opacity: 0.6 }}>({n})</span>
              </div>
            )
          })}
          <div className="text-[11px] text-[var(--text-faint)]">Hover highlighted text to preview · click margin notes to pin</div>
        </div>
      </div>

      {/* ── Right: score + verdict + annotation cards ── */}
      <div className="w-[340px] flex-shrink-0 space-y-4">

        {/* Roast Score */}
        {roastScore != null && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] p-4">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-black" style={{ color: scoreColor, fontFamily: 'var(--font-caveat)' }}>
                {roastScore.toFixed(1)}
              </span>
              <span className="text-lg text-[var(--text-faint)] mb-1 font-light">/10</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${roastScore * 10}%`, background: scoreColor }} />
            </div>
            {roastScoreMeaning && (
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{roastScoreMeaning}</p>
            )}
          </div>
        )}

        {/* Recruiter Verdict */}
        {verdict && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text)]">Recruiter Verdict</span>
              {verdict.shortlist && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ color: SHORTLIST_CFG[verdict.shortlist]?.color || '#6b7280', background: `${SHORTLIST_CFG[verdict.shortlist]?.color}18` }}>
                  {SHORTLIST_CFG[verdict.shortlist]?.label}
                </span>
              )}
            </div>

            {verdict.shortlistExplanation && (
              <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">"{verdict.shortlistExplanation}"</p>
            )}

            {verdict.impressed?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-3 h-3 text-[#16a34a]" />
                  <span className="text-[10px] font-semibold text-[#16a34a] uppercase tracking-wide">What impressed me</span>
                </div>
                <ul className="space-y-1">
                  {verdict.impressed.map((s, i) => (
                    <li key={i} className="text-[11px] text-[var(--text-muted)] flex gap-1.5">
                      <span className="text-[#16a34a] flex-shrink-0">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verdict.annoyed?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <XCircle className="w-3 h-3 text-[#dc2626]" />
                  <span className="text-[10px] font-semibold text-[#dc2626] uppercase tracking-wide">What annoyed me</span>
                </div>
                <ul className="space-y-1">
                  {verdict.annoyed.map((s, i) => (
                    <li key={i} className="text-[11px] text-[var(--text-muted)] flex gap-1.5">
                      <span className="text-[#dc2626] flex-shrink-0">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verdict.interviewQuestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="w-3 h-3 text-[#d97706]" />
                  <span className="text-[10px] font-semibold text-[#d97706] uppercase tracking-wide">I'd ask you in the interview</span>
                </div>
                <ul className="space-y-1.5">
                  {verdict.interviewQuestions.slice(0, 3).map((q, i) => (
                    <li key={i} className="text-[11px] text-[var(--text-muted)] flex gap-1.5 italic">
                      <span className="text-[#d97706] flex-shrink-0 not-italic">Q{i+1}.</span>{q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Biggest missed opportunity */}
        {biggestMissedOpportunity && (
          <div className="rounded-lg border border-[rgba(94,106,210,0.3)] bg-[rgba(94,106,210,0.06)] px-3 py-2.5">
            <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wide mb-1">Biggest missed opportunity</p>
            <p className="text-[11px] text-[var(--text)] leading-relaxed">{biggestMissedOpportunity}</p>
          </div>
        )}

        {/* Annotation cards */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide mb-2">
            All annotations ({annotations.length})
          </p>
          <div className="space-y-2">
            {annotations.map((ann, i) => (
              <AnnotationCard key={ann.id} ann={ann} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function shortAnnotation(comment: string): string {
  // Pull the most punchy 2-4 words
  const words = comment.replace(/['"]/g, '').split(' ')
  if (words.length <= 3) return comment
  // Find a key phrase
  const key = words.slice(0, 3).join(' ')
  return key + '…'
}
