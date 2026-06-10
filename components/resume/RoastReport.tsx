'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { RoastV6, RoastBullet, RoastPhrase, RoastProjectEntry, RoastExperienceEntry } from '@/lib/resume-schema'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function interestColor(interest: RoastV6['recruiterInterest']) {
  switch (interest) {
    case 'strong-shortlist': return { bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-400' }
    case 'shortlist':        return { bg: 'bg-blue-500/15',  border: 'border-blue-500/40',  text: 'text-blue-400' }
    case 'maybe':            return { bg: 'bg-yellow-500/15',border: 'border-yellow-500/40',text: 'text-yellow-400' }
    case 'reject':           return { bg: 'bg-red-500/15',   border: 'border-red-500/40',   text: 'text-red-400' }
  }
}

function interestLabel(interest: RoastV6['recruiterInterest']) {
  switch (interest) {
    case 'strong-shortlist': return 'Strong Shortlist'
    case 'shortlist':        return 'Shortlist'
    case 'maybe':            return 'Maybe'
    case 'reject':           return 'Reject'
  }
}

function ratingColor(r: number) {
  if (r >= 8) return 'text-green-400'
  if (r >= 6) return 'text-yellow-400'
  if (r >= 4) return 'text-orange-400'
  return 'text-red-400'
}

