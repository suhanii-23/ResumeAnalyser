'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, BookOpen, Code2, Users, FileText, AlertTriangle, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InterviewPrepResult } from '@/lib/resume-schema'

interface InterviewPrepProps {
  prepResult: InterviewPrepResult | null
  onGenerate: () => void
  onStartMockInterview: () => void
  isLoading?: boolean
}

const priorityConfig = {
  high: { label: 'High Priority', variant: 'destructive' as const },
  medium: { label: 'Medium', variant: 'warning' as const },
  low: { label: 'Lower', variant: 'secondary' as const },
}

const difficultyConfig = {
  easy: { color: '#4ADE80', label: 'Easy' },
  medium: { color: '#FCD34D', label: 'Medium' },
  hard: { color: '#F87171', label: 'Hard' },
}

export function InterviewPrep({ prepResult, onGenerate, onStartMockInterview, isLoading }: InterviewPrepProps) {
  const [tab, setTab] = useState('topics')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  if (!prepResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center mb-4">
          <Mic className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Interview Preparation</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-2 leading-relaxed">
          Generate a personalized interview prep guide based on your resume, the job description, and your gaps.
        </p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-6 text-left">
          {[
            ['Study topics', 'Prioritized by importance'],
            ['Technical questions', 'Easy / Medium / Hard'],
            ['Behavioral questions', 'Based on company values'],
            ['Resume questions', 'About your specific claims'],
          ].map(([title, desc]) => (
            <div key={title} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3">
              <div className="text-xs font-semibold text-[var(--text)] mb-0.5">{title}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{desc}</div>
            </div>
          ))}
        </div>
        <Button onClick={onGenerate} disabled={isLoading}>
          {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          Generate Interview Prep
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Interview Preparation Guide</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Personalized for your resume and this role
          </p>
        </div>
        <Button size="sm" onClick={onStartMockInterview}>
          <Mic className="w-3.5 h-3.5 mr-1.5" />
          Mock Interview
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="topics">
            <BookOpen className="w-3 h-3" /> Topics ({prepResult.studyTopics.length})
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Code2 className="w-3 h-3" /> Technical ({prepResult.technicalQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="behavioral">
            <Users className="w-3 h-3" /> Behavioral ({prepResult.behavioralQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="resume">
            <FileText className="w-3 h-3" /> Resume-Based
          </TabsTrigger>
          <TabsTrigger value="gaps">
            <AlertTriangle className="w-3 h-3" /> Gap Q&amp;A
          </TabsTrigger>
        </TabsList>

        {/* Study Topics */}
        <TabsContent value="topics">
          <div className="space-y-2">
            {prepResult.studyTopics.map((topic, i) => {
              const cfg = priorityConfig[topic.priority]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--text)]">{topic.topic}</span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      {topic.resources?.length ? (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {topic.resources.map((r, ri) => (
                            <span key={ri} className="text-[11px] text-[var(--text-faint)] bg-[var(--bg-overlay)] border border-[var(--border)] px-2 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Technical Questions */}
        <TabsContent value="technical">
          <div className="space-y-2">
            {prepResult.technicalQuestions.map((q, i) => {
              const diff = difficultyConfig[q.difficulty]
              const isOpen = expandedQ === i
              return (
                <div
                  key={i}
                  className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpandedQ(isOpen ? null : i)}
                  >
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded border flex-shrink-0"
                      style={{
                        color: diff.color,
                        background: `${diff.color}18`,
                        borderColor: `${diff.color}40`,
                      }}
                    >
                      {diff.label}
                    </span>
                    <span className="text-sm text-[var(--text)] flex-1">{q.question}</span>
                  </button>
                  {isOpen && q.hint && (
                    <div
                      className="px-3 pb-3 border-t border-[var(--border)]"
                      style={{ borderTopColor: 'var(--border)' }}
                    >
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        <span className="font-semibold text-[var(--accent)]">Hint: </span>
                        {q.hint}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Behavioral */}
        <TabsContent value="behavioral">
          <div className="space-y-2">
            {prepResult.behavioralQuestions.map((q, i) => (
              <div
                key={i}
                className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3"
              >
                <p className="text-sm text-[var(--text)] mb-1.5">{q.question}</p>
                <div className="text-[11px] text-[var(--text-faint)]">
                  Tests: <span className="text-[var(--accent)]">{q.companyValue}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Resume-based */}
        <TabsContent value="resume">
          <div className="space-y-2">
            {prepResult.resumeBasedQuestions.map((q, i) => (
              <div
                key={i}
                className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-3"
              >
                <p className="text-sm text-[var(--text)] mb-2">{q.question}</p>
                <div
                  className="text-[11px] font-mono text-[var(--text-muted)] p-2 rounded"
                  style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
                >
                  From resume: &ldquo;{q.resumeReference}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Gap questions */}
        <TabsContent value="gaps">
          <p className="text-xs text-[var(--text-muted)] mb-3">
            These questions exploit gaps in your resume. Prepare honest, strategic answers.
          </p>
          <div className="space-y-3">
            {prepResult.weaknessQuestions.map((q, i) => (
              <div
                key={i}
                className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg overflow-hidden"
              >
                <div className="p-3 border-b border-[var(--border)]">
                  <p className="text-sm text-[var(--text)]">{q.question}</p>
                  <p className="text-[11px] text-[#F87171] mt-1">Gap: {q.gap}</p>
                </div>
                <div
                  className="p-3"
                  style={{ background: 'rgba(94,106,210,0.05)' }}
                >
                  <p className="text-[11px] text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--accent)]">Strategy: </span>
                    {q.strategyHint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
