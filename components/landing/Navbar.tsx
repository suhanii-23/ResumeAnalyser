'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar({ onStart }: { onStart: () => void }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div
        className="max-w-5xl mx-auto rounded-lg border px-5 py-2.5 flex items-center justify-between"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--text)]">ResumeIQ</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-[var(--text-muted)]">
          <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
        </div>

        <Button size="sm" onClick={onStart}>
          Get Started
        </Button>
      </div>
    </motion.nav>
  )
}