function projectTypeBadge(t: RoastProjectEntry['projectType']) {
  const map: Record<string, { label: string; cls: string }> = {
    crud:     { label: 'CRUD App',     cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    tutorial: { label: 'Tutorial',     cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    clone:    { label: 'Clone',        cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    filler:   { label: 'Resume Filler',cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    solid:    { label: 'Solid',        cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    unknown:  { label: 'Unknown',      cls: 'bg-[var(--bg-overlay)] text-[var(--text-faint)] border-[var(--border)]' },
  }
  const m = map[t] ?? map.unknown
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible section wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  id, emoji, title, subtitle, children, defaultOpen = true,
}: {
  id: string; emoji: string; title: string; subtitle?: string
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div id={id} className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
      >
        <span className="text-xl leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
          {subtitle && <span className="text-xs text-[var(--text-faint)] ml-2">{subtitle}</span>}
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
          : <ChevronRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />}
      </button>
      {open && <div className="px-5 py-4 space-y-4 bg-[var(--bg)]">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Roast row — the 🔥 / 🤔 / ✅ triple
// ─────────────────────────────────────────────────────────────────────────────

function BulletRoast({ b }: { b: RoastBullet }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-2.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors flex items-start gap-2"
      >
        <span className="text-[var(--text-faint)] shrink-0 mt-0.5">›</span>
        <span className="text-xs text-[var(--text-muted)] italic flex-1 leading-snug">&ldquo;{b.bullet}&rdquo;</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0 mt-0.5" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="divide-y divide-[var(--border)]">
          <div className="px-4 py-3 flex gap-2.5">
            <span className="text-base shrink-0">🔥</span>
            <p className="text-xs text-[var(--text)] leading-relaxed">{b.roast}</p>
          </div>
          <div className="px-4 py-3 flex gap-2.5">
            <span className="text-base shrink-0">🤔</span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">{b.recruiterThinks}</p>
          </div>
          <div className="px-4 py-3 flex gap-2.5 bg-green-500/5">
            <span className="text-base shrink-0">✅</span>
            <p className="text-xs text-green-400 leading-relaxed">{b.betterVersion}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Phrase card for summary roast
// ─────────────────────────────────────────────────────────────────────────────

function PhraseCard({ p }: { p: RoastPhrase }) {
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Original phrase */}
      <div className="px-4 py-2.5 bg-red-500/8 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block mb-0.5">Original</span>
        <p className="text-xs text-[var(--text)] italic">&ldquo;{p.original}&rdquo;</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        <div className="px-4 py-2.5">
          <span className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider block mb-0.5">Why it&apos;s weak</span>
          <p className="text-xs text-[var(--text-muted)] leading-snug">{p.whyWeak}</p>
        </div>
        <div className="px-4 py-2.5 bg-orange-500/5">
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider block mb-0.5">Recruiter translation</span>
          <p className="text-xs text-orange-300 leading-snug italic">{p.recruiterTranslation}</p>
        </div>
        <div className="px-4 py-2.5 bg-green-500/5">
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider block mb-0.5">Suggested replacement</span>
          <p className="text-xs text-green-400 leading-snug">{p.suggestedReplacement}</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Experience entry
// ─────────────────────────────────────────────────────────────────────────────

function ExperienceCard({ e }: { e: RoastExperienceEntry }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
      >
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--text)]">{e.role}</p>
          <p className="text-[11px] text-[var(--text-faint)]">{e.company}</p>
        </div>
        <span className="text-[10px] text-[var(--text-faint)]">{e.bullets?.length ?? 0} bullets</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2.5 bg-[var(--bg)]">
          {(e.bullets ?? []).map((b, i) => <BulletRoast key={i} b={b} />)}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Project card
// ─────────────────────────────────────────────────────────────────────────────

function ProjectCard({ p }: { p: RoastProjectEntry }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-[var(--text)]">{p.projectName}</p>
            {projectTypeBadge(p.projectType)}
          </div>
        </div>
        {/* Care indicators */}
        <div className="flex gap-1.5 shrink-0 text-[10px]">
          <span title="Recruiter cares" className={p.recruiterCares ? 'text-green-400' : 'text-red-400/60'}>R</span>
          <span title="Hiring manager cares" className={p.hiringManagerCares ? 'text-green-400' : 'text-red-400/60'}>HM</span>
          <span title="Engineer cares" className={p.engineerCares ? 'text-green-400' : 'text-red-400/60'}>Eng</span>
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />}
      </button>
      {open && (
        <div className="divide-y divide-[var(--border)] bg-[var(--bg)]">
          {/* Audience verdict */}
          <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
            {([
              { who: 'Recruiter', cares: p.recruiterCares, reason: p.recruiterCaresReason },
              { who: 'Hiring Manager', cares: p.hiringManagerCares, reason: '' },
              { who: 'Engineer', cares: p.engineerCares, reason: '' },
            ] as Array<{ who: string; cares: boolean; reason: string }>).map(({ who, cares, reason }) => (
              <div key={who} className={`rounded-lg p-2.5 border ${cares ? 'border-green-500/25 bg-green-500/8' : 'border-red-500/25 bg-red-500/8'}`}>
                <p className="text-[10px] font-semibold text-[var(--text-faint)] mb-1">{who}</p>
                <p className={`text-base ${cares ? 'text-green-400' : 'text-red-400'}`}>{cares ? '✓' : '✗'}</p>
                {reason && <p className="text-[10px] text-[var(--text-faint)] mt-1 leading-snug">{reason}</p>}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 flex gap-2.5">
            <span className="text-base shrink-0">🔥</span>
            <p className="text-xs text-[var(--text)] leading-relaxed">{p.roast}</p>
          </div>
          <div className="px-4 py-3 flex gap-2.5">
            <span className="text-base shrink-0">🤔</span>
            <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">{p.concern}</p>
          </div>
          <div className="px-4 py-3 flex gap-2.5 bg-green-500/5">
            <span className="text-base shrink-0">✅</span>
            <p className="text-xs text-green-400 leading-relaxed">{p.fix}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Interviewer Mode row
// ─────────────────────────────────────────────────────────────────────────────

function InterviewerList({ items, emoji, color }: { items: string[]; emoji: string; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 items-start">
          <span className="text-sm shrink-0 mt-0.5">{emoji}</span>
          <p className={`text-xs leading-relaxed ${color}`}>{item}</p>
        </li>
      ))}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface RoastReportProps {
  data: RoastV6
}

export function RoastReport({ data }: RoastReportProps) {
  const ic = interestColor(data.recruiterInterest)

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* ── §0 Overall Verdict ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-5 space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Score */}
          <div className="shrink-0">
            <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">Resume Rating</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black tabular-nums ${ratingColor(data.resumeRating)}`}>
                {data.resumeRating}
              </span>
              <span className="text-lg text-[var(--text-faint)]">/10</span>
            </div>
          </div>

          {/* Verdict text */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1.5">Overall verdict</div>
            <p className="text-sm text-[var(--text)] leading-relaxed">{data.overallVerdict}</p>
          </div>

          {/* Interest badge */}
          <div className="shrink-0">
            <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1.5">Recruiter Interest</div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border inline-block ${ic.bg} ${ic.border} ${ic.text}`}>
              {interestLabel(data.recruiterInterest)}
            </span>
          </div>
        </div>
      </div>

      {/* ── §1 First Impression ────────────────────────────────────────────── */}
      <Section id="s1" emoji="👁" title="First Impression" subtitle="10-second scan">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Stood out',       icon: '⚡', text: data.firstImpression?.stoodOut,      cls: 'border-blue-500/20 bg-blue-500/5' },
            { label: 'Confused me',     icon: '😕', text: data.firstImpression?.confused,       cls: 'border-orange-500/20 bg-orange-500/5' },
            { label: 'Kept reading because', icon: '👀', text: data.firstImpression?.keepReading, cls: 'border-green-500/20 bg-green-500/5' },
            { label: 'Almost stopped',  icon: '🛑', text: data.firstImpression?.almostStopped,  cls: 'border-red-500/20 bg-red-500/5' },
          ].map(({ label, icon, text, cls }) => (
            <div key={label} className={`rounded-lg border p-3 ${cls}`}>
              <p className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">
                {icon} {label}
              </p>
              <p className="text-xs text-[var(--text)] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── §2 Summary Roast ───────────────────────────────────────────────── */}
      {data.summaryRoast?.length > 0 && (
        <Section id="s2" emoji="📝" title="Summary Roast" subtitle={`${data.summaryRoast.length} weak phrases`}>
          <div className="space-y-3">
            {data.summaryRoast.map((p, i) => <PhraseCard key={i} p={p} />)}
          </div>
        </Section>
      )}

      {/* ── §3 Experience Roast ────────────────────────────────────────────── */}
      {data.experienceRoast?.length > 0 && (
        <Section id="s3" emoji="💼" title="Experience Roast" subtitle={`${data.experienceRoast.length} roles`}>
          <div className="space-y-3">
            {data.experienceRoast.map((e, i) => <ExperienceCard key={i} e={e} />)}
          </div>
        </Section>
      )}

      {/* ── §4 Projects Roast ──────────────────────────────────────────────── */}
      {data.projectsRoast?.length > 0 && (
        <Section id="s4" emoji="🛠" title="Projects Roast" subtitle={`${data.projectsRoast.length} projects`}>
          <div className="space-y-3">
            {data.projectsRoast.map((p, i) => <ProjectCard key={i} p={p} />)}
          </div>
        </Section>
      )}

      {/* ── §5 Skills Roast ────────────────────────────────────────────────── */}
      {data.skillsRoast && (
        <Section id="s5" emoji="🧰" title="Skills Roast">
          <div className="space-y-3">
            <div className="flex gap-2.5">
              <span className="text-base shrink-0">🔥</span>
              <p className="text-xs text-[var(--text)] leading-relaxed">{data.skillsRoast.overallRoast}</p>
            </div>
            <div className="flex gap-2.5">
              <span className="text-base shrink-0">🤔</span>
              <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">{data.skillsRoast.recruiterThinks}</p>
            </div>

            {data.skillsRoast.issues?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Issues detected</p>
                <ul className="space-y-1">
                  {data.skillsRoast.issues.map((iss, i) => (
                    <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                      <span className="text-orange-500 shrink-0">→</span>{iss}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.skillsRoast.flaggedSkills?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">
                  Can you defend these in an interview?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.skillsRoast.flaggedSkills.map((s, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── §6 ATS Roast ───────────────────────────────────────────────────── */}
      {data.atsRoast && (
        <Section id="s6" emoji="🤖" title="ATS Roast" subtitle="keyword analysis">
          <div className="space-y-4">
            <div className="flex gap-2.5">
              <span className="text-base shrink-0">🔥</span>
              <p className="text-xs text-[var(--text)] leading-relaxed">{data.atsRoast.overallRoast}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Missing keywords',  items: data.atsRoast.missingKeywords,  cls: 'border-red-500/25 bg-red-500/5', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
                { label: 'Weak keywords',     items: data.atsRoast.weakKeywords,     cls: 'border-orange-500/25 bg-orange-500/5', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
                { label: 'Overused keywords', items: data.atsRoast.overusedKeywords, cls: 'border-yellow-500/25 bg-yellow-500/5', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
              ].map(({ label, items, cls, badge }) => (
                <div key={label} className={`rounded-lg border p-3 ${cls}`}>
                  <p className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-2">{label}</p>
                  {items?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {items.map((kw, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${badge}`}>{kw}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--text-faint)] italic">None</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── §7 Interviewer Mode ────────────────────────────────────────────── */}
      {data.interviewerMode && (
        <Section id="s7" emoji="🎯" title="Interviewer Mode" subtitle="what I'd ask if you walked in today">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-2.5">
                5 questions I would definitely ask
              </p>
              <InterviewerList
                items={data.interviewerMode.questionsIWouldAsk ?? []}
                emoji="❓"
                color="text-[var(--text-muted)]"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-2.5">
                5 things I suspect are exaggerated
              </p>
              <InterviewerList
                items={data.interviewerMode.thingsISuspectAreExaggerated ?? []}
                emoji="🤨"
                color="text-orange-300/80"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2.5">
                5 things I&apos;d want proof of
              </p>
              <InterviewerList
                items={data.interviewerMode.thingsIWantProofOf ?? []}
                emoji="🔎"
                color="text-blue-300/80"
              />
            </div>
          </div>
        </Section>
      )}

      {/* ── §8 Hardest Truth ───────────────────────────────────────────────── */}
      {data.hardestTruth && (
        <Section id="s8" emoji="💀" title="Hardest Truth">
          <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-4">
            <p className="text-sm text-[var(--text)] leading-relaxed">{data.hardestTruth}</p>
          </div>
        </Section>
      )}

      {/* ── §9 30-Minute Fix List ──────────────────────────────────────────── */}
      {data.top10Fixes?.length > 0 && (
        <Section id="s9" emoji="⏱" title="If I had 30 minutes to fix this" subtitle="highest impact first">
          <ol className="space-y-2.5">
            {data.top10Fixes.map((fix, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  i === 0 ? 'bg-red-500/20 text-red-400' :
                  i < 3   ? 'bg-orange-500/20 text-orange-400' :
                  i < 6   ? 'bg-yellow-500/20 text-yellow-400' :
                             'bg-[var(--bg-overlay)] text-[var(--text-faint)]'
                }`}>
                  {i + 1}
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-0.5">{fix}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

    </div>
  )
}
