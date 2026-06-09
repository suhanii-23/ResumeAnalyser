'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, Loader2, Wand2, Mic, UserCheck, CheckCircle, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useResumeStore, ChatMessage } from '@/lib/store'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const QUICK_ACTIONS = [
  { label: 'Make experience leadership-focused', icon: '🎯' },
  { label: 'Add stronger impact metrics', icon: '📊' },
  { label: 'Rewrite summary for this role', icon: '✏️' },
  { label: 'Make more ATS-friendly', icon: '🤖' },
  { label: 'Tailor skills section for this job', icon: '🚀' },
  { label: 'Improve project descriptions', icon: '💡' },
]

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? 'bg-[var(--accent)]'
            : 'bg-[var(--bg-overlay)] border border-[var(--border-md)]'
        }`}
      >
        {isUser
          ? <User className="w-3 h-3 text-white" />
          : <Bot className="w-3 h-3 text-[var(--text-muted)]" />
        }
      </div>
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.resumeVersionId && !isUser && (
          <div
            className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border self-start"
            style={{ color: '#4ADE80', background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.25)' }}
          >
            <CheckCircle className="w-3 h-3" />
            Resume updated
          </div>
        )}
        <div
          className={`px-3 py-2.5 rounded-lg text-sm ${
            isUser
              ? 'bg-[var(--bg-overlay)] border border-[var(--border-md)] text-[var(--text)] rounded-tr-sm'
              : 'bg-[var(--bg-raised)] border border-[var(--border)] rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm text-[var(--text)]">{msg.content}</p>
          ) : (
            <div className="md text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[11px] text-[var(--text-faint)] px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-md)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3 h-3 text-[var(--text-muted)]" />
      </div>
      <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg rounded-tl-sm px-3 py-2.5">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ChatInterfaceProps {
  onResumeEdited?: () => void
}

