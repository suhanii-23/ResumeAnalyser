'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroProps {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-7"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{
            background: 'var(--accent-subtle)',
            borderColor: 'var(--accent-border)',
            color: 'var(--accent)',
          }}
        >
          <Zap className="w-3 h-3" />
          AI-Powered Resume Intelligence
        </div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-center text-5xl md:text-6xl font-bold text-[var(--text)] mb-5 max-w-3xl leading-[1.1] tracking-tight"
      >
        Stop sending resumes{' '}
        <span style={{ color: 'var(--accent)' }}>into the void.</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center text-lg text-[var(--text-muted)] mb-9 max-w-xl leading-relaxed"
      >
        See exactly why recruiters reject your resume and fix it with AI.
        Scores, gap analysis, live editing, and interview prep — in one place.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex items-center gap-3 mb-14"
      >
        <Button size="xl" onClick={onStart} className="group">
          Analyze My Resume
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
        <Button size="xl" variant="outline" onClick={onStart}>
          See Demo
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-10 mb-14"
      >
        {[
          { value: '94%', label: 'ATS Pass Rate' },
          { value: '3×', label: 'More Interviews' },
          { value: '50K+', label: 'Resumes Analyzed' },
          { value: '< 30s', label: 'Analysis Time' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
            <div className="text-xs text-[var(--text-faint)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Product preview */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="w-full max-w-4xl"
      >
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-raised)', borderColor: 'var(--border)' }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-overlay)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 h-5 rounded bg-[var(--bg)] flex items-center px-3">
              <span className="text-[11px] text-[var(--text-faint)]">resumeiq.ai/analyze</span>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: 'var(--border)' }}>
            {/* Score */}
            <div className="p-5">
              <div className="text-[11px] text-[var(--text-faint)] uppercase tracking-wider mb-3">Match Score</div>
              <div className="text-4xl font-bold text-[var(--text)] mb-1">87%</div>
              <div className="text-xs text-[var(--text-muted)] mb-3">Good — needs improvement</div>
              <div className="space-y-1.5">
                {['Skills', 'Keywords', 'Experience'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-faint)] w-16">{label}</span>
                    <div className="flex-1 h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${[82, 71, 94][i]}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)]">{[82, 71, 94][i]}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="p-5">
              <div className="text-[11px] text-[var(--text-faint)] uppercase tracking-wider mb-3">Missing Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {['Docker', 'Kubernetes', 'AWS Lambda', 'CI/CD', 'System Design', 'gRPC'].map((k) => (
                  <span
                    key={k}
                    className="text-[11px] px-2 py-0.5 rounded border"
                    style={{
                      color: '#F87171',
                      background: 'rgba(220,38,38,0.08)',
                      borderColor: 'rgba(220,38,38,0.25)',
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="p-5">
              <div className="text-[11px] text-[var(--text-faint)] uppercase tracking-wider mb-3">AI Editor</div>
              <div className="space-y-2 text-xs">
                <div className="bg-[var(--bg-overlay)] border border-[var(--border)] rounded px-2.5 py-2 text-[var(--text-muted)]">
                  Make my experience more leadership-focused
                </div>
                <div
                  className="rounded px-2.5 py-2 text-[11px]"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: '#94A3B8' }}
                >
                  ✓ Updated 4 bullets across 2 roles with leadership framing…
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
