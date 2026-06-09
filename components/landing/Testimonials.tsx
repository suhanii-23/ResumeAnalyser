'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Alex Chen', role: 'Software Engineer → Google', avatar: 'AC', rating: 5,
    text: "ResumeIQ told me I was missing 'distributed systems' and 'Kubernetes'. Added them with context. Google interview the next week.",
  },
  {
    name: 'Priya Sharma', role: 'PM → Meta', avatar: 'PS', rating: 5,
    text: "The Recruiter View was eye-opening. The AI said exactly what a real PM recruiter would say. Fixed every concern. Landed Meta in 3 weeks.",
  },
  {
    name: 'Marcus Williams', role: 'Data Scientist → Netflix', avatar: 'MW', rating: 5,
    text: "The Roast Mode was brutally accurate. It called out every vague bullet with a specific fix. Match score went from 54% to 89%.",
  },
  {
    name: 'Sarah Johnson', role: 'UX Designer → Airbnb', avatar: 'SJ', rating: 5,
    text: "The keyword heatmap showed me 'design systems' was basically invisible in my resume. Fixed in 10 minutes. Interview call that week.",
  },
  {
    name: 'David Park', role: 'Backend Engineer → Stripe', avatar: 'DP', rating: 5,
    text: "The AI edited my resume directly when I said 'make it more impactful'. Every weak bullet transformed with quantified outcomes.",
  },
  {
    name: 'Emma Rodriguez', role: 'Finance → McKinsey', avatar: 'ER', rating: 5,
    text: "The interview prep feature generated questions specifically from my resume claims. Was asked three of them verbatim in the actual interview.",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 px-4" id="testimonials">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Real people, real offers</h2>
          <p className="text-[var(--text-muted)]">Join thousands who stopped wondering why and started getting interviews.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="p-5 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-md)] transition-colors"
            >
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text)]">{t.name}</div>
                    <div className="text-[11px] text-[var(--text-faint)]">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-[#FCD34D] text-[#FCD34D]" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
