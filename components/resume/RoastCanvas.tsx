'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoastAnnotation, RoastVerdict } from '@/lib/resume-schema'

interface RoastCanvasProps {
  resumeText: string
  pdfFileUrl?: string
  annotations: RoastAnnotation[]
  roastScore?: number
  roastScoreMeaning?: string
  overallVerdict?: string
  funniesLine?: string
  biggestMissedOpportunity?: string
  verdict?: RoastVerdict
}

// ── Seeded pseudo-random so annotations stay stable on re-render ──────────────
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ── Drawing primitives ────────────────────────────────────────────────────────

function roughLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  rng: () => number
) {
  ctx.beginPath()
  ctx.moveTo(x1 + rng() * 2 - 1, y1 + rng() * 2 - 1)
  const steps = Math.max(8, Math.round(Math.hypot(x2 - x1, y2 - y1) / 6))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    ctx.lineTo(
      x1 + (x2 - x1) * t + (rng() * 4 - 2),
      y1 + (y2 - y1) * t + (rng() * 4 - 2)
    )
  }
  ctx.stroke()
}

function roughCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  rng: () => number
) {
  ctx.beginPath()
  let first = true
  for (let deg = 0; deg <= 370; deg += 4) {
    const angle = (deg * Math.PI) / 180
    const wobble = 1 + (rng() - 0.5) * 0.18
    const x = cx + rx * wobble * Math.cos(angle)
    const y = cy + ry * wobble * Math.sin(angle)
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    first = false
  }
  ctx.stroke()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  rng: () => number
) {
  // Curved arrow
  const mx = (x1 + x2) / 2 + (rng() * 40 - 20)
  const my = (y1 + y2) / 2 + (rng() * 40 - 20)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(mx, my, x2, y2)
  ctx.stroke()
  // Arrowhead
  const angle = Math.atan2(y2 - my, x2 - mx)
  const size = 10
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - size * Math.cos(angle - 0.4),
    y2 - size * Math.sin(angle - 0.4)
  )
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - size * Math.cos(angle + 0.4),
    y2 - size * Math.sin(angle + 0.4)
  )
  ctx.stroke()
}

