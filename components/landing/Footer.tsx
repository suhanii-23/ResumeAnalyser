'use client'

import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--text)]">ResumeIQ</span>
        </div>

        <div className="flex items-center gap-5 text-xs text-[var(--text-faint)]">
          <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[var(--text)] transition-colors">Terms</a>
          <a href="#" className="hover:text-[var(--text)] transition-colors">Blog</a>
        </div>

        <p className="text-xs text-[var(--text-faint)]">
          © 2024 ResumeIQ. Built to get you hired.
        </p>
      </div>
    </footer>
  )
}
