'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { AnalysisResult } from '@/lib/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

interface ScoreDashboardProps {
  result: AnalysisResult
}

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setVal(target), 100)
    return () => clearTimeout(timer)
  }, [target])
  return <span>{Math.round(val)}</span>
}

const subScoreConfig = [
  { key: 'skillsMatch' as const, label: 'Skills Match' },
  { key: 'keywordMatch' as const, label: 'Keywords' },
  { key: 'experienceMatch' as const, label: 'Experience' },
  { key: 'cultureFit' as const, label: 'Culture Fit' },
  { key: 'educationMatch' as const, label: 'Education' },
  { key: 'atsOptimization' as const, label: 'ATS Score' },
]

export function ScoreDashboard({ result }: ScoreDashboardProps) {
  const { overallScore, subScores, atsProbability, recruiterProbability, interviewProbability, summary } = result
  const scoreColor = getScoreColor(overallScore)
  const label = getScoreLabel(overallScore)

  const circumference = 2 * Math.PI * 52
  const [offset, setOffset] = useState(circumference)
  useEffect(() => {
    setTimeout(() => setOffset(circumference - (overallScore / 100) * circumference), 150)
  }, [overallScore, circumference])

  return (
    <div className="space-y-4">
      {/* Main score card */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-6">
          {/* Circular score */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-overlay)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[var(--text)]">
                <AnimatedNumber target={overallScore} />
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-semibold text-[var(--text)]">Overall Match</span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded border"
                style={{
                  color: scoreColor,
                  background: `${scoreColor}18`,
                  borderColor: `${scoreColor}40`,
                }}
              >
                {label}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">{summary}</p>

            {/* Probabilities */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ATS Pass', value: atsProbability },
                { label: 'Recruiter Review', value: recruiterProbability },
                { label: 'Interview', value: interviewProbability },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--bg-overlay)] rounded-md px-2.5 py-2 text-center border border-[var(--border)]">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg font-bold"
                    style={{ color: getScoreColor(item.value) }}
                  >
                    {item.value}%
                  </motion.div>
                  <div className="text-[11px] text-[var(--text-faint)]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Score Breakdown
        </h3>
        <div className="space-y-3">
          {subScoreConfig.map(({ key, label }, i) => {
            const score = subScores[key]
            const color = getScoreColor(score)
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="grid grid-cols-[120px_1fr_40px] items-center gap-3"
              >
                <span className="text-xs text-[var(--text-muted)] text-right">{label}</span>
                <Progress value={score} color={color} />
                <span className="text-xs font-semibold text-right" style={{ color }}>
                  {score}%
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Section grades */}
      {result.sectionGrades && (
        <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Section Grades
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(result.sectionGrades).map(([section, grade]) => {
              const gc = grade.startsWith('A') ? '#4ADE80' : grade.startsWith('B') ? '#60A5FA' : grade.startsWith('C') ? '#FCD34D' : '#F87171'
              return (
                <div key={section} className="flex flex-col items-center p-2 bg-[var(--bg-overlay)] border border-[var(--border)] rounded-md">
                  <span className="text-xl font-bold" style={{ color: gc }}>{grade}</span>
                  <span className="text-[10px] text-[var(--text-faint)] capitalize">{section}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
