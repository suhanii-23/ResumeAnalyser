'use client'

import { motion } from 'framer-motion'
import { Hash } from 'lucide-react'
import { AnalysisResult } from '@/lib/store'

export function KeywordHeatmap({ result }: { result: AnalysisResult }) {
  const groups = [
    { status: 'strong' as const, label: 'Strongly Present', color: '#4ADE80', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.3)' },
    { status: 'weak' as const, label: 'Weakly Present', color: '#FCD34D', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)' },
    { status: 'missing' as const, label: 'Missing', color: '#F87171', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
  ]

  return (
    <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-4 h-4 text-[var(--text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--text)]">Keyword Heatmap</h3>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {groups.map((g) => (
          <div key={g.status} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
            <span className="text-[var(--text-muted)]">{g.label}</span>
            <span className="text-[var(--text-faint)]">
              ({result.keywordHeatmap.filter((k) => k.status === g.status).length})
            </span>
          </div>
        ))}
      </div>

      {/* All keywords */}
      <div className="flex flex-wrap gap-1.5">
        {result.keywordHeatmap.map((item, i) => {
          const group = groups.find((g) => g.status === item.status)!
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015 }}
              className="text-xs px-2.5 py-1 rounded border font-medium cursor-default"
              style={{ color: group.color, background: group.bg, borderColor: group.border }}
            >
              {item.keyword}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}
