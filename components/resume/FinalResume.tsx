'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, CheckCircle, PlusCircle, MinusCircle, RefreshCw,
  Copy, ExternalLink, ChevronDown, ChevronUp, Zap, Star, Code2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionChange {
  name: string
  status: 'good' | 'needs-work' | 'missing'
  summary: string
  keep: string[]
  add: string[]
  remove: string[]
  rewrite: Array<{ original: string; improved: string; reason: string }>
}

interface ChangesResult {
  sections: SectionChange[]
  priorityOrder: string[]
  topThreeWins: string[]
}

interface FinalResumeProps {
  resumeText: string
  jdText: string
  analysisResult: unknown
}

const STATUS_CONFIG = {
  good: { color: 'text-[#4ADE80]', bg: 'bg-[rgba(22,163,74,0.08)]', border: 'border-[rgba(22,163,74,0.2)]', label: 'Good' },
  'needs-work': { color: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.08)]', border: 'border-[rgba(251,191,36,0.2)]', label: 'Needs work' },
  missing: { color: 'text-[#F87171]', bg: 'bg-[rgba(220,38,38,0.08)]', border: 'border-[rgba(220,38,38,0.2)]', label: 'Missing' },
}

function SectionCard({ section, index }: { section: SectionChange; index: number }) {
  const [open, setOpen] = useState(index < 2) // first two open by default
  const cfg = STATUS_CONFIG[section.status]
  const hasChanges = section.add.length + section.remove.length + section.rewrite.length > 0

  return (
    <div className={`rounded-lg border ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${cfg.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </span>
          <span className="text-sm font-semibold text-[var(--text)]">{section.name}</span>
          {!hasChanges && section.status === 'good' && (
            <span className="text-[11px] text-[var(--text-faint)]">No changes needed</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {section.add.length > 0 && (
            <span className="text-[11px] text-[#4ADE80]">+{section.add.length} add</span>
          )}
          {section.remove.length > 0 && (
            <span className="text-[11px] text-[#F87171]">−{section.remove.length} remove</span>
          )}
          {section.rewrite.length > 0 && (
            <span className="text-[11px] text-[#FBBF24]">✏ {section.rewrite.length} rewrite</span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-faint)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)]" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3 bg-[var(--bg-raised)]">
              <p className="text-xs text-[var(--text-muted)] italic">{section.summary}</p>

              {/* Keep */}
              {section.keep.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span className="text-[11px] font-semibold text-[#4ADE80] uppercase tracking-wide">Keep</span>
                  </div>
                  <ul className="space-y-1">
                    {section.keep.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                        <span className="text-[var(--text-faint)] flex-shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add */}
              {section.add.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span className="text-[11px] font-semibold text-[#4ADE80] uppercase tracking-wide">Add</span>
                  </div>
                  <ul className="space-y-1.5">
                    {section.add.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text)] flex gap-2 bg-[rgba(22,163,74,0.06)] border border-[rgba(22,163,74,0.15)] rounded px-2.5 py-1.5">
                        <PlusCircle className="w-3 h-3 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Remove */}
              {section.remove.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MinusCircle className="w-3.5 h-3.5 text-[#F87171]" />
                    <span className="text-[11px] font-semibold text-[#F87171] uppercase tracking-wide">Remove</span>
                  </div>
                  <ul className="space-y-1.5">
                    {section.remove.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2 bg-[rgba(220,38,38,0.06)] border border-[rgba(220,38,38,0.15)] rounded px-2.5 py-1.5 line-through">
                        <MinusCircle className="w-3 h-3 text-[#F87171] flex-shrink-0 mt-0.5 no-underline" style={{ textDecoration: 'none' }} />
                        <span style={{ textDecoration: 'line-through' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rewrite */}
              {section.rewrite.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span className="text-[11px] font-semibold text-[#FBBF24] uppercase tracking-wide">Rewrite</span>
                  </div>
                  <div className="space-y-2.5">
                    {section.rewrite.map((rw, i) => (
                      <div key={i} className="rounded border border-[var(--border)] overflow-hidden text-xs">
                        <div className="px-2.5 py-1.5 bg-[rgba(220,38,38,0.06)] border-b border-[var(--border)]">
                          <span className="text-[10px] text-[#F87171] font-medium uppercase mr-2">Before</span>
                          <span className="text-[var(--text-muted)]">{rw.original}</span>
                        </div>
                        <div className="px-2.5 py-1.5 bg-[rgba(22,163,74,0.06)]">
                          <span className="text-[10px] text-[#4ADE80] font-medium uppercase mr-2">After</span>
                          <span className="text-[var(--text)]">{rw.improved}</span>
                        </div>
                        <div className="px-2.5 py-1 bg-[var(--bg-overlay)] border-t border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-faint)] italic">{rw.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LaTeXView({ resumeText, jdText, analysisResult }: FinalResumeProps) {
  const [latex, setLatex] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText, analysisResult, mode: 'latex' }),
      })
      const data = await res.json()
      setLatex(data.latex || '')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(latex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openOverleaf = () => {
    // Overleaf "create from snippet" URL
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.overleaf.com/docs'
    form.target = '_blank'
    const input = document.createElement('input')
    input.name = 'snip'
    input.value = latex
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  if (!latex) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Code2 className="w-8 h-8 text-[var(--text-faint)] mb-3" />
        <p className="text-sm font-medium text-[var(--text)] mb-1">LaTeX Resume</p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs mb-6 leading-relaxed">
          Generate a compilable LaTeX version of your resume. Open directly in Overleaf with one click.
        </p>
        <Button onClick={generate} disabled={loading} variant="outline">
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Generating LaTeX…</>
            : <><Code2 className="w-3.5 h-3.5 mr-2" />Generate LaTeX</>
          }
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Compilable LaTeX · paste into Overleaf or any LaTeX editor</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" onClick={openOverleaf}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Open in Overleaf
          </Button>
          <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg overflow-auto max-h-[60vh]">
        <pre className="p-4 text-[11px] font-mono text-[var(--text-muted)] leading-relaxed whitespace-pre">
          {latex}
        </pre>
      </div>
    </div>
  )
}

export function FinalResume({ resumeText, jdText, analysisResult }: FinalResumeProps) {
  const [tab, setTab] = useState<'changes' | 'latex'>('changes')
  const [data, setData] = useState<ChangesResult | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText, analysisResult, mode: 'changes' }),
      })
      const result = await res.json()
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[var(--text)]">Final Resume</h1>
          <p className="text-[11px] text-[var(--text-muted)]">Section-by-section action plan + LaTeX export</p>
        </div>
        <div className="flex gap-1 bg-[var(--bg-raised)] border border-[var(--border)] rounded-md p-0.5">
          {(['changes', 'latex'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-[var(--bg-overlay)] text-[var(--text)] border border-[var(--border-md)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t === 'changes' ? '📋 Changes' : '⌨️ LaTeX'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'latex' ? (
          <LaTeXView resumeText={resumeText} jdText={jdText} analysisResult={analysisResult} />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">Section-by-Section Action Plan</p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mb-6 leading-relaxed">
              Get a precise breakdown of exactly what to add, remove, and rewrite in each section — with improved bullet points written for you.
            </p>
            <Button onClick={generate} disabled={loading} variant="outline">
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Analyzing sections…</>
                : <>📋 Generate Action Plan</>
              }
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {/* Top 3 wins */}
            {data.topThreeWins?.length > 0 && (
              <div className="rounded-lg border border-[rgba(94,106,210,0.3)] bg-[rgba(94,106,210,0.06)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">Top 3 Highest-Impact Changes</span>
                </div>
                <ol className="space-y-1.5">
                  {data.topThreeWins.map((win, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-[var(--text)]">
                      <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {win}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Priority order */}
            {data.priorityOrder?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[var(--text-faint)]">Fix in order:</span>
                {data.priorityOrder.map((name, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-muted)]">
                      {i + 1}. {name}
                    </span>
                    {i < data.priorityOrder.length - 1 && (
                      <span className="text-[var(--text-faint)] text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Section cards in priority order */}
            {(data.priorityOrder?.length > 0
              ? data.priorityOrder
                  .map(name => data.sections.find(s => s.name === name))
                  .filter(Boolean) as SectionChange[]
              : data.sections
            ).map((section, i) => (
              <SectionCard key={section.name} section={section} index={i} />
            ))}

            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
