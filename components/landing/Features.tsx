'use client'

import { motion } from 'framer-motion'
import { MessageSquare, BarChart3, GitCompare, Flame, UserCheck, Mic, Wand2, Hash } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Live Resume Editing',
    description: 'Tell the AI what to change. It edits your resume schema directly, preserves formatting, and shows you a diff.',
  },
  {
    icon: BarChart3,
    title: 'ATS Score Analysis',
    description: '6-dimension scoring: skills, keywords, experience, education, culture fit, and ATS optimization.',
  },
  {
    icon: GitCompare,
    title: 'Diff Viewer',
    description: 'Side-by-side before/after comparison after every edit. Green for added, red for removed.',
  },
  {
    icon: Flame,
    title: 'Resume Roast',
    description: 'Line-by-line critique. Every vague bullet and missing metric called out with specific, actionable fixes.',
  },
  {
    icon: UserCheck,
    title: 'Recruiter Simulation',
    description: 'First impression, 10-second scan, reasons to shortlist or reject, hire recommendation.',
  },
  {
    icon: Mic,
    title: 'Interview Prep',
    description: 'Technical questions, behavioral questions, resume-based questions, and a full mock interview mode.',
  },
  {
    icon: Wand2,
    title: 'Structured Editing',
    description: 'All edits modify a normalized resume schema first, then regenerate — no formatting corruption.',
  },
  {
    icon: Hash,
    title: 'Keyword Heatmap',
    description: 'Visual heatmap of which keywords are strong, weak, or missing. Exactly what ATS systems look for.',
  },
]

export function Features() {
  return (
    <section className="py-20 px-4" id="features">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">
            Everything you need to get the interview
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl">
            Not just a keyword checker. A complete system for turning your resume into one that gets responses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg border bg-[var(--bg-raised)] border-[var(--border)] hover:border-[var(--border-md)] transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{f.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
