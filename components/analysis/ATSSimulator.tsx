'use client'

import { motion } from 'framer-motion'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { AnalysisResult } from '@/lib/store'
import { getScoreColor } from '@/lib/utils'

export function ATSSimulator({ result }: { result: AnalysisResult }) {
  const checks = [
    { label: 'ATS-friendly formatting', passed: result.subScores.atsOptimization >= 60 },
    { label: 'Standard section headers', passed: result.subScores.atsOptimization >= 50 },
    { label: 'Keyword density adequate', passed: result.subScores.keywordMatch >= 60 },
    { label: 'Skills section present', passed: result.subScores.skillsMatch >= 40 },
    { label: 'Contact info included', passed: true },
    { label: 'Consistent date formatting', passed: result.subScores.atsOptimization >= 55 },
    { label: 'No tables or graphics', passed: result.subScores.atsOptimization >= 70 },
  ]

  const items = [
    { label: 'ATS Pass', value: result.atsProbability },
    { label: 'Recruiter Review', value: result.recruiterProbability },
    { label: 'Interview', value: result.interviewProbability },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const color = getScoreColor(item.value)
          const circumference = 2 * Math.PI * 28
          const offset = circumference - (item.value / 100) * circumference
          return (
            <div key={item.label} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--bg-overlay)" strokeWidth="5" />
                  <motion.circle
                    cx="32" cy="32" r="28"
                    fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color }}>{item.value}%</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">ATS Checklist</h3>
        </div>
        <div className="space-y-1.5">
          {checks.map((check, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md border"
              style={check.passed
                ? { background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.2)' }
                : { background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.2)' }
              }
            >
              {check.passed
                ? <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-[#F87171] flex-shrink-0" />
              }
              <span className="text-xs" style={{ color: check.passed ? '#4ADE80' : '#F87171' }}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
