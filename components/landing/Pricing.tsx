'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For a quick check',
    features: ['1 analysis per day', 'Overall score', 'Top 5 missing keywords', 'Basic suggestions'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For active job seekers',
    features: [
      'Unlimited analyses',
      'Live resume editing',
      'Full gap analysis',
      'Resume Roast',
      'Recruiter Simulation',
      'Interview prep + mock interview',
      'Diff viewer',
      'PDF/DOCX export',
      'Version history',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'For career coaches',
    features: ['Everything in Pro', '10 team members', 'Bulk analysis', 'Analytics dashboard', 'Priority support'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export function Pricing({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-20 px-4" id="pricing">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Simple pricing</h2>
          <p className="text-[var(--text-muted)]">One interview offer pays for years of Pro. The math is straightforward.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-lg p-6 border ${
                plan.highlight
                  ? 'border-[var(--accent)] bg-[var(--bg-raised)]'
                  : 'border-[var(--border)] bg-[var(--bg-raised)]'
              }`}
            >
              {plan.highlight && (
                <div className="mb-3">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded border"
                    style={{
                      color: 'var(--accent)',
                      background: 'var(--accent-subtle)',
                      borderColor: 'var(--accent-border)',
                    }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs text-[var(--text-muted)] font-medium mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[var(--text)]">{plan.price}</span>
                  <span className="text-xs text-[var(--text-faint)]">{plan.period}</span>
                </div>
                <p className="text-xs text-[var(--text-faint)] mt-1">{plan.description}</p>
              </div>

              <Button
                variant={plan.highlight ? 'default' : 'outline'}
                size="sm"
                className="w-full mb-5"
                onClick={onStart}
              >
                {plan.cta}
              </Button>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
