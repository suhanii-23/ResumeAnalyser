'use client'

import { useMemo } from 'react'
import { diffWords } from 'diff'
import { GitCompare } from 'lucide-react'

interface ResumeDiffViewerProps {
  before: string
  after: string
  changeDescription?: string
}

export function ResumeDiffViewer({ before, after, changeDescription }: ResumeDiffViewerProps) {
  const diffs = useMemo(() => diffWords(before, after), [before, after])

  const addedCount = diffs.filter((d) => d.added).reduce((acc, d) => acc + d.value.split(/\s+/).length, 0)
  const removedCount = diffs.filter((d) => d.removed).reduce((acc, d) => acc + d.value.split(/\s+/).length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text)]">Resume Changes</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#4ADE80]">+{addedCount} words added</span>
          <span className="text-[#F87171]">−{removedCount} words removed</span>
        </div>
      </div>

      {changeDescription && (
        <div className="px-3 py-2 rounded-md bg-[var(--accent-subtle)] border border-[rgba(94,106,210,0.25)]">
          <p className="text-xs text-[var(--accent)]">{changeDescription}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#F87171]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">Before</span>
          </div>
          <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3 font-mono text-xs text-[var(--text-muted)] max-h-[400px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {diffs.map((part, i) => {
              if (part.added) return null
              return (
                <span
                  key={i}
                  className={part.removed ? 'bg-[rgba(220,38,38,0.15)] text-[#F87171] line-through' : ''}
                >
                  {part.value}
                </span>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">After</span>
          </div>
          <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3 font-mono text-xs text-[var(--text-muted)] max-h-[400px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {diffs.map((part, i) => {
              if (part.removed) return null
              return (
                <span
                  key={i}
                  className={part.added ? 'bg-[rgba(22,163,74,0.15)] text-[#4ADE80]' : ''}
                >
                  {part.value}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-[var(--text-muted)] mb-2 font-medium">Unified Diff</div>
        <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3 font-mono text-xs max-h-[300px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
          {diffs.map((part, i) => (
            <span
              key={i}
              className={
                part.added
                  ? 'bg-[rgba(22,163,74,0.15)] text-[#4ADE80]'
                  : part.removed
                  ? 'bg-[rgba(220,38,38,0.15)] text-[#F87171] line-through'
                  : 'text-[var(--text-muted)]'
              }
            >
              {part.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
