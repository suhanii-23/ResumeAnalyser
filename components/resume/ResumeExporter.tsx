'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResumeSchema } from '@/lib/resume-schema'

interface ResumeExporterProps {
  schema: ResumeSchema
  resumeText?: string  // if provided, export this text instead of rebuilding from schema
  filename?: string
}

export function ResumeExporter({ schema, resumeText, filename = 'resume' }: ResumeExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportTXT = () => {
    const text = resumeText || schemaToPlainText(schema)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    setIsExporting(true)
    try {
      const text = resumeText || schemaToPlainText(schema)
      const html = buildTextResumeHTML(text)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow popups to export PDF')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={exportTXT}>
        <FileText className="w-3.5 h-3.5 mr-1.5" />
        TXT
      </Button>
      <Button variant="secondary" size="sm" onClick={exportPDF} disabled={isExporting}>
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 mr-1.5" />
        )}
        PDF
      </Button>
    </div>
  )
}

function schemaToPlainText(schema: ResumeSchema): string {
  const lines: string[] = []
  if (schema.contact.name) {
    lines.push(schema.contact.name)
    const contact = [schema.contact.email, schema.contact.phone, schema.contact.location].filter(Boolean).join(' | ')
    if (contact) lines.push(contact)
    lines.push('')
  }
  if (schema.summary) { lines.push('SUMMARY'); lines.push(schema.summary); lines.push('') }
  if (schema.experience.length) {
    lines.push('EXPERIENCE')
    schema.experience.forEach((e) => {
      lines.push(`${e.title} — ${e.company} (${e.startDate}–${e.endDate})`)
      e.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }
  if (schema.education.length) {
    lines.push('EDUCATION')
    schema.education.forEach((e) => {
      lines.push(`${e.degree} — ${e.institution} (${e.endDate})`)
    })
    lines.push('')
  }
  if (schema.projects.length) {
    lines.push('PROJECTS')
    schema.projects.forEach((p) => {
      lines.push(`${p.name}`)
      p.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }
  if (Object.keys(schema.skills).length) {
    lines.push('SKILLS')
    Object.entries(schema.skills).forEach(([cat, skills]) => {
      lines.push(`${cat}: ${skills.join(', ')}`)
    })
  }
  return lines.join('\n')
}

function buildTextResumeHTML(text: string): string {
  // Render as preformatted text preserving all original formatting
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Resume</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #111827; margin: 0; padding: 0; }
  .page { max-width: 780px; margin: 0 auto; padding: 40px 48px; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 11pt; line-height: 1.5; margin: 0; }
  @media print { body { margin: 0; } }
</style>
</head>
<body><div class="page"><pre>${escaped}</pre></div></body>
</html>`
}
