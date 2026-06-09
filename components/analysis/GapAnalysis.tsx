'use client'

import { motion } from 'framer-motion'
import { XCircle, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AnalysisResult } from '@/lib/store'

export function GapAnalysis({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-5">
      {/* Missing Skills */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-4 h-4 text-[#F87171]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Missing Skills</h3>
          <Badge variant="destructive">{result.missingSkills.length}</Badge>
        </div>
        <div className="space-y-2">
          {result.missingSkills.map((skill, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{skill.skill}</span>
                  <Badge
                    variant={skill.importance === 'High' ? 'destructive' : skill.importance === 'Medium' ? 'warning' : 'secondary'}
                  >
                    {skill.importance}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{skill.context}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Missing Keywords */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#FCD34D]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Missing Keywords</h3>
          <Badge variant="warning">{result.missingKeywords.length}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.missingKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded border"
              style={{ color: '#F87171', background: 'rgba(220,38,38,0.07)', borderColor: 'rgba(220,38,38,0.25)' }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Missing Responsibilities */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#FCD34D]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Missing Responsibilities</h3>
        </div>
        <div className="space-y-3">
          {result.missingResponsibilities.map((item, i) => (
            <div key={i} className="rounded-md border border-[var(--border)] overflow-hidden">
              <div className="px-3 py-2 bg-[var(--bg-overlay)] border-b border-[var(--border)]">
                <p className="text-xs text-[#F87171]">JD requires: &ldquo;{item.jdRequirement}&rdquo;</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-[var(--text-muted)]">{item.gap}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Values */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Company Values Alignment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.companyValues.map((val, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-md border"
              style={val.demonstrated
                ? { background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.2)' }
                : { background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.2)' }
              }
            >
              {val.demonstrated
                ? <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                : <XCircle className="w-3.5 h-3.5 text-[#F87171] flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className="text-xs font-medium" style={{ color: val.demonstrated ? '#4ADE80' : '#F87171' }}>{val.value}</p>
                <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                  {val.evidence || 'Not demonstrated in resume'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Gaps */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Experience Gaps</h3>
        </div>
        <ul className="space-y-1.5">
          {result.experienceGaps.map((gap, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
              <span className="w-1 h-1 rounded-full bg-[var(--text-faint)] mt-1.5 flex-shrink-0" />
              {gap}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
