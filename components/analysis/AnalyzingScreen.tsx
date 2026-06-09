'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'

const STEPS = [
  'Parsing resume structure…',
  'Extracting skills and experience…',
  'Analyzing job requirements…',
  'Computing match scores…',
  'Generating recommendations…',
  'Building resume schema…',
  'Finalizing report…',
]

export function AnalyzingScreen() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, 1200)
    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 0.5, 92))
    }, 60)
    return () => {
      clearInterval(interval)
      clearInterval(progInterval)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text)] mb-1">Analyzing your resume</h2>
          <p className="text-xs text-[var(--text-muted)]">This takes about 15–20 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <AnimatePresence key={i}>
              {i <= step && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 text-xs"
                >
                  {i < step ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80] flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin flex-shrink-0" />
                  )}
                  <span className={i === step ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}>
                    {s}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </div>
  )
}
