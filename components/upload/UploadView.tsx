'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropZone } from './DropZone'
import { useResumeStore } from '@/lib/store'

interface UploadViewProps {
  onAnalyze: () => void
}

export function UploadView({ onAnalyze }: UploadViewProps) {
  const {
    resumeFile, jdFile, jdInput,
    resumeText, jdText, isParsing,
    setResumeFile, setJdFile, setJdInput,
    setResumeText, setJdText, setIsParsing,
    setResumeFileUrl,
  } = useResumeStore()

  const [jdMode, setJdMode] = useState<'paste' | 'upload'>('paste')
  const [showPreview, setShowPreview] = useState(false)
  const [parseError, setParseError] = useState('')

  const parseFile = async (file: File, type: 'resume' | 'jd') => {
    setIsParsing(true)
    setParseError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.text) {
        type === 'resume' ? setResumeText(data.text) : setJdText(data.text)
        setParseError('')
      } else {
        setParseError('Could not extract text from PDF. Please paste your resume text in the box below.')
      }
    } catch {
      setParseError('Network error parsing file. Please paste your resume text below.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleResumeFile = async (file: File) => {
    setResumeFile(file)
    // Create blob URL so we can show the original PDF in the preview tab
    const url = URL.createObjectURL(file)
    setResumeFileUrl(url)
    await parseFile(file, 'resume')
  }

  const handleJdFile = async (file: File) => {
    setJdFile(file)
    await parseFile(file, 'jd')
  }

  const canAnalyze = resumeText && (jdText || jdInput)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--text)]">ResumeIQ</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-1.5">
          Upload your resume and job description
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          We&apos;ll analyze them and open a live editor where the AI can rewrite your resume directly.
        </p>

        <div className="space-y-5">
          {/* Resume */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                1
              </div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Your Resume</h2>
            </div>

            <DropZone
              label="Drop resume here"
              onFileAccepted={handleResumeFile}
              isLoading={isParsing && !!resumeFile}
              currentFile={resumeFile}
              onRemove={() => { setResumeFile(null); setResumeText('') }}
            />

            <div className="flex items-center gap-3 my-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[11px] text-[var(--text-faint)]">{resumeFile ? 'or paste text as fallback' : 'or paste text'}</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <Textarea
              placeholder="Paste resume text here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="h-28"
            />

            {resumeText && resumeFile && (
              <>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {showPreview ? 'Hide' : 'Preview'} extracted text
                  {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2 p-3 rounded-md bg-[var(--bg-overlay)] border border-[var(--border)] max-h-40 overflow-y-auto"
                  >
                    <pre className="text-[11px] text-[var(--text-muted)] font-mono whitespace-pre-wrap">
                      {resumeText.slice(0, 1500)}{resumeText.length > 1500 ? '…' : ''}
                    </pre>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* JD */}
          <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                >
                  2
                </div>
                <h2 className="text-sm font-semibold text-[var(--text)]">Job Description</h2>
              </div>
              <div className="flex gap-1">
                {(['paste', 'upload'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setJdMode(m)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors capitalize ${
                      jdMode === m
                        ? 'bg-[var(--bg-overlay)] border-[var(--border-md)] text-[var(--text)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {jdMode === 'paste' ? (
              <Textarea
                placeholder="Paste the full job description here… (the more detail, the better)"
                value={jdInput}
                onChange={(e) => { setJdInput(e.target.value); setJdText(e.target.value) }}
                className="h-40"
              />
            ) : (
              <DropZone
                label="Drop job description"
                onFileAccepted={handleJdFile}
                isLoading={isParsing && !!jdFile}
                currentFile={jdFile}
                onRemove={() => { setJdFile(null); setJdText('') }}
              />
            )}
          </div>

          {/* Analyze */}
          <Button
            size="xl"
            onClick={onAnalyze}
            disabled={!canAnalyze || isParsing}
            className="w-full"
          >
            {isParsing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Parsing…</>
            ) : (
              <>Analyze Resume <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>

          {parseError && (
            <p className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {parseError}
            </p>
          )}
          {!canAnalyze && !parseError && (
            <p className="text-center text-xs text-[var(--text-faint)]">
              Add both your resume and job description to continue
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
