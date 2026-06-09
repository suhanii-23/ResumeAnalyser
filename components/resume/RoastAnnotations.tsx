'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { RoastAnnotation } from '@/lib/resume-schema'
import { ResumeSchema } from '@/lib/resume-schema'
import { schemaToText } from '@/lib/resume-schema'

interface RoastAnnotationsProps {
  annotations: RoastAnnotation[]
  schema: ResumeSchema
  overallVerdict?: string
  funniesLine?: string
  biggestMissedOpportunity?: string
}

const severityConfig = {
  fatal: {
    color: '#F87171',
    bg: 'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.3)',
    label: 'Critical',
    icon: '🚨',
  },
  error: {
    color: '#FCA5A5',
    bg: 'rgba(220,38,38,0.07)',
    border: 'rgba(220,38,38,0.2)',
    label: 'Issue',
    icon: '❌',
  },
  warning: {
    color: '#FCD34D',
    bg: 'rgba(217,119,6,0.07)',
    border: 'rgba(217,119,6,0.25)',
    label: 'Warning',
    icon: '⚠️',
  },
  note: {
    color: '#93C5FD',
    bg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.2)',
    label: 'Note',
    icon: '📝',
  },
}

function AnnotationCard({
  annotation,
  index,
}: {
  annotation: RoastAnnotation
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = severityConfig[annotation.severity]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      <button
        className="w-full flex items-start gap-3 p-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: cfg.color }}
            >
              {cfg.label} · {annotation.section}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] truncate">
            &ldquo;{annotation.targetText}&rdquo;
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0 mt-0.5" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: cfg.border }}>
              <div className="pt-2">
                <p className="text-xs font-mono text-[var(--text-muted)] mb-2 italic">
                  &ldquo;{annotation.targetText}&rdquo;
                </p>
                <p className="text-sm text-[var(--text)] leading-relaxed">
                  {annotation.comment}
                </p>
              </div>
              {annotation.suggestion && (
                <div
                  className="p-2 rounded text-xs"
                  style={{
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.2)',
                  }}
                >
                  <span className="font-semibold text-[#4ADE80]">Fix: </span>
                  <span className="text-[var(--text-muted)]">{annotation.suggestion}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function RoastAnnotations({
  annotations,
  schema,
  overallVerdict,
  funniesLine,
  biggestMissedOpportunity,
}: RoastAnnotationsProps) {
  const [filter, setFilter] = useState<RoastAnnotation['severity'] | 'all'>('all')

  const filtered = filter === 'all' ? annotations : annotations.filter((a) => a.severity === filter)

  const counts = {
    fatal: annotations.filter((a) => a.severity === 'fatal').length,
    error: annotations.filter((a) => a.severity === 'error').length,
    warning: annotations.filter((a) => a.severity === 'warning').length,
    note: annotations.filter((a) => a.severity === 'note').length,
  }

  return (
    <div className="space-y-4">
      {/* Verdict banner */}
      {overallVerdict && (
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'rgba(220,38,38,0.06)',
            borderColor: 'rgba(220,38,38,0.25)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#F87171]" />
            <span className="text-sm font-semibold text-[#F87171]">Recruiter&apos;s Verdict</span>
          </div>
          <p className="text-sm text-[var(--text)]">{overallVerdict}</p>
        </div>
      )}

      {/* Highlights */}
      {(funniesLine || biggestMissedOpportunity) && (
        <div className="grid grid-cols-1 gap-3">
          {funniesLine && (
            <div
              className="rounded-lg p-3 border"
              style={{ background: 'rgba(217,119,6,0.07)', borderColor: 'rgba(217,119,6,0.25)' }}
            >
              <div className="text-[10px] font-semibold text-[#FCD34D] uppercase tracking-wider mb-1">
                Most Entertainingly Bad
              </div>
              <p className="text-xs text-[var(--text)]">{funniesLine}</p>
            </div>
          )}
          {biggestMissedOpportunity && (
            <div
              className="rounded-lg p-3 border"
              style={{ background: 'rgba(94,106,210,0.08)', borderColor: 'rgba(94,106,210,0.3)' }}
            >
              <div className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                Biggest Missed Opportunity
              </div>
              <p className="text-xs text-[var(--text)]">{biggestMissedOpportunity}</p>
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-faint)]">Filter:</span>
        {(['all', 'fatal', 'error', 'warning', 'note'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              filter === f
                ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {f === 'all' ? `All (${annotations.length})` : `${f} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Annotations list */}
      <div className="space-y-2">
        {filtered.map((a, i) => (
          <AnnotationCard key={a.id} annotation={a} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[var(--text-faint)] text-sm">
            No annotations in this category.
          </div>
        )}
      </div>
    </div>
  )
}
