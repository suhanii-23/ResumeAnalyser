'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ChevronDown, ChevronUp, Copy, Check, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnalysisResult } from '@/lib/store'

export function Suggestions({ result }: { result: AnalysisResult }) {
  const [expanded, setExpanded] = useState<number | null>(0)
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-4 h-4 text-[var(--text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--text)]">Improvement Suggestions</h3>
        <Badge variant="secondary">{result.suggestions.length}</Badge>
      </div>

      {result.suggestions.map((s, i) => {
        const isOpen = expanded === i
        return (
          <div key={i} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-md)] transition-colors">
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center gap-3 p-3.5 text-left"
            >
              <span className="w-5 h-5 rounded bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center text-[11px] font-bold text-[var(--text-faint)] flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[var(--text)] capitalize">{s.section}</span>
                  <Badge variant={s.type === 'bullet' ? 'default' : s.type === 'keyword' ? 'success' : 'secondary'}>
                    {s.type}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--text-faint)] truncate">{s.reason}</p>
              </div>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-[var(--border)]"
                >
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[#F87171] mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#F87171]" /> Before
                      </div>
                      <div className="p-2.5 rounded-md text-xs text-[var(--text-muted)]" style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                        {s.before}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-[#4ADE80] mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> After
                      </div>
                      <div className="p-2.5 rounded-md text-xs text-[var(--text)]" style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)' }}>
                        {s.after}
                      </div>
                    </div>

                    <Button size="sm" variant="outline" onClick={() => handleCopy(s.after, i)} className="w-full">
                      {copied === i
                        ? <><Check className="w-3 h-3 mr-1.5 text-[#4ADE80]" /> Copied!</>
                        : <><Copy className="w-3 h-3 mr-1.5" /> Copy Improved Text</>
                      }
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
