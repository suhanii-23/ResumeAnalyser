import { create } from 'zustand'
import {
  ResumeSchema, ResumeVersion, RoastAnnotation,
  RecruiterEvaluation, InterviewPrepResult, RoastResult, RoastV5
} from './resume-schema'

export interface SubScore {
  skillsMatch: number
  keywordMatch: number
  experienceMatch: number
  educationMatch: number
  cultureFit: number
  atsOptimization: number
}

export interface MissingSkill {
  skill: string
  importance: 'High' | 'Medium' | 'Low'
  context: string
}

export interface Suggestion {
  section: string
  type: 'bullet' | 'section' | 'keyword'
  before: string
  after: string
  reason: string
}

export interface AnalysisResult {
  overallScore: number
  subScores: SubScore
  resumeSchema: ResumeSchema
  missingSkills: MissingSkill[]
  missingKeywords: string[]
  missingResponsibilities: Array<{ jdRequirement: string; gap: string }>
  companyValues: Array<{ value: string; demonstrated: boolean; evidence?: string }>
  experienceGaps: string[]
  suggestions: Suggestion[]
  atsProbability: number
  recruiterProbability: number
  interviewProbability: number
  keywordHeatmap: Array<{ keyword: string; status: 'strong' | 'weak' | 'missing' }>
  summary: string
  sectionGrades?: Record<string, string>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  resumeVersionId?: string   // which version was active when this message was sent
}

export interface ResumeStore {
  // Files + raw text
  resumeFile: File | null
  jdFile: File | null
  resumeText: string
  jdText: string
  jdInput: string
  resumeFileUrl: string   // blob URL for showing original PDF in preview

  // Resume versions
  resumeVersions: ResumeVersion[]
  currentVersionId: string | null

  // State
  isUploading: boolean
  isParsing: boolean
  isAnalyzing: boolean
  analysisComplete: boolean
  currentView: 'landing' | 'upload' | 'analyzing' | 'results'
  chatMode: 'coach' | 'recruiter' | 'interview'
  activePanel: 'analysis' | 'chat' | 'roast' | 'recruiter' | 'interview' | 'diff' | 'resume'

  // Text-based version history (preserves original formatting)
  currentResumeText: string
  resumeTextVersions: Array<{
    id: string; text: string; label: string; timestamp: Date; changeDescription?: string
  }>

  // Results
  analysisResult: AnalysisResult | null
  roastAnnotations: RoastAnnotation[]
  roastResult: RoastResult | null
  roastV5: RoastV5 | null
  recruiterEvaluation: RecruiterEvaluation | null
  interviewPrep: InterviewPrepResult | null

  // Chat
  chatMessages: ChatMessage[]
  isChatLoading: boolean

  // Computed helpers
  currentSchema: ResumeSchema | null
  previousSchema: ResumeSchema | null   // for diff view

  // Actions
  setResumeFile: (f: File | null) => void
  setResumeFileUrl: (url: string) => void
  setJdFile: (f: File | null) => void
  setResumeText: (t: string) => void
  setJdText: (t: string) => void
  setJdInput: (t: string) => void
  setIsUploading: (v: boolean) => void
  setIsParsing: (v: boolean) => void
  setIsAnalyzing: (v: boolean) => void
  setAnalysisComplete: (v: boolean) => void
  setCurrentView: (v: ResumeStore['currentView']) => void
  setChatMode: (m: ResumeStore['chatMode']) => void
  setActivePanel: (p: ResumeStore['activePanel']) => void
  pushTextVersion: (text: string, label: string, description?: string) => void
  setAnalysisResult: (r: AnalysisResult | null) => void
  setRoastAnnotations: (a: RoastAnnotation[]) => void
  setRoastResult: (r: RoastResult | null) => void
  setRoastV5: (r: RoastV5 | null) => void
  setRecruiterEvaluation: (e: RecruiterEvaluation | null) => void
  setInterviewPrep: (p: InterviewPrepResult | null) => void
  addChatMessage: (m: ChatMessage) => void
  setChatMessages: (ms: ChatMessage[]) => void
  setIsChatLoading: (v: boolean) => void
  pushResumeVersion: (schema: ResumeSchema, label: string, description?: string) => void
  reset: () => void
}

const initial = {
  resumeFile: null,
  jdFile: null,
  resumeText: '',
  jdText: '',
  jdInput: '',
  resumeVersions: [],
  currentVersionId: null,
  currentResumeText: '',
  resumeTextVersions: [],
  resumeFileUrl: '',
  isUploading: false,
  isParsing: false,
  isAnalyzing: false,
  analysisComplete: false,
  currentView: 'landing' as const,
  chatMode: 'coach' as const,
  activePanel: 'chat' as const,
  analysisResult: null,
  roastAnnotations: [],
  roastResult: null,
  roastV5: null,
  recruiterEvaluation: null,
  interviewPrep: null,
  chatMessages: [],
  isChatLoading: false,
  currentSchema: null,
  previousSchema: null,
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  ...initial,

  setResumeFile: (f) => set({ resumeFile: f }),
  setResumeFileUrl: (url) => set({ resumeFileUrl: url }),
  setJdFile: (f) => set({ jdFile: f }),
  setResumeText: (t) => set({ resumeText: t }),
  setJdText: (t) => set({ jdText: t }),
  setJdInput: (t) => set({ jdInput: t }),
  setIsUploading: (v) => set({ isUploading: v }),
  setIsParsing: (v) => set({ isParsing: v }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisComplete: (v) => set({ analysisComplete: v }),
  setCurrentView: (v) => set({ currentView: v }),
  setChatMode: (m) => set({ chatMode: m }),
  setActivePanel: (p) => set({ activePanel: p }),
  pushTextVersion: (text, label, description) => {
    const { resumeTextVersions } = get()
    const version = { id: Date.now().toString(), text, label, timestamp: new Date(), changeDescription: description }
    set({ resumeTextVersions: [...resumeTextVersions, version], currentResumeText: text })
  },
  setAnalysisResult: (r) => set({ analysisResult: r }),
  setRoastAnnotations: (a) => set({ roastAnnotations: a }),
  setRoastResult: (r) => set({ roastResult: r }),
  setRoastV5: (r) => set({ roastV5: r }),
  setRecruiterEvaluation: (e) => set({ recruiterEvaluation: e }),
  setInterviewPrep: (p) => set({ interviewPrep: p }),
  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  setChatMessages: (ms) => set({ chatMessages: ms }),
  setIsChatLoading: (v) => set({ isChatLoading: v }),

  pushResumeVersion: (schema, label, description) => {
    const { resumeVersions, currentSchema } = get()
    const version: ResumeVersion = {
      id: Date.now().toString(),
      schema,
      label,
      timestamp: new Date(),
      changeDescription: description,
    }
    set({
      resumeVersions: [...resumeVersions, version],
      currentVersionId: version.id,
      previousSchema: currentSchema,
      currentSchema: schema,
    })
  },

  reset: () => set(initial),
}))
