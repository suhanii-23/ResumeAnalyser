'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PureRoast, RoastExperienceEntry2, RoastProjectEntry2, RoastAward } from '@/lib/resume-schema'

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible section
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  emoji, title, children, defaultOpen = true,
}: {
  emoji: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
      >
        <span className="text-xl leading-none shrink-0">{emoji}</span>
        <span className="flex-1 text-sm font-semibold text-[var(--text)]">{title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
          : <ChevronRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 py-4 bg-[var(--bg)] space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Roast line — just the joke, no advice
// ─────────────────────────────────────────────────────────────────────────────

function RoastLine({ text, indent = false }: { text: string; indent?: boolean }) {
  return (
    <p className={`text-sm text-[var(--text)] leading-relaxed ${indent ? 'pl-4 border-l-2 border-[var(--border-md)]' : ''}`}>
      {text}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Experience card
// ─────────────────────────────────────────────────────────────────────────────

function ExperienceCard({ entry }: { entry: RoastExperienceEntry2 }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
      >
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--text)]">{entry.role}</p>
          <p className="text-[11px] text-[var(--text-faint)]">{entry.company}</p>
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
        }
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3 bg-[var(--bg)]">
          {entry.jokes.map((joke, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-red-500 shrink-0 text-sm mt-0.5">🔥</span>
              <p className="text-sm text-[var(--text)] leading-relaxed">{joke}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project card
// ─────────────────────────────────────────────────────────────────────────────

const FLAG_STYLE: Record<string, string> = {
  'CRUD App':           'bg-red-500/15 text-red-400 border-red-500/30',
  'AI Buzzword':        'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Clone':              'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Tutorial Project':   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Real-time Dashboard':'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Task Manager':       'bg-red-500/15 text-red-400 border-red-500/30',
  'Full Stack':         'bg-[var(--bg-overlay)] text-[var(--text-faint)] border-[var(--border)]',
}

function ProjectCard({ entry }: { entry: RoastProjectEntry2 }) {
  const flagStyle = entry.projectFlag
    ? (FLAG_STYLE[entry.projectFlag] ?? 'bg-[var(--bg-overlay)] text-[var(--text-faint)] border-[var(--border)]')
    : null

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-[var(--bg-raised)] flex items-center gap-2 border-b border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--text)] flex-1">{entry.projectName}</p>
        {entry.projectFlag && flagStyle && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${flagStyle}`}>
            {entry.projectFlag}
          </span>
        )}
      </div>
      <div className="px-4 py-3 bg-[var(--bg)] flex gap-2.5">
        <span className="text-red-500 shrink-0 text-sm mt-0.5">🔥</span>
        <p className="text-sm text-[var(--text)] leading-relaxed">{entry.roast}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Award card
// ─────────────────────────────────────────────────────────────────────────────

function AwardCard({ award }: { award: RoastAward }) {
  return (
    <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-3.5">
      <p className="text-sm font-bold text-yellow-400 mb-1">
        {award.emoji} {award.name}
      </p>
      <p className="text-xs text-[var(--text-muted)] leading-snug">{award.reason}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface RoastReportProps {
  data: PureRoast
}

export function RoastReport({ data }: RoastReportProps) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Opening Shot */}
      <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-6 py-5">
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">Opening Shot</p>
        <p className="text-base font-medium text-[var(--text)] leading-relaxed">
          &ldquo;{data.openingShot}&rdquo;
        </p>
      </div>

      {/* Summary */}
      {data.summaryRoast?.length > 0 && (
        <Section emoji="📋" title="Summary Roast">
          <div className="space-y-3">
            {data.summaryRoast.map((line, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[var(--text-faint)] shrink-0 mt-1 text-xs">›</span>
                <p className="text-sm text-[var(--text)] leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {data.experienceRoast?.length > 0 && (
        <Section emoji="💼" title="Experience Roast">
          <div className="space-y-2.5">
            {data.experienceRoast.map((entry, i) => (
              <ExperienceCard key={i} entry={entry} />
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {data.projectRoast?.length > 0 && (
        <Section emoji="🛠" title="Project Roast">
          <div className="space-y-2.5">
            {data.projectRoast.map((entry, i) => (
              <ProjectCard key={i} entry={entry} />
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {data.skillsRoast?.length > 0 && (
        <Section emoji="🧰" title="Skills Roast">
          <div className="space-y-3">
            {data.skillsRoast.map((line, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[var(--text-faint)] shrink-0 mt-1 text-xs">›</span>
                <p className="text-sm text-[var(--text)] leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education — only if there's something to say */}
      {data.educationRoast?.length > 0 && (
        <Section emoji="🎓" title="Education Roast">
          <div className="space-y-3">
            {data.educationRoast.map((line, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[var(--text-faint)] shrink-0 mt-1 text-xs">›</span>
                <RoastLine key={i} text={line} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {data.certificationRoast?.length > 0 && (
        <Section emoji="📜" title="Certification Roast">
          <div className="space-y-3">
            {data.certificationRoast.map((line, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="text-[var(--text-faint)] shrink-0 mt-1 text-xs">›</span>
                <RoastLine key={i} text={line} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recruiter Inner Thoughts */}
      {data.recruiterInnerThoughts?.length > 0 && (
        <Section emoji="🧠" title="What Recruiters Secretly Think">
          <div className="space-y-2">
            {data.recruiterInnerThoughts.map((thought, i) => (
              <div
                key={i}
                className="border border-[var(--border)] rounded-lg px-4 py-3 bg-[var(--bg-raised)]"
              >
                <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">
                  &ldquo;{thought}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Awards */}
      {data.awardCategories?.length > 0 && (
        <Section emoji="🏆" title="Award Ceremony">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.awardCategories.map((award, i) => (
              <AwardCard key={i} award={award} />
            ))}
          </div>
        </Section>
      )}

      {/* Final Verdict */}
      {data.finalVerdict && (
        <div className="rounded-xl border border-[var(--border-md)] bg-[var(--bg-raised)] px-6 py-5">
          <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest mb-3">
            Final Verdict
          </p>
          <p className="text-base font-medium text-[var(--text)] leading-relaxed">
            &ldquo;{data.finalVerdict}&rdquo;
          </p>
        </div>
      )}

    </div>
  )
}
