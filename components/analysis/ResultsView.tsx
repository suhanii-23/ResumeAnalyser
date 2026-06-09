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
import { ResumeRenderer } from '@/components/resume/ResumeRenderer'
import { ResumeDiffViewer } from '@/components/resume/ResumeDiffViewer'
import { RoastAnnotations } from '@/components/resume/RoastAnnotations'
import { InterviewPrep } from '@/components/interview/InterviewPrep'
import { ResumeExporter } from '@/components/resume/ResumeExporter'
import { useResumeStore } from '@/lib/store'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { RoastAnnotation } from '@/lib/resume-schema'

interface ResultsViewProps {
  onReset: () => void
}

const NAV_ITEMS = [
  { id: 'chat', label: 'Edit Resume', icon: MessageSquare },
  { id: 'resume', label: 'Preview', icon: FileSearch },
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
    roastAnnotations, recruiterEvaluation, interviewPrep,
    resumeText, jdText, activePanel,
    currentResumeText, resumeTextVersions,
    setActivePanel, setRoastAnnotations, setRecruiterEvaluation,
    setInterviewPrep, setChatMode,
  } = useResumeStore()

  const [loadingPanel, setLoadingPanel] = useState<string | null>(null)
  const [roastMeta, setRoastMeta] = useState<{
    overallVerdict?: string; funniesLine?: string; biggestMissedOpportunity?: string
  }>({})

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
          resumeText,
          resumeSchema: schema,
          mode: 'roast',
        }),
      })
      const data = await res.json()
      if (data.result?.annotations) {
        setRoastAnnotations(data.result.annotations as RoastAnnotation[])
        setRoastMeta({
          overallVerdict: data.result.overallVerdict,
          funniesLine: data.result.funniesLine,
          biggestMissedOpportunity: data.result.biggestMissedOpportunity,
        })
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

        {/* Resume preview — shows original text as-is */}
        {panel === 'resume' && (
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between z-10">
              <div>
                <h1 className="text-sm font-semibold text-[var(--text)]">Resume Preview</h1>
                {resumeTextVersions.length > 0 && (
                  <p className="text-[11px] text-[var(--accent)]">
                    v{resumeTextVersions.length + 1} · {resumeTextVersions[resumeTextVersions.length - 1]?.changeDescription}
                  </p>
                )}
              </div>
              <ResumeExporter schema={schema} resumeText={currentResumeText || resumeText} />
            </div>
            <div className="p-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg border border-[var(--border)] shadow-xl p-8 md:p-12">
                <pre className="whitespace-pre-wrap font-[inherit] text-[13px] text-gray-900 leading-relaxed">
                  {currentResumeText || resumeText}
                </pre>
              </div>
            </div>
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
          <div className="flex h-full">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-sm font-semibold text-[var(--text)]">Resume Roast</h1>
                  <p className="text-xs text-[var(--text-muted)]">Line-by-line critique from a senior recruiter</p>
                </div>
                <Button size="sm" variant="outline" onClick={runRoast} disabled={!!loadingPanel}>
                  {loadingPanel === 'roast'
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Roasting…</>
                    : 'Re-Roast'
                  }
                </Button>
              </div>
              {roastAnnotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">🔥</div>
                  <p className="text-sm text-[var(--text)] font-medium mb-1">Resume Roast</p>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs mb-6">
                    Get line-by-line critique. Every vague bullet, missing metric, and weak phrasing called out — with specific fixes.
                  </p>
                  <Button onClick={runRoast} disabled={!!loadingPanel} variant="outline">
                    {loadingPanel === 'roast'
                      ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyzing…</>
                      : '🔥 Roast My Resume'
                    }
                  </Button>
                </div>
              ) : (
                <RoastAnnotations
                  annotations={roastAnnotations}
                  schema={schema}
                  overallVerdict={roastMeta.overallVerdict}
                  funniesLine={roastMeta.funniesLine}
                  biggestMissedOpportunity={roastMeta.biggestMissedOpportunity}
                />
              )}
            </div>
            {/* Resume with highlights */}
            <div className="w-[380px] flex-shrink-0 border-l border-[var(--border)] overflow-y-auto">
              <div className="px-3 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)] z-10">
                <span className="text-xs text-[var(--text-muted)]">Resume (with annotations)</span>
              </div>
              <div className="p-3">
                <div className="rounded-lg border border-[var(--border)] overflow-hidden shadow-lg">
                  <ResumeRenderer
                    schema={schema}
                    highlights={roastAnnotations.map((a) => a.targetText)}
                  />
                </div>
              </div>
            </div>
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