export function ChatInterface({ onResumeEdited }: ChatInterfaceProps) {
  const {
    chatMessages, isChatLoading, chatMode,
    resumeText, jdText, analysisResult,
    currentResumeText, pushTextVersion,
    addChatMessage, setIsChatLoading, setChatMode, setActivePanel,
  } = useResumeStore()

  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streaming, isChatLoading])

  // The working resume text — prefer edited version, fall back to original
  const workingText = currentResumeText || resumeText

  const sendEdit = async (instruction: string) => {
    setIsEditing(true)
    setIsChatLoading(true)

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: instruction,
      timestamp: new Date(),
    }
    addChatMessage(userMsg)
    setInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: instruction }],
          resumeText,
          currentResumeText: workingText,
          jdText,
          analysisResult,
          mode: 'edit',
        }),
      })

      if (!res.ok) throw new Error('Edit failed')
      const data = await res.json()

      if (data.editResult?.updatedText) {
        const { updatedText, changeDescription, explanation } = data.editResult

        pushTextVersion(
          updatedText,
          `Edit: ${instruction.slice(0, 40)}`,
          changeDescription
        )

        const versionId = Date.now().toString()
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${explanation}\n\n**Changes made:** ${changeDescription}`,
          timestamp: new Date(),
          resumeVersionId: versionId,
        })
        onResumeEdited?.()
      } else {
        throw new Error('No updated text returned')
      }
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to apply edit. Please try again.',
        timestamp: new Date(),
      })
    } finally {
      setIsEditing(false)
      setIsChatLoading(false)
    }
  }

  const sendChat = async (content: string) => {
    if (!content.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addChatMessage(userMsg)
    setInput('')
    setIsChatLoading(true)
    setStreaming('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          resumeText,
          currentResumeText: workingText,
          jdText,
          analysisResult,
          mode: chatMode,
        }),
      })

      if (!res.ok) throw new Error('Chat failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value, { stream: true })
          setStreaming(full)
        }
      }

      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: full,
        timestamp: new Date(),
      })
      setStreaming('')
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Check your connection.',
        timestamp: new Date(),
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim()) return
    const editKeywords = [
      'rewrite', 'update', 'change', 'improve', 'make', 'add', 'remove', 'tailor',
      'rephrase', 'modify', 'fix', 'enhance', 'strengthen', 'optimize', 'adjust',
      'convert', 'transform', 'focus', 'emphasize',
    ]
    const isEditIntent = editKeywords.some((kw) =>
      input.toLowerCase().startsWith(kw) || input.toLowerCase().includes(` ${kw} `)
    )

    if (isEditIntent) {
      sendEdit(input)
    } else {
      sendChat(input)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const modeOptions = [
    { id: 'coach', label: 'Coach', icon: Wand2 },
    { id: 'recruiter', label: 'Recruiter', icon: UserCheck },
    { id: 'interview', label: 'Mock Interview', icon: Mic },
  ] as const

  return (
    <div className="flex flex-col h-full">
      {/* Mode bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 pt-3 pb-2 border-b border-[var(--border)]">
        {modeOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setChatMode(id)
              if (id === 'interview') setActivePanel('interview')
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              chatMode === id
                ? 'bg-[var(--bg-overlay)] border border-[var(--border-md)] text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
        {chatMode === 'coach' && (
          <button
            onClick={() => setActivePanel('diff')}
            className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-md)] transition-colors"
          >
            <GitCompare className="w-3 h-3" />
            View Changes
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center mb-3">
              {chatMode === 'recruiter' ? (
                <UserCheck className="w-5 h-5 text-[var(--text-muted)]" />
              ) : chatMode === 'interview' ? (
                <Mic className="w-5 h-5 text-[var(--text-muted)]" />
              ) : (
                <Wand2 className="w-5 h-5 text-[var(--text-muted)]" />
              )}
            </div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">
              {chatMode === 'recruiter'
                ? 'Recruiter Mode'
                : chatMode === 'interview'
                ? 'Mock Interview'
                : 'AI Resume Editor'}
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed">
              {chatMode === 'coach'
                ? "Tell me what to change. I'll edit your resume text directly — no reformatting."
                : chatMode === 'recruiter'
                ? 'Ask me anything about how a recruiter sees your resume.'
                : 'Start the mock interview to practice for your real one.'}
            </p>

            {chatMode === 'coach' && (
              <div className="mt-6 grid grid-cols-2 gap-1.5 w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendEdit(action.label)}
                    className="text-[11px] text-left px-2.5 py-2 rounded border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-md)] transition-colors leading-tight"
                  >
                    <span className="mr-1">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {chatMode === 'interview' && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => sendChat("Let's start the mock interview.")}
              >
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                Start Mock Interview
              </Button>
            )}
          </div>
        )}

        {chatMessages.map((m) => <MessageBubble key={m.id} msg={m} />)}

        {streaming && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-md)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-[var(--text-muted)]" />
            </div>
            <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg rounded-tl-sm px-3 py-2.5 max-w-[82%]">
              <div className="md text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streaming}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {isChatLoading && !streaming && <TypingDots />}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-[var(--border)]">
        {isEditing && (
          <div
            className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded text-[11px]"
            style={{ background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.25)' }}
          >
            <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
            <span className="text-[var(--accent)]">Editing resume…</span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              chatMode === 'coach'
                ? 'Tell me what to change, or ask a question…'
                : chatMode === 'recruiter'
                ? 'Ask the recruiter…'
                : 'Respond to the interviewer…'
            }
            className="flex-1 min-h-[38px] max-h-28 resize-none bg-[var(--bg-raised)] border-[var(--border)] text-sm py-2"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="h-[38px] w-9 flex-shrink-0"
          >
            {isChatLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </Button>
        </div>
        <p className="text-[11px] text-[var(--text-faint)] mt-1.5">
          {chatMode === 'coach'
            ? 'Edit commands update your resume text directly · ↵ to send'
            : '↵ to send · Shift+↵ for new line'}
        </p>
      </div>
    </div>
  )
}
