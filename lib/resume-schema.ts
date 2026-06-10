// Normalized resume schema — all AI edits operate on this structure

export interface ContactInfo {
  name: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

export interface ExperienceEntry {
  id: string
  company: string
  title: string
  location?: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field?: string
  startDate?: string
  endDate: string
  gpa?: string
  notes?: string[]
}

export interface ProjectEntry {
  id: string
  name: string
  technologies?: string
  date?: string
  bullets: string[]
  link?: string
}

export interface ResumeSchema {
  contact: ContactInfo
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  projects: ProjectEntry[]
  skills: Record<string, string[]>   // category → skills
  certifications?: string[]
  rawText?: string                   // preserved for context
}

export interface ResumeVersion {
  id: string
  schema: ResumeSchema
  label: string
  timestamp: Date
  changeDescription?: string
}

export interface RoastAnnotation {
  id: string
  section: string
  targetText: string   // anchorText alias kept for compat
  comment: string
  severity: 'fatal' | 'error' | 'warning' | 'note'
  suggestion?: string  // kept for compat
  fix?: string         // new: exact replacement text
}

export interface RoastVerdict {
  impressed: string[]
  annoyed: string[]
  interviewQuestions: string[]
  shortlist: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no'
  shortlistExplanation: string
}

export interface RoastResult {
  annotations: RoastAnnotation[]
  roastScore: number
  roastScoreMeaning: string
  overallVerdict: string
  funniesLine: string
  biggestMissedOpportunity: string
  verdict: RoastVerdict
}

// ── V4 schema ─────────────────────────────────────────────────────────────────

/** Level 1 — Giant diagonal stamp over a section */
export interface V4MajorCallout {
  text: string       // e.g. "REJECTED" | "PROMISING BUT VAGUE"
  section: string
}

/** Level 2/3 — Section-level callout near a section header */
export interface V4SectionRoast {
  section: string    // e.g. "Experience"
  callout: string    // e.g. "BUZZWORD SOUP"
  level: 2 | 3
}

/** Level 2/3/4 — Specific line or phrase annotation */
export interface V4LineRoast {
  targetText: string // EXACT verbatim text from resume (5-60 chars)
  comment: string
  level: 2 | 3 | 4
  markType: 'circle' | 'underline' | 'strikethrough' | 'box'
}

export interface V4AtsRoast {
  keyword: string    // missing keyword from JD
  comment: string
}

export interface RoastV4 {
  overallVerdict: string
  roastScore: number
  density: 'light' | 'medium' | 'heavy'
  majorCallouts: V4MajorCallout[]
  sectionRoasts: V4SectionRoast[]
  lineRoasts: V4LineRoast[]
  atsRoasts: V4AtsRoast[]
  interviewQuestions: string[]
  recruiterConcerns: string[]
  funniesLine: string
  biggestMissedOpportunity: string
  verdict: RoastVerdict
}

export interface RecruiterEvaluation {
  firstImpression: string
  keepReading: boolean
  keepReadingReason: string
  tenSecondScan: string[]
  reasonsToShortlist: string[]
  reasonsToReject: string[]
  hiringRisks: string[]
  questionsId: string[]
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no'
  recommendationReason: string
}

export interface InterviewPrepResult {
  studyTopics: Array<{ topic: string; priority: 'high' | 'medium' | 'low'; resources?: string[] }>
  technicalQuestions: Array<{ question: string; difficulty: 'easy' | 'medium' | 'hard'; hint?: string }>
  behavioralQuestions: Array<{ question: string; companyValue: string }>
  resumeBasedQuestions: Array<{ question: string; resumeReference: string }>
  weaknessQuestions: Array<{ question: string; gap: string; strategyHint: string }>
}

// Parse raw text into a ResumeSchema
export function parseResumeToSchema(raw: string): ResumeSchema {
  // Return a minimal schema with raw text preserved
  // The real parsing is done by the AI in the analyze route
  return {
    contact: { name: '' },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: {},
    rawText: raw,
  }
}

// Convert schema back to plain text for display/export
export function schemaToText(schema: ResumeSchema): string {
  const lines: string[] = []

  if (schema.contact.name) {
    lines.push(schema.contact.name)
    const contactParts = [
      schema.contact.email,
      schema.contact.phone,
      schema.contact.location,
      schema.contact.linkedin,
      schema.contact.github,
    ].filter(Boolean)
    if (contactParts.length) lines.push(contactParts.join(' | '))
    lines.push('')
  }

  if (schema.summary) {
    lines.push('SUMMARY')
    lines.push(schema.summary)
    lines.push('')
  }

  if (schema.experience.length) {
    lines.push('EXPERIENCE')
    schema.experience.forEach((exp) => {
      lines.push(`${exp.title} | ${exp.company}${exp.location ? ' | ' + exp.location : ''}`)
      lines.push(`${exp.startDate} – ${exp.endDate}`)
      exp.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }

  if (schema.education.length) {
    lines.push('EDUCATION')
    schema.education.forEach((edu) => {
      lines.push(`${edu.degree}${edu.field ? ' in ' + edu.field : ''} | ${edu.institution}`)
      lines.push(`${edu.startDate || ''} – ${edu.endDate}`)
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`)
      lines.push('')
    })
  }

  if (schema.projects.length) {
    lines.push('PROJECTS')
    schema.projects.forEach((proj) => {
      lines.push(`${proj.name}${proj.technologies ? ' | ' + proj.technologies : ''}`)
      proj.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }

  if (Object.keys(schema.skills).length) {
    lines.push('SKILLS')
    Object.entries(schema.skills).forEach(([category, skills]) => {
      lines.push(`${category}: ${skills.join(', ')}`)
    })
    lines.push('')
  }

  return lines.join('\n').trim()
}
