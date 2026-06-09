'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Clock, Eye, ThumbsUp, ThumbsDown, AlertCircle, HelpCircle, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecruiterEvaluation } from '@/lib/resume-schema'
import { useResumeStore } from '@/lib/store'

interface RecruiterViewProps {
  evaluation: RecruiterEvaluation | null
  onEvaluate: () => void
  isLoading?: boolean
}

const recommendationConfig = {
  'strong-yes': { label: 'Strong Yes — Would Shortlist', color: '#4ADE80', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.3)', icon: '✅' },
  'yes': { label: 'Yes — Likely to Shortlist', color: '#86EFAC', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.2)', icon: '👍' },
  'maybe': { label: 'Maybe — On the Fence', color: '#FCD34D', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', icon: '🤔' },
  'no': { label: 'No — Would Not Shortlist', color: '#FCA5A5', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.2)', icon: '👎' },
  'strong-no': { label: 'Strong No — Pass', color: '#F87171', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', icon: '❌' },
}

function Section({ icon: Icon, title, children, color = 'var(--text-muted)' }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  color?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

export function RecruiterView({ evaluation, onEvaluate, isLoading }: RecruiterViewProps) {
  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center mb-4">
          <UserCheck className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Recruiter View</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
          See your resume through the eyes of a real hiring manager. Recruiters spend 6–15 seconds on
          initial scan. Find out if yours makes the cut.
        </p>

        <div className="w-full max-w-sm bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-4 mb-6 text-left space-y-2">
          {[
            'First impression analysis',
            'Reasons to shortlist or reject',
            'Hiring risks identified',
            'Interview questions they\'d ask',
            'Hire/No-hire recommendation',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
              {item}
            </div>
          ))}
        </div>

        <Button onClick={onEvaluate} disabled={isLoading}>
          {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          Run Recruiter Evaluation
        </Button>
      </div>
    )
  }

  const rec = recommendationConfig[evaluation.recommendation]

  return (
    <div className="space-y-5">
      {/* Recruiter banner */}
      <div
        className="rounded-lg px-4 py-3 border flex items-center gap-3"
        style={{ background: 'rgba(94,106,210,0.08)', borderColor: 'rgba(94,106,210,0.25)' }}
      >
        <UserCheck className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text)]">Recruiter Mode Active — </span>
          You are seeing your resume through the eyes of a hiring manager. Recruiters spend 6–15 seconds
          on initial scan before deciding whether to keep reading.
        </p>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg p-4 border"
        style={{ background: rec.bg, borderColor: rec.border }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{rec.icon}</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: rec.color }}>
              {rec.label}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{evaluation.recommendationReason}</p>
          </div>
        </div>
      </motion.div>

      {/* First impression */}
      <Section icon={Eye} title="First Impression (0–3 seconds)">
        <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3">
          <p className="text-sm text-[var(--text)]">{evaluation.firstImpression}</p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="text-[11px] px-2 py-0.5 rounded border font-medium"
              style={
                evaluation.keepReading
                  ? { color: '#4ADE80', background: 'rgba(22,163,74,0.1)', borderColor: 'rgba(22,163,74,0.3)' }
                  : { color: '#F87171', background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.3)' }
              }
            >
              {evaluation.keepReading ? '✓ Would keep reading' : '✗ Would stop reading'}
            </div>
            <span className="text-xs text-[var(--text-muted)]">{evaluation.keepReadingReason}</span>
          </div>
        </div>
      </Section>

      {/* 10-second scan */}
      <Section icon={Clock} title="10-Second Scan — What stood out">
        <div className="space-y-1.5">
          {evaluation.tenSecondScan.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-raised)] border border-[var(--border)] rounded px-3 py-2"
            >
              <span className="text-[var(--accent)] font-mono text-xs mt-0.5">{i + 1}.</span>
              {item}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Reasons grid */}
      <div className="grid grid-cols-2 gap-4">
        <Section icon={ThumbsUp} title="Reasons to Shortlist" color="#4ADE80">
          <div className="space-y-1.5">
            {evaluation.reasonsToShortlist.map((r, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-muted)] p-2 rounded border"
                style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.2)' }}
              >
                <span className="text-[#4ADE80] mr-1.5">+</span>{r}
              </div>
            ))}
          </div>
        </Section>

        <Section icon={ThumbsDown} title="Reasons to Reject" color="#F87171">
          <div className="space-y-1.5">
            {evaluation.reasonsToReject.map((r, i) => (
              <div
                key={i}
                className="text-xs text-[var(--text-muted)] p-2 rounded border"
                style={{ background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.2)' }}
              >
                <span className="text-[#F87171] mr-1.5">−</span>{r}
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Hiring risks */}
      <Section icon={AlertCircle} title="Hiring Risks" color="#FCD34D">
        <div className="space-y-1.5">
          {evaluation.hiringRisks.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--text-muted)] p-2 rounded border"
              style={{ background: 'rgba(217,119,6,0.05)', borderColor: 'rgba(217,119,6,0.2)' }}
            >
              <AlertCircle className="w-3 h-3 text-[#FCD34D] flex-shrink-0 mt-0.5" />
              {risk}
            </div>
          ))}
        </div>
      </Section>

      {/* Interview questions */}
      <Section icon={HelpCircle} title="Questions I'd Ask in Interview">
        <div className="space-y-1.5">
          {evaluation.questionsId.map((q, i) => (
            <div
              key={i}
              className="text-xs text-[var(--text-muted)] p-2 rounded border border-[var(--border)] bg-[var(--bg-raised)]"
            >
              <span className="text-[var(--text-faint)] mr-1.5">Q{i + 1}.</span>{q}
            </div>
          ))}
        </div>
      </Section>

      <Button variant="outline" size="sm" onClick={onEvaluate} disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
        Re-evaluate with Updated Resume
      </Button>
    </div>
  )
}