function drawWavedUnderline(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  rng: () => number
) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  const waves = Math.max(3, Math.round(width / 12))
  for (let i = 0; i <= waves; i++) {
    const px = x + (width / waves) * i
    const py = y + (i % 2 === 0 ? 3 : -3) + (rng() * 2 - 1)
    ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function drawStrikethrough(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  rng: () => number
) {
  roughLine(ctx, x, y, x + width, y + (rng() * 4 - 2), rng)
}

function drawHandwrittenText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  fontSize: number,
  rotation: number,
  color: string,
  font: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "${font}", cursive`
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  rotation: number,
  fontSize: number,
  color: string,
  font: string
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((rotation * Math.PI) / 180)

  // Measure text for border
  ctx.font = `900 ${fontSize}px "${font}", cursive`
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const pad = 12

  // Hollow stamp border
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.82
  ctx.strokeRect(-tw / 2 - pad, -fontSize - 4, tw + pad * 2, fontSize + 18)

  // Text
  ctx.fillStyle = color
  ctx.fillText(text, -tw / 2, 0)
  ctx.restore()
}

// ── Text renderer for text-only fallback ──────────────────────────────────────

interface TextBlock { text: string; x: number; y: number; w: number; h: number; fontSize: number }

function renderResumeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number
): TextBlock[] {
  const blocks: TextBlock[] = []
  const lines = text.split('\n')
  const margin = 72
  const maxWidth = canvasWidth - margin * 2
  let y = 60
  const baseFont = 13
  const lineH = baseFont * 1.65

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvasWidth, 9999) // filled dynamically

  for (const raw of lines) {
    const line = raw.trimEnd()
    const isEmpty = line.trim() === ''

    if (isEmpty) { y += lineH * 0.5; continue }

    // Detect headings (all-caps short lines)
    const isHeading = /^[A-Z][A-Z\s]+$/.test(line.trim()) && line.trim().length < 30
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('◦')
    const isName = y < 120 && !isBullet

    const fontSize = isName ? 22 : isHeading ? 14 : baseFont
    const fontWeight = isHeading || isName ? 'bold' : 'normal'
    ctx.font = `${fontWeight} ${fontSize}px Georgia, serif`
    ctx.fillStyle = '#111'

    // Word wrap
    const words = line.split(' ')
    let currentLine = ''
    const wrappedLines: string[] = []
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth) {
        wrappedLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = test
      }
    }
    if (currentLine) wrappedLines.push(currentLine)

    if (isHeading) {
      y += 4
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 0.8
      const hw = Math.min(ctx.measureText(line.trim()).width + 20, maxWidth)
      ctx.beginPath()
      ctx.moveTo(margin, y + 4)
      ctx.lineTo(margin + hw, y + 4)
      ctx.stroke()
    }

    for (const wl of wrappedLines) {
      ctx.fillStyle = '#111'
      ctx.fillText(wl, margin, y)
      const w = ctx.measureText(wl).width
      blocks.push({ text: wl, x: margin, y: y - fontSize, w, h: fontSize + 4, fontSize })
      y += lineH * (fontSize / baseFont)
    }

    if (isHeading) y += 2
  }

  return blocks
}

// ── Find anchor text in rendered blocks ───────────────────────────────────────

function findTextPosition(
  blocks: TextBlock[],
  anchor: string,
  canvasWidth: number,
  canvasHeight: number,
  rng: () => number
): { x: number; y: number; w: number; h: number } | null {
  if (!anchor || anchor.length < 3) return null

  const anchorLower = anchor.toLowerCase().trim().slice(0, 40)

  for (const block of blocks) {
    if (block.text.toLowerCase().includes(anchorLower.slice(0, 20))) {
      return { x: block.x, y: block.y, w: block.w, h: block.h }
    }
  }

  // Fuzzy: first 15 chars
  const short = anchorLower.slice(0, 15)
  for (const block of blocks) {
    if (block.text.toLowerCase().includes(short)) {
      return { x: block.x, y: block.y, w: block.w, h: block.h }
    }
  }

  // Fallback: random position in page content area
  return {
    x: 80 + rng() * (canvasWidth - 200),
    y: 120 + rng() * (canvasHeight - 300),
    w: 180, h: 14,
  }
}

// ── Find text in pdfjs text items ─────────────────────────────────────────────

interface PdfTextItem {
  str: string
  transform: number[]
  width: number
  height: number
}

function findAnchorInPdfItems(
  items: PdfTextItem[],
  anchor: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewport: { width: number; height: number; convertToViewportPoint: (x: number, y: number) => any },
  scale: number,
  rng: () => number
): { x: number; y: number; w: number; h: number } | null {
  if (!anchor || anchor.length < 3) return null

  const al = anchor.toLowerCase().trim()

  // Try to find item containing the anchor text
  for (const item of items) {
    if (!item.str?.trim()) continue
    if (item.str.toLowerCase().includes(al.slice(0, 20))) {
      const [cx, cy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5])
      return { x: cx - 2, y: cy - item.height * scale - 4, w: item.width * scale + 4, h: item.height * scale + 8 }
    }
  }

  // Fuzzy: first 12 chars
  const short = al.slice(0, 12)
  for (const item of items) {
    if (item.str?.toLowerCase().includes(short)) {
      const [cx, cy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5])
      return { x: cx - 2, y: cy - item.height * scale - 4, w: item.width * scale + 4, h: item.height * scale + 8 }
    }
  }

  return null
}

// ── Main annotation drawing ───────────────────────────────────────────────────

type AnnotationStyle = 'stamp' | 'circle' | 'underline' | 'strikethrough' | 'arrow-comment' | 'margin-note'

function getAnnotationStyle(ann: RoastAnnotation, idx: number): AnnotationStyle {
  if (ann.severity === 'fatal') return idx % 2 === 0 ? 'stamp' : 'circle'
  if (ann.severity === 'error') return idx % 3 === 0 ? 'arrow-comment' : 'circle'
  if (ann.severity === 'warning') return idx % 2 === 0 ? 'underline' : 'margin-note'
  return 'margin-note'
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'fatal':   return '#cc0000'
    case 'error':   return '#d9500a'
    case 'warning': return '#c98400'
    default:        return '#1a3aaa'
  }
}

// Short punchy callout versions of comments
function shortCallout(comment: string, severity: string): string {
  const punchy: Record<string, string[]> = {
    fatal: ['REJECTED', 'NO.', 'DELETE THIS.', 'PROVE IT.', 'VAGUE.', 'WRONG.'],
    error: ['WHERE ARE THE NUMBERS?', 'THIS TELLS ME NOTHING.', 'HOW MANY USERS?', 'WHAT IMPACT?', 'WHICH TECH?'],
    warning: ['BUZZWORD SOUP.', 'TOO VAGUE.', 'NO METRICS.', 'SHOW DON\'T TELL.'],
    note: ['?', 'Elaborate.', 'So what?', 'Specifics?'],
  }

  // Try to extract key phrase from the actual comment
  const lower = comment.toLowerCase()
  if (lower.includes('metric') || lower.includes('number')) return 'WHERE ARE THE NUMBERS?'
  if (lower.includes('vague') || lower.includes('nothing')) return 'THIS TELLS ME NOTHING.'
  if (lower.includes('buzzword') || lower.includes('generic')) return 'BUZZWORD SOUP.'
  if (lower.includes('crud') || lower.includes('tutorial')) return 'ANOTHER CRUD APP.'
  if (lower.includes('prove') || lower.includes('evidence')) return 'PROVE IT.'
  if (lower.includes('impact') || lower.includes('achieve')) return 'WHAT IMPACT?'
  if (lower.includes('passionate') || lower.includes('hardworking')) return 'EVERYONE SAYS THIS.'
  if (lower.includes('skill') || lower.includes('dump') || lower.includes('list')) return 'MASTER OF NONE?'
  if (lower.includes('lead') || lower.includes('senior')) return 'PROVE THE LEADERSHIP.'
  if (lower.includes('api')) return 'WHICH API? REST? GRAPHQL?'
  if (lower.includes('user') || lower.includes('scale')) return 'FOR HOW MANY USERS?'

  // Fallback to first 30 chars of comment, uppercased for fatal/error
  const truncated = comment.slice(0, 28).replace(/['"]/g, '')
  return severity === 'fatal' || severity === 'error' ? truncated.toUpperCase() + '.' : truncated + '.'
}

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: RoastAnnotation[],
  positions: Array<{ x: number; y: number; w: number; h: number } | null>,
  canvasWidth: number,
  canvasHeight: number,
  roastScore: number | undefined,
  overallVerdict: string | undefined,
  font: string
) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  annotations.forEach((ann, idx) => {
    const rng = makeRng(idx * 999 + 7)
    const pos = positions[idx]
    const color = getSeverityColor(ann.severity)
    const style = getAnnotationStyle(ann, idx)
    const callout = shortCallout(ann.comment, ann.severity)

    ctx.strokeStyle = color
    ctx.fillStyle = color

    if (!pos) {
      // Place in margin/random
      const cx = 40 + rng() * 60
      const cy = 100 + (idx / annotations.length) * (canvasHeight - 200)
      drawHandwrittenText(ctx, callout.slice(0, 20), cx, cy, 12, (rng() - 0.5) * 20, color, font)
      return
    }

    const { x, y, w, h } = pos

    if (style === 'stamp') {
      // Big diagonal stamp
      const size = ann.severity === 'fatal' ? 36 : 28
      const rot = (rng() - 0.5) * 24 - 10
      ctx.lineWidth = 3.5
      drawStamp(ctx, callout, x + w / 2, y + h / 2, rot, size, color, font)

    } else if (style === 'circle') {
      // Circle around the text + side note
      ctx.lineWidth = 2.5
      const rx = w / 2 + 8 + rng() * 4
      const ry = h / 2 + 8 + rng() * 3
      roughCircle(ctx, x + w / 2, y + h / 2, rx, ry, rng)

      // Arrow to comment in margin/nearby
      const commentX = rng() > 0.5
        ? x + w + 20 + rng() * 60
        : x - 20 - rng() * 80
      const commentY = y - 10 + (rng() - 0.5) * 30
      ctx.lineWidth = 1.8
      drawArrow(ctx, x + w / 2, y - ry + 4, commentX, commentY, rng)
      const rot = (rng() - 0.5) * 18
      drawHandwrittenText(ctx, callout, commentX, commentY, ann.severity === 'error' ? 15 : 13, rot, color, font)

    } else if (style === 'underline') {
      // Wavy underline
      ctx.lineWidth = 2.5
      drawWavedUnderline(ctx, x, y + h + 3, w, rng)
      // Small margin note
      const noteX = x + w + 10 + rng() * 20
      const noteY = y + h / 2
      const rot = (rng() - 0.5) * 15
      drawHandwrittenText(ctx, callout.slice(0, 22), noteX, noteY, 12, rot, color, font)

    } else if (style === 'strikethrough') {
      // Strike through + note above
      ctx.lineWidth = 2.5
      drawStrikethrough(ctx, x, y + h / 2, w, rng)
      const rot = (rng() - 0.5) * 16
      drawHandwrittenText(ctx, callout, x, y - 6, 13, rot, color, font)

    } else if (style === 'arrow-comment') {
      // Arrow from side pointing to text + big comment
      const fromX = rng() > 0.5 ? x + w + 30 + rng() * 80 : x - 30 - rng() * 80
      const fromY = y + h / 2 + (rng() - 0.5) * 20
      ctx.lineWidth = 2.2
      drawArrow(ctx, fromX, fromY, x + rng() * w, y + h / 2, rng)
      const rot = (rng() - 0.5) * 22
      const fsize = ann.severity === 'error' ? 16 : 14
      drawHandwrittenText(ctx, callout, fromX, fromY - 5, fsize, rot, color, font)

    } else {
      // margin-note: small note with short line
      const noteX = x + w + 8
      const noteY = y + h / 2 + (rng() - 0.5) * 10
      ctx.lineWidth = 1.5
      roughLine(ctx, x + w, y + h / 2, noteX - 4, noteY, rng)
      const rot = (rng() - 0.5) * 14
      drawHandwrittenText(ctx, callout.slice(0, 25), noteX, noteY + 4, 12, rot, color, font)
    }
  })

  // Draw overall roast score if available
  if (roastScore != null) {
    const scoreColor = roastScore >= 8 ? '#16a34a' : roastScore >= 5 ? '#d97706' : '#cc0000'
    ctx.save()
    ctx.translate(canvasWidth - 100, 60)
    ctx.rotate(-0.2)
    ctx.font = `900 42px "${font}", cursive`
    ctx.fillStyle = scoreColor
    ctx.globalAlpha = 0.9
    ctx.fillText(`${roastScore.toFixed(1)}/10`, 0, 0)
    ctx.font = `bold 14px "${font}", cursive`
    ctx.fillText('ROAST SCORE', 0, 20)
    ctx.restore()
  }

  // Overall verdict banner at bottom
  if (overallVerdict) {
    ctx.save()
    ctx.font = `bold 16px "${font}", cursive`
    ctx.fillStyle = '#cc0000'
    ctx.globalAlpha = 0.85
    ctx.translate(60, canvasHeight - 30)
    ctx.rotate(-0.015)
    ctx.fillText(`📝 ${overallVerdict.slice(0, 80)}`, 0, 0)
    ctx.restore()
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function RoastCanvas({
  resumeText, pdfFileUrl, annotations,
  roastScore, overallVerdict,
}: RoastCanvasProps) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLImageElement>(null)

  const font = 'Caveat'

  const render = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      let positions: Array<{ x: number; y: number; w: number; h: number } | null> = []

      if (pdfFileUrl) {
        // ── PDF path ──────────────────────────────────────────────────────────
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const resp = await fetch(pdfFileUrl)
        const arrayBuffer = await resp.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const page = await pdf.getPage(1)
        const scale = 2.2
        const viewport = page.getViewport({ scale })

        canvas.width = viewport.width
        canvas.height = viewport.height

        // Render PDF page (pdfjs v5 requires `canvas` prop)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas: canvas as any, canvasContext: ctx, viewport } as any).promise

        // Get text positions
        const textContent = await page.getTextContent()
        const items = textContent.items as PdfTextItem[]

        positions = annotations.map((ann, idx) => {
          const rng = makeRng(idx * 31)
          return findAnchorInPdfItems(items, ann.targetText, viewport, scale, rng)
        })

      } else {
        // ── Text-only path ────────────────────────────────────────────────────
        canvas.width = 720
        canvas.height = 1080

        // Draw white background
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Render resume text and collect block positions
        const blocks = renderResumeText(ctx, resumeText, canvas.width)

        // Resize canvas height to content
        const maxY = blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0) + 80
        const finalH = Math.max(1080, maxY + 60)
        const imgData = ctx.getImageData(0, 0, canvas.width, finalH)
        canvas.height = finalH
        ctx.putImageData(imgData, 0, 0)
        // Re-draw white bg for newly revealed area
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, maxY, canvas.width, finalH - maxY)

        positions = annotations.map((ann, idx) => {
          const rng = makeRng(idx * 17)
          return findTextPosition(blocks, ann.targetText, canvas.width, canvas.height, rng)
        })
      }

      // ── Draw all annotations on canvas ────────────────────────────────────
      drawAnnotations(
        ctx, annotations, positions,
        canvas.width, canvas.height,
        roastScore, overallVerdict, font
      )

      setDataUrl(canvas.toDataURL('image/png', 0.92))
    } catch (e) {
      console.error('Roast canvas error:', e)
      setError('Could not render annotated resume. Try again.')
    } finally {
      setLoading(false)
    }
  }, [pdfFileUrl, resumeText, annotations, roastScore, overallVerdict, font])

  useEffect(() => {
    if (annotations.length > 0) render()
  }, [render, annotations])

  const downloadPNG = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'resume-roasted.png'
    a.click()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        <p className="text-xs text-[var(--text-muted)]">Drawing red pen marks…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xs text-red-400 mb-3">{error}</p>
        <Button size="sm" variant="outline" onClick={render}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Try again
        </Button>
      </div>
    )
  }

  if (!dataUrl) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-faint)]">
          {pdfFileUrl
            ? 'Your PDF — annotated by a recruiter with a red pen'
            : 'Resume rendered and annotated — upload a PDF for better fidelity'}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadPNG}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Download PNG
          </Button>
          <Button size="sm" variant="outline" onClick={render}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* The annotated image */}
      <div className="rounded-lg overflow-hidden border border-[var(--border)] shadow-2xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={canvasRef}
          src={dataUrl}
          alt="Annotated resume"
          className="w-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}
