'use client'

import { useState } from 'react'
import {
  BarChart3, FileSearch, MessageSquare,
  ChevronLeft, Download, GitCompare, Flame, UserCheck, Mic,
  History, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScoreDashboard } from './ScoreDashboard'
import { GapAnalysis } from './GapAnalysis'
import { Suggestions } from './Suggestions'

import { RecruiterView } from './RecruiterView'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ResumeDiffViewer } from '@/components/resume/ResumeDiffViewer'
import { FinalResume } from '@/components/resume/FinalResume'
import { RoastCanvas } from '@/components/resume/RoastCanvas'
import { InterviewPrep } from '@/components/interview/InterviewPrep'
import { ResumeExporter } from '@/components/resume/ResumeExporter'
import { useResumeStore } from '@/lib/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

interface ResultsViewProps {
  onReset: () => void
}

const NAV_ITEMS = [
  { id: 'chat', label: 'Edit Resume', icon: MessageSquare },
  { id: 'resume', label: 'Final Resume', icon: FileSearch },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'roast', label: 'Roast', icon: Flame },
  { id: 'recruiter', label: 'Recruiter', icon: UserCheck },
  { id: 'interview', label: 'Interview', icon: Mic },
  { id: 'diff', label: 'Diff', icon: GitCompare },
] as const

type Panel = typeof NAV_ITEMS[number]['id']

