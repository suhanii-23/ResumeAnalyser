'use client'

import { ResumeSchema } from '@/lib/resume-schema'

interface ResumeRendererProps {
  schema: ResumeSchema
  highlights?: string[]  // text substrings to highlight (for diff/suggestions)
  className?: string
}

function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return <span>{text}</span>

  let remaining = text
  const parts: Array<{ text: string; highlight: boolean }> = []

  highlights.forEach((h) => {
    const idx = remaining.toLowerCase().indexOf(h.toLowerCase())
    if (idx !== -1) {
      if (idx > 0) parts.push({ text: remaining.slice(0, idx), highlight: false })
      parts.push({ text: remaining.slice(idx, idx + h.length), highlight: true })
      remaining = remaining.slice(idx + h.length)
    }
  })
  if (remaining) parts.push({ text: remaining, highlight: false })

  if (!parts.length) return <span>{text}</span>

  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark key={i} className="resume-highlight">{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  )
}

export function ResumeRenderer({ schema, highlights = [], className = '' }: ResumeRendererProps) {
  const hl = (text: string) => highlightText(text, highlights)

  return (
    <div className={`resume-document ${className}`}>
      {/* Contact */}
      {schema.contact.name && (
        <div className="text-center mb-3">
          <h1>{schema.contact.name}</h1>
          <div className="resume-contact">
            {[
              schema.contact.email,
              schema.contact.phone,
              schema.contact.location,
              schema.contact.linkedin,
              schema.contact.github,
              schema.contact.website,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      )}

      {/* Summary */}
      {schema.summary && (
        <div>
          <div className="resume-section-title">Summary</div>
          <p style={{ fontSize: '10pt' }}>{hl(schema.summary)}</p>
        </div>
      )}

      {/* Experience */}
      {schema.experience.length > 0 && (
        <div>
          <div className="resume-section-title">Experience</div>
          {schema.experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div className="resume-entry-header">
                <div>
                  <span className="resume-entry-title">{exp.title}</span>
                  {exp.company && (
                    <span className="resume-entry-sub">{' — '}{exp.company}</span>
                  )}
                </div>
                <span className="resume-entry-date">
                  {exp.startDate} – {exp.endDate}
                  {exp.location && ` · ${exp.location}`}
                </span>
              </div>
              {exp.bullets.length > 0 && (
                <ul>
                  {exp.bullets.map((b, bi) => (
                    <li key={bi}>{hl(b)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {schema.projects.length > 0 && (
        <div>
          <div className="resume-section-title">Projects</div>
          {schema.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <div className="resume-entry-header">
                <div>
                  <span className="resume-entry-title">{proj.name}</span>
                  {proj.technologies && (
                    <span className="resume-entry-sub"> · {proj.technologies}</span>
                  )}
                </div>
                {proj.date && <span className="resume-entry-date">{proj.date}</span>}
              </div>
              {proj.bullets.length > 0 && (
                <ul>
                  {proj.bullets.map((b, bi) => (
                    <li key={bi}>{hl(b)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {schema.education.length > 0 && (
        <div>
          <div className="resume-section-title">Education</div>
          {schema.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div className="resume-entry-header">
                <div>
                  <span className="resume-entry-title">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </span>
                  <span className="resume-entry-sub"> — {edu.institution}</span>
                </div>
                <span className="resume-entry-date">
                  {edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate}
                </span>
              </div>
              {edu.gpa && <div style={{ fontSize: '9.5pt', color: '#374151' }}>GPA: {edu.gpa}</div>}
              {edu.notes?.length ? (
                <ul>{edu.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {Object.keys(schema.skills).length > 0 && (
        <div>
          <div className="resume-section-title">Skills</div>
          <div className="resume-skills-list">
            {Object.entries(schema.skills).map(([cat, skills]) => (
              <div key={cat} style={{ marginBottom: '3px' }}>
                <strong>{cat}:</strong> {skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {schema.certifications?.length ? (
        <div>
          <div className="resume-section-title">Certifications</div>
          <ul>
            {schema.certifications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
