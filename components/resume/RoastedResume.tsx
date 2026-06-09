'use client'

import { useMemo } from 'react'
import { RoastAnnotation } from '@/lib/resume-schema'

interface RoastedResumeProps {
  resumeText: string
  annotations: RoastAnnotation[]
  overallVerdict?: string
  funniesLine?: string
}

const SEVERITY_STYLES = {
  fatal: {
    highlight: 'bg-[rgba(220,38,38,0.25)] border-b-2 border-red-500',
    tag: 'bg-red-600 text-white',
    ink: '#dc2626',
    size: 'text-xl',
    rotate: [-4, -2, 2, 4],
  },
  error: {
    highlight: 'bg-[rgba(234,88,12,0.2)] border-b-2 border-orange-500',
    tag: 'bg-orange-500 text-white',
    ink: '#ea580c',
    size: 'text-lg',
    rotate: [-3, -1, 1, 3],
  },
  warning: {
    highlight: 'bg-[rgba(234,179,8,0.15)] border-b border-yellow-500',
    tag: 'bg-yellow-500 text-black',
    ink: '#ca8a04',
    size: 'text-base',
    rotate: [-2, -1, 1, 2],
  },
  note: {
    highlight: 'bg-[rgba(59,130,246,0.1)] border-b border-blue-400',
    tag: 'bg-blue-500 text-white',
    ink: '#3b82f6',
    size: 'text-sm',
    rotate: [-1, 0, 0, 1],
  },
}

const STAMP_COMMENTS: Record<string, { text: string; color: string; rotate: number }> = {
  fatal: { text: 'REJECTED', color: '#dc2626', rotate: -12 },
}

export function RoastedResume({ resumeText, annotations, overallVerdict, funniesLine }: RoastedResumeProps) {
  // Build annotated HTML: find each targetText and wrap it
  const annotatedHTML = useMemo(() => {
    if (!resumeText || annotations.length === 0) return escapeHtml(resumeText)

    // Sort annotations by position in text (longest match first to avoid overlap issues)
    const sorted = [...annotations]
      .filter(a => a.targetText && a.targetText.length > 3)
      .sort((a, b) => b.targetText.length - a.targetText.length)

    let html = escapeHtml(resumeText)

    sorted.forEach((ann, idx) => {
      const escaped = escapeHtml(ann.targetText)
      // Only replace first occurrence
      const pos = html.indexOf(escaped)
      if (pos === -1) return

      const cfg = SEVERITY_STYLES[ann.severity] || SEVERITY_STYLES.note
      const rotateOptions = cfg.rotate
      const rotate = rotateOptions[idx % rotateOptions.length]
      const annotationHtml = `<span class="roast-target" data-id="${ann.id}" style="background:rgba(${severityRgb(ann.severity)},0.18);border-bottom:2px solid ${cfg.ink};cursor:pointer;position:relative;">${escaped}<span class="roast-bubble" style="font-family:var(--font-caveat);color:${cfg.ink};transform:rotate(${rotate}deg);font-size:${sizePx(ann.severity)}px;">${escapeHtml(ann.comment)}</span></span>`
      html = html.slice(0, pos) + annotationHtml + html.slice(pos + escaped.length)
    })

    return html
  }, [resumeText, annotations])

  const fatalCount = annotations.filter(a => a.severity === 'fatal').length

  return (
    <div className="relative">
      {/* Stamp for fatal issues */}
      {fatalCount > 0 && (
        <div
          className="absolute top-8 right-4 z-20 pointer-events-none select-none"
          style={{
            fontFamily: 'var(--font-caveat)',
            fontSize: '52px',
            fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: '3px #dc2626',
            transform: 'rotate(-12deg)',
            opacity: 0.85,
            letterSpacing: '0.05em',
            textShadow: '0 0 0 #dc2626',
          }}
        >
          REJECTED
        </div>
      )}

      {/* Resume document */}
      <div
        className="bg-white rounded-lg shadow-xl relative overflow-hidden"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        <style>{`
          .roast-target {
            position: relative;
            display: inline;
          }
          .roast-bubble {
            display: none;
            position: absolute;
            left: 0;
            top: -2.2em;
            white-space: nowrap;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 3px;
            z-index: 30;
            pointer-events: none;
            line-height: 1.2;
          }
          .roast-target:hover .roast-bubble {
            display: block;
          }
          /* Margin annotation style */
          .roast-margin {
            font-family: var(--font-caveat);
            font-size: 15px;
            line-height: 1.3;
            font-weight: 700;
          }
        `}</style>

        {/* Ruled margin line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-red-200 opacity-60 pointer-events-none" />

        <div className="flex">
          {/* Margin for annotations */}
          <div className="w-[72px] flex-shrink-0 pt-6 pb-6 pr-2 relative">
            {annotations.map((ann, i) => {
              const cfg = SEVERITY_STYLES[ann.severity] || SEVERITY_STYLES.note
              const rotateOptions = cfg.rotate
              const rotate = rotateOptions[i % rotateOptions.length]
              return (
                <div
                  key={ann.id}
                  className="roast-margin mb-3 px-1"
                  style={{
                    color: cfg.ink,
                    transform: `rotate(${rotate}deg)`,
                    transformOrigin: 'left center',
                    fontSize: ann.severity === 'fatal' ? '15px' : ann.severity === 'error' ? '13px' : '12px',
                  }}
                  title={ann.comment}
                >
                  {shortLabel(ann.comment)}
                </div>
              )
            })}
          </div>

          {/* Resume text */}
          <div className="flex-1 px-6 py-6 min-w-0">
            <pre
              className="whitespace-pre-wrap text-[12px] text-gray-900 leading-relaxed font-[Georgia,serif]"
              style={{ fontFamily: 'Georgia, serif' }}
              dangerouslySetInnerHTML={{ __html: annotatedHTML }}
            />
          </div>
        </div>

        {/* Footer verdict */}
        {overallVerdict && (
          <div
            className="border-t border-red-200 px-6 py-3"
            style={{ fontFamily: 'var(--font-caveat)', fontSize: '16px', color: '#dc2626', fontWeight: 700 }}
          >
            📝 {overallVerdict}
          </div>
        )}
        {funniesLine && (
          <div
            className="px-6 pb-4"
            style={{ fontFamily: 'var(--font-caveat)', fontSize: '14px', color: '#ea580c' }}
          >
            😬 {funniesLine}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {(['fatal', 'error', 'warning', 'note'] as const).map(s => {
          const count = annotations.filter(a => a.severity === s).length
          if (count === 0) return null
          const cfg = SEVERITY_STYLES[s]
          return (
            <div key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: cfg.ink }}>
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.ink, opacity: 0.7 }} />
              <span className="capitalize font-medium">{s}</span>
              <span style={{ opacity: 0.6 }}>({count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function severityRgb(s: string): string {
  switch (s) {
    case 'fatal': return '220,38,38'
    case 'error': return '234,88,12'
    case 'warning': return '234,179,8'
    default: return '59,130,246'
  }
}

function sizePx(s: string): number {
  switch (s) {
    case 'fatal': return 18
    case 'error': return 16
    case 'warning': return 14
    default: return 13
  }
}

function shortLabel(comment: string): string {
  // Extract a punchy 1-5 word label from the full comment
  const words = comment.split(' ')
  if (words.length <= 4) return comment
  // Take first 4 words + ellipsis, but make it punchy
  return words.slice(0, 4).join(' ') + '…'
}