export function ResultsView({ onReset }: ResultsViewProps) {
  const {
    analysisResult, currentSchema,
    roastV5, recruiterEvaluation, interviewPrep,
    resumeText, jdText, activePanel,
    currentResumeText, resumeTextVersions, resumeFileUrl,
    setActivePanel, setRoastV5, setRecruiterEvaluation,
    setInterviewPrep, setChatMode,
  } = useResumeStore()

  const [loadingPanel, setLoadingPanel] = useState<string | null>(null)

  if (!analysisResult) return null

  const schema = currentSchema || analysisResult.resumeSchema
  const score = analysisResult.overallScore
  const scoreColor = getScoreColor(score)

  const runRoast = async () => {
    setLoadingPanel('roast')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: currentResumeText || resumeText,
          jdText,
          mode: 'roast',
        }),
      })
      const data = await res.json()
      if (data.result?.verdictStamp || data.result?.recruiterNotes) {
        setRoastV5(data.result)
        setActivePanel('roast')
      }
    } finally {
      setLoadingPanel(null)
    }
  }

  const runRecruiterEval = async () => {
    setLoadingPanel('recruiter')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jdText,
          mode: 'recruiter',
          analysisContext: JSON.stringify({
            score,
            missingSkills: analysisResult.missingSkills?.slice(0, 5),
            experienceGaps: analysisResult.experienceGaps?.slice(0, 3),
          }),
        }),
      })
      const data = await res.json()
      if (data.result) setRecruiterEvaluation(data.result)
    } finally {
      setLoadingPanel(null)
    }
  }

  const runInterviewPrep = async () => {
    setLoadingPanel('interview')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jdText,
          resumeSchema: schema,
          missingSkills: analysisResult.missingSkills,
          companyValues: analysisResult.companyValues,
          mode: 'interview-prep',
        }),
      })
      const data = await res.json()
      if (data.result) setInterviewPrep(data.result)
    } finally {
      setLoadingPanel(null)
    }
  }

  const panel = activePanel as Panel

  const versionLabel = resumeTextVersions.length > 0
    ? `v${resumeTextVersions.length + 1}`
    : 'v1 · Original'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Left sidebar nav */}
      <aside className="w-48 flex-shrink-0 border-r border-[var(--border)] flex flex-col">
        {/* Logo + back */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text)] text-xs transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            New
          </button>
          <div className="flex-1" />
          <div className="text-[11px] font-mono text-[var(--text-faint)]">{versionLabel}</div>
        </div>

        {/* Score badge */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="text-[11px] text-[var(--text-faint)] mb-1">Match Score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}%</span>
            <span className="text-[11px] text-[var(--text-muted)]">{getScoreLabel(score)}</span>
          </div>
          <Progress value={score} color={scoreColor} className="mt-1.5" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                panel === id
                  ? 'bg-[var(--bg-overlay)] text-[var(--text)] border border-[var(--border-md)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              {loadingPanel === id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Icon className="w-3.5 h-3.5" />
              }
              {label}
            </button>
          ))}
        </nav>

        {/* Version history */}
        {resumeTextVersions.length > 0 && (
          <div className="px-3 py-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] mb-2">
              <History className="w-3 h-3" />
              {resumeTextVersions.length} edit{resumeTextVersions.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {resumeTextVersions.slice(-4).reverse().map((v, i) => (
                <div key={v.id} className="text-[10px] text-[var(--text-faint)] truncate">
                  v{resumeTextVersions.length - i} · {v.changeDescription?.slice(0, 28)}…
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="px-3 py-3 border-t border-[var(--border)]">
          <div className="text-[11px] text-[var(--text-faint)] mb-2 flex items-center gap-1">
            <Download className="w-3 h-3" />
            Export Resume
          </div>
          <ResumeExporter schema={schema} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Chat / Edit */}
        {panel === 'chat' && (
          <div className="flex h-full flex-col">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h1 className="text-sm font-semibold text-[var(--text)]">AI Resume Editor</h1>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Tell me what to change — I&apos;ll edit the resume directly
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface onResumeEdited={() => setActivePanel('diff')} />
            </div>
          </div>
        )}

        {/* Final Resume — section changes + LaTeX */}
        {panel === 'resume' && (
          <div className="flex flex-col h-full overflow-hidden">
            <FinalResume
              resumeText={currentResumeText || resumeText}
              jdText={jdText}
              analysisResult={analysisResult}
            />
          </div>
        )}

        {/* Analysis */}
        {panel === 'analysis' && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4">
              <h1 className="text-sm font-semibold text-[var(--text)]">Analysis Report</h1>
              <p className="text-xs text-[var(--text-muted)]">
                Detailed breakdown of your resume against the job description
              </p>
            </div>
            <div className="space-y-5 max-w-3xl">
              <ScoreDashboard result={analysisResult} />
              <GapAnalysis result={analysisResult} />
              <Suggestions result={analysisResult} />
            </div>
          </div>
        )}


        {/* Roast */}
        {panel === 'roast' && (
          <div className="flex-1 overflow-y-auto">
            {!roastV5 ? (

              /* ── Empty state ─────────────────────────────────────────── */
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="text-6xl mb-5">🔥</div>
                <p className="text-sm font-semibold text-[var(--text)] mb-2">Resume Roast</p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mb-7 leading-relaxed">
                  A senior recruiter reviews your resume with a red pen.
                  Verdict stamp. Five major callouts. Ten specific notes.
                  Every annotation earned, not generated.
                </p>
                <Button onClick={runRoast} disabled={!!loadingPanel} variant="outline" size="lg">
                  {loadingPanel === 'roast'
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing…</>
                    : '🔥 Roast My Resume'
                  }
                </Button>
              </div>

            ) : (

              /* ── Results ─────────────────────────────────────────────── */
              <div className="flex flex-col lg:flex-row h-full min-h-0">

                {/* Left: annotated resume canvas */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-sm font-semibold text-[var(--text)]">Resume Roast</h1>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        1 verdict · 5 callouts · 10 notes
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={runRoast} disabled={!!loadingPanel}>
                      {loadingPanel === 'roast'
                        ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Re-roasting…</>
                        : '🔥 Re-Roast'
                      }
                    </Button>
                  </div>

                  <RoastCanvas
                    resumeText={currentResumeText || resumeText}
                    pdfFileUrl={resumeFileUrl || undefined}
                    roastData={roastV5}
                  />
                </div>

                {/* Right: analysis panel */}
                <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] overflow-y-auto p-4 space-y-5">

                  {/* Score + verdict stamp */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-4xl font-black tabular-nums"
                        style={{
                          color: roastV5.roastScore >= 7 ? '#16a34a'
                            : roastV5.roastScore >= 5 ? '#d97706'
                            : '#c5000a',
                        }}
                      >
                        {(roastV5.roastScore ?? 0).toFixed(1)}
                      </span>
                      <span className="text-sm text-[var(--text-faint)]">/10</span>
                    </div>

                    <div className="inline-block px-2.5 py-1 border-2 border-red-600/60 rounded text-[11px] font-black tracking-widest text-red-500">
                      {roastV5.verdictStamp}
                    </div>

                    {roastV5.funniesLine && (
                      <p className="text-[11px] italic text-[var(--text-muted)] leading-snug border-l-2 border-red-500/40 pl-2">
                        &ldquo;{roastV5.funniesLine}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Decision badge */}
                  {roastV5.verdict?.shortlist && (
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">Shortlist decision</p>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        ['strong-yes','yes'].includes(roastV5.verdict.shortlist)
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : roastV5.verdict.shortlist === 'maybe'
                          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {roastV5.verdict.shortlist.replace('-', ' ').toUpperCase()}
                      </span>
                      <p className="text-[10px] text-[var(--text-faint)] mt-1.5 leading-snug">
                        {roastV5.verdict.shortlistExplanation}
                      </p>
                    </div>
                  )}

                  {/* Strengths */}
                  {roastV5.strengths?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1.5">What works</p>
                      <ul className="space-y-1.5">
                        {roastV5.strengths.map((s, i) => (
                          <li key={i} className="text-[11px] text-[var(--text-muted)] leading-snug flex gap-1.5">
                            <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {roastV5.weaknesses?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">What doesn&apos;t</p>
                      <ul className="space-y-1.5">
                        {roastV5.weaknesses.map((w, i) => (
                          <li key={i} className="text-[11px] text-[var(--text-muted)] leading-snug flex gap-1.5">
                            <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Biggest miss */}
                  {roastV5.biggestMissedOpportunity && (
                    <div>
                      <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider mb-1.5">Biggest fix</p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-snug">{roastV5.biggestMissedOpportunity}</p>
                    </div>
                  )}

                  {/* ATS + recruiter concern */}
                  <div className="space-y-3 border-t border-[var(--border)] pt-3">
                    {roastV5.atsIssue && (
                      <div>
                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">ATS Issue</p>
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug">{roastV5.atsIssue}</p>
                      </div>
                    )}
                    {roastV5.recruiterConcern && (
                      <div>
                        <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1">Recruiter concern</p>
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug">{roastV5.recruiterConcern}</p>
                      </div>
                    )}
                  </div>

                  {/* Interview traps */}
                  {roastV5.verdict?.interviewQuestions?.length > 0 && (
                    <div className="border-t border-[var(--border)] pt-3">
                      <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1.5">Interview traps</p>
                      <ul className="space-y-2">
                        {roastV5.verdict.interviewQuestions.slice(0, 3).map((q, i) => (
                          <li key={i} className="text-[11px] text-[var(--text-muted)] leading-snug">
                            <span className="text-orange-500 font-medium">Q: </span>{q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </aside>
              </div>
            )}
          </div>
        )}

        {/* Recruiter */}
        {panel === 'recruiter' && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <RecruiterView
              evaluation={recruiterEvaluation}
              onEvaluate={runRecruiterEval}
              isLoading={loadingPanel === 'recruiter'}
            />
          </div>
        )}

        {/* Interview */}
        {panel === 'interview' && (
          <div className="flex h-full">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <InterviewPrep
                prepResult={interviewPrep}
                onGenerate={runInterviewPrep}
                onStartMockInterview={() => {
                  setChatMode('interview')
                  setActivePanel('chat')
                }}
                isLoading={loadingPanel === 'interview'}
              />
            </div>
          </div>
        )}

        {/* Diff */}
        {panel === 'diff' && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4">
              <h1 className="text-sm font-semibold text-[var(--text)]">Resume Changes</h1>
              <p className="text-xs text-[var(--text-muted)]">Before vs. after comparison</p>
            </div>
            {resumeTextVersions.length > 0 ? (
              <div className="max-w-4xl">
                <ResumeDiffViewer
                  before={resumeTextVersions.length > 1
                    ? resumeTextVersions[resumeTextVersions.length - 2].text
                    : resumeText}
                  after={resumeTextVersions[resumeTextVersions.length - 1].text}
                  changeDescription={resumeTextVersions[resumeTextVersions.length - 1].changeDescription}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GitCompare className="w-8 h-8 text-[var(--text-faint)] mb-3" />
                <p className="text-sm text-[var(--text)] mb-1">No changes yet</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Use the AI Editor to make changes, then come back here to see the diff.
                </p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setActivePanel('chat')}>
                  Open Editor
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
