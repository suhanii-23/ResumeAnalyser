'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoastV4, V4LineRoast, V4SectionRoast, V4MajorCallout, RoastVerdict } from '@/lib/resume-schema'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TextItem {
  str: string
  x: number
  y: number
  w: number
  h: number
}

interface PlacedMark {
  // Where the target text lives on canvas
  textX: number; textY: number; textW: number; textH: number
  // Which mark to draw on the text
  markType: V4LineRoast['markType']
}

interface PlacedComment {
  text: string          // what to write
  x: number; y: number // where to draw it
  rotation: number
  fontSize: number
  color: string
  alpha: number
  // optional arrow back to the text
  arrowToX?: number; arrowToY?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded RNG
// ─────────────────────────────────────────────────────────────────────────────

function rng(seed: number) {
  let s = (seed * 1664525 + 1013904223) & 0xffffffff
  const next = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
  return next
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing primitives — everything wobbly on purpose
// ─────────────────────────────────────────────────────────────────────────────

function jitter(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, r: () => number) {
  const steps = Math.max(6, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8))
  ctx.beginPath()
  ctx.moveTo(x1 + r() * 2 - 1, y1 + r() * 2 - 1)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    ctx.lineTo(
      x1 + (x2 - x1) * t + (r() * 5 - 2.5),
      y1 + (y2 - y1) * t + (r() * 5 - 2.5),
    )
  }
  ctx.stroke()
}

function wobbleCircle(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, r: () => number
) {
  ctx.beginPath()
  let first = true
  for (let deg = 0; deg <= 375; deg += 5) {
    const θ = (deg * Math.PI) / 180
    const wobble = 1 + (r() - 0.5) * 0.22
    const x = cx + rx * wobble * Math.cos(θ)
    const y = cy + ry * wobble * Math.sin(θ)
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    first = false
  }
  ctx.stroke()
}

function waveUnderline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, r: () => number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  const waves = Math.max(4, Math.round(w / 10))
  for (let i = 1; i <= waves; i++) {
    const px = x + (w / waves) * i
    const py = y + (i % 2 === 0 ? 4 : -4) + (r() * 2 - 1)
    ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function roughBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number) {
  // Draw as four separate wobbly lines
  ctx.beginPath()
  ctx.moveTo(x + r() * 2, y + r() * 2)
  ctx.lineTo(x + w + r() * 2, y + r() * 2)
  ctx.lineTo(x + w + r() * 2, y + h + r() * 2)
  ctx.lineTo(x + r() * 2, y + h + r() * 2)
  ctx.closePath()
  ctx.stroke()
}

function curvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  r: () => number
) {
  const mx = (x1 + x2) / 2 + (r() * 50 - 25)
  const my = (y1 + y2) / 2 + (r() * 30 - 15)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(mx, my, x2, y2)
  ctx.stroke()
  // arrowhead
  const angle = Math.atan2(y2 - my, x2 - mx)
  const sz = 9
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - sz * Math.cos(angle - 0.45), y2 - sz * Math.sin(angle - 0.45))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - sz * Math.cos(angle + 0.45), y2 - sz * Math.sin(angle + 0.45))
  ctx.stroke()
}

function stampText(
  ctx: CanvasRenderingContext2D,
  text: string, cx: number, cy: number,
  rotation: number, fontSize: number,
  color: string, alpha: number, font: string
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.globalAlpha = alpha
  ctx.font = `900 ${fontSize}px "${font}", cursive`
  const mw = ctx.measureText(text).width
  const pad = 14
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(3, fontSize / 14)
  ctx.strokeRect(-mw / 2 - pad, -fontSize - 2, mw + pad * 2, fontSize + 18)
  ctx.fillStyle = color
  ctx.fillText(text, -mw / 2, 0)
  ctx.restore()
}

function handText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  rotation: number, fontSize: number,
  color: string, alpha: number, font: string
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "${font}", cursive`
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// Text search
// ─────────────────────────────────────────────────────────────────────────────

function findText(items: TextItem[], target: string): TextItem | null {
  if (!target?.trim() || target.length < 3) return null
  const tl = target.toLowerCase().trim()
  // exact substring match
  for (const it of items) {
    if (it.str.toLowerCase().includes(tl.slice(0, 30))) return it
  }
  // first 15 chars
  const short = tl.slice(0, 15)
  for (const it of items) {
    if (it.str.toLowerCase().includes(short)) return it
  }
  // first word
  const word = tl.split(/\s+/)[0]
  if (word.length >= 4) {
    for (const it of items) {
      if (it.str.toLowerCase().includes(word)) return it
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-only renderer: returns list of TextItems for each rendered line
// ─────────────────────────────────────────────────────────────────────────────

function renderTextResume(ctx: CanvasRenderingContext2D, text: string, W: number): TextItem[] {
  const items: TextItem[] = []
  const margin = 68
  const maxW = W - margin * 2
  const baseFontSize = 13
  const lineH = baseFontSize * 1.7

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, 10000)

  let y = 65
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) { y += lineH * 0.45; continue }

    const isHeading = /^[A-Z][A-Z\s\-]+$/.test(line.trim()) && line.trim().length < 35
    const isBullet = /^[•\-◦▪–]/.test(line.trim())
    const isFirstLine = y < 100

    const fontSize = isFirstLine ? 20 : isHeading ? 14 : baseFontSize
    const weight = isHeading || isFirstLine ? 'bold' : 'normal'
    ctx.font = `${weight} ${fontSize}px Georgia, serif`
    ctx.fillStyle = '#111'

    if (isHeading && y > 70) {
      y += 4
      ctx.strokeStyle = '#bbb'
      ctx.lineWidth = 0.7
      ctx.beginPath(); ctx.moveTo(margin, y + 3); ctx.lineTo(margin + maxW, y + 3); ctx.stroke()
    }

    // Word wrap
    const words = line.split(' ')
    let cur = ''
    const wrapped: string[] = []
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (ctx.measureText(test).width > maxW) { wrapped.push(cur); cur = w }
      else cur = test
    }
    if (cur) wrapped.push(cur)

    for (const wl of wrapped) {
      ctx.fillStyle = '#111'
      ctx.fillText(wl, isBullet ? margin + 12 : margin, y)
      const mw = ctx.measureText(wl).width
      items.push({ str: wl, x: isBullet ? margin + 12 : margin, y: y - fontSize, w: mw, h: fontSize + 4 })
      y += lineH * (fontSize / baseFontSize)
    }
    if (isHeading) y += 3
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// Placement engine
// ─────────────────────────────────────────────────────────────────────────────

interface AnnotationJob {
  text: string
  level: 1 | 2 | 3 | 4
  targetText?: string
  markType?: V4LineRoast['markType']
}

interface PlacedResult {
  marks: PlacedMark[]
  comments: PlacedComment[]
}

const RED = '#cc0000'
const DARK_RED = '#a30000'
const ORANGE_RED = '#d94000'

function levelColor(level: number): string {
  if (level === 1) return RED
  if (level === 2) return DARK_RED
  if (level === 3) return '#b30000'
  return ORANGE_RED
}

function levelFontSize(level: number): number {
  if (level === 1) return 52
  if (level === 2) return 32
  if (level === 3) return 18
  return 13
}

function levelAlpha(level: number): number {
  if (level === 1) return 0.72
  if (level === 2) return 0.88
  if (level === 3) return 0.92
  return 0.85
}

/**
 * Given a list of annotation jobs and available text items,
 * returns placed marks + comment positions.
 * Comments alternate left/right margin with arrow back to text.
 */
function placeAnnotations(
  jobs: AnnotationJob[],
  items: TextItem[],
  canvasW: number,
  canvasH: number,
): PlacedResult {
  const marks: PlacedMark[] = []
  const comments: PlacedComment[] = []

  // Track vertical cursors per column to avoid overlap
  const leftCursor = { y: 80 }
  const rightCursor = { y: 80 }
  const marginW = 62  // width of each margin column

  // Stamps are placed in a grid across the page
  let stampIndex = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    const r = rng(i * 997 + 13)
    const color = levelColor(job.level)
    const fontSize = levelFontSize(job.level)
    const alpha = levelAlpha(job.level)

    if (job.level === 1) {
      // ── Giant stamp: placed at fixed positions across the page ──────────────
      const stampPositions = [
        { x: canvasW * 0.72, y: canvasH * 0.12 },
        { x: canvasW * 0.22, y: canvasH * 0.55 },
        { x: canvasW * 0.65, y: canvasH * 0.78 },
      ]
      const pos = stampPositions[stampIndex % stampPositions.length]
      stampIndex++
      const rotation = (r() - 0.5) * 28 - 12  // -26 to +2 degrees
      comments.push({
        text: job.text, x: pos.x, y: pos.y,
        rotation, fontSize, color, alpha,
      })
      continue
    }

    // ── Find where the target text lives ─────────────────────────────────────
    const found = job.targetText ? findText(items, job.targetText) : null

    if (found) {
      // Draw a mark on the text itself
      if (job.markType) {
        marks.push({
          textX: found.x, textY: found.y,
          textW: found.w, textH: found.h,
          markType: job.markType,
        })
      }

      // Choose which margin (alternate, pick whichever is lower)
      const useLeft = leftCursor.y <= rightCursor.y
      const commentX = useLeft
        ? marginW - fontSize * 0.4
        : canvasW - marginW + 4

      // Place comment at the text's y-level but respect the cursor
      const targetY = found.y + found.h / 2
      const minY = useLeft ? leftCursor.y : rightCursor.y
      const commentY = Math.max(targetY, minY + (job.level === 2 ? 50 : 28))

      if (useLeft) leftCursor.y = commentY + fontSize + 8
      else rightCursor.y = commentY + fontSize + 8

      const rotation = (r() - 0.5) * (job.level === 2 ? 18 : 12)
      const arrowFromX = useLeft ? commentX + fontSize * 0.5 : commentX
      const arrowToX = found.x + (useLeft ? 0 : found.w)

      comments.push({
        text: job.text,
        x: commentX, y: commentY,
        rotation, fontSize, color, alpha,
        arrowToX: arrowToX + (useLeft ? -3 : 3),
        arrowToY: found.y + found.h / 2 + (r() - 0.5) * 4,
      })
    } else {
      // No text found — scatter in available margin space
      const useLeft = leftCursor.y <= rightCursor.y
      const commentX = useLeft ? 8 : canvasW - marginW
      const commentY = useLeft ? leftCursor.y + 15 : rightCursor.y + 15

      if (useLeft) leftCursor.y = commentY + fontSize + (job.level < 3 ? 44 : 22)
      else rightCursor.y = commentY + fontSize + (job.level < 3 ? 44 : 22)

      const rotation = (r() - 0.5) * 15

      // Place scattered inside the text area too if margins are full
      const overflow = Math.max(leftCursor.y, rightCursor.y) > canvasH * 0.85
      const scatterX = overflow ? 90 + r() * (canvasW - 200) : commentX
      const scatterY = overflow
        ? 120 + r() * (canvasH * 0.7)
        : commentY

      comments.push({
        text: job.text, x: scatterX, y: scatterY,
        rotation, fontSize, color, alpha,
      })
    }
  }

  return { marks, comments }
}

// ─────────────────────────────────────────────────────────────────────────────
// Draw everything onto the canvas
// ─────────────────────────────────────────────────────────────────────────────

function drawAll(
  ctx: CanvasRenderingContext2D,
  marks: PlacedMark[],
  comments: PlacedComment[],
  font: string,
) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // ── Draw text marks first (underlines, circles, strikethroughs) ─────────────
  ctx.strokeStyle = RED
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i]
    const r = rng(i * 333 + 1)
    ctx.strokeStyle = levelColor(3)
    ctx.lineWidth = 2.2
    ctx.globalAlpha = 0.9

    const { textX: x, textY: y, textW: w, textH: h } = m
    const cy = y + h / 2
    const by = y + h + 3

    switch (m.markType) {
      case 'circle':
        ctx.lineWidth = 2.5
        wobbleCircle(ctx, x + w / 2, cy, w / 2 + 8, h / 2 + 7, r)
        break
      case 'underline':
        waveUnderline(ctx, x - 2, by, w + 4, r)
        break
      case 'strikethrough':
        jitter(ctx, x - 2, cy, x + w + 2, cy + (r() * 3 - 1.5), r)
        break
      case 'box':
        ctx.lineWidth = 2
        roughBox(ctx, x - 4, y - 2, w + 8, h + 6, r)
        break
    }
    ctx.globalAlpha = 1
  }

  // ── Draw arrows from comments to text ────────────────────────────────────────
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i]
    if (c.arrowToX == null || c.arrowToY == null) continue
    const r = rng(i * 441 + 7)
    ctx.strokeStyle = c.color
    ctx.lineWidth = 1.6
    ctx.globalAlpha = c.alpha * 0.75
    curvedArrow(ctx, c.x, c.y, c.arrowToX, c.arrowToY, r)
    ctx.globalAlpha = 1
  }

  // ── Draw comment text ────────────────────────────────────────────────────────
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i]
    const isStamp = c.fontSize >= 45

    if (isStamp) {
      // Stamps get the hollow border treatment
      stampText(ctx, c.text, c.x, c.y, c.rotation, c.fontSize, c.color, c.alpha, font)
    } else {
      // Regular handwritten text, possibly multi-line
      const lines = wrapText(ctx, c.text, c.fontSize, font, c.fontSize <= 16 ? 130 : 200)
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate((c.rotation * Math.PI) / 180)
      ctx.globalAlpha = c.alpha
      ctx.fillStyle = c.color
      ctx.font = `bold ${c.fontSize}px "${font}", cursive`
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], 0, li * (c.fontSize + 3))
      }
      ctx.restore()
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, fontSize: number, font: string, maxW: number): string[] {
  ctx.font = `bold ${fontSize}px "${font}", cursive`
  if (ctx.measureText(text).width <= maxW) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxW) { lines.push(cur); cur = w }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [text]
}

// ─────────────────────────────────────────────────────────────────────────────
// Build job list from RoastV4 data
// ─────────────────────────────────────────────────────────────────────────────

function buildJobs(data: RoastV4, canvasH: number): AnnotationJob[] {
  const jobs: AnnotationJob[] = []

  // Level 1 — stamps
  for (const mc of data.majorCallouts || []) {
    jobs.push({ text: mc.text, level: 1 })
  }

  // Level 2 — section callouts
  for (const sr of data.sectionRoasts || []) {
    jobs.push({ text: sr.callout, level: sr.level as 2 | 3, targetText: sr.section })
  }

  // Level 2/3/4 — line roasts (the bulk)
  for (const lr of data.lineRoasts || []) {
    jobs.push({
      text: lr.comment,
      level: lr.level as 2 | 3 | 4,
      targetText: lr.targetText,
      markType: lr.markType,
    })
  }

  // ATS roasts as level 4 teacher notes — scattered
  for (const ar of data.atsRoasts || []) {
    jobs.push({
      text: `Missing: "${ar.keyword}"`,
      level: 4,
    })
  }

  // Pad to minimum 25 with recruiter concerns as level 4 notes
  const recruiterConcerns = data.recruiterConcerns || []
  for (let i = 0; jobs.length < 25 && i < recruiterConcerns.length * 3; i++) {
    const concern = recruiterConcerns[i % recruiterConcerns.length]
    jobs.push({ text: concern.slice(0, 40), level: 4 })
  }

  // Pad to minimum 25 with interview question flags
  const qs = data.interviewQuestions || []
  for (let i = 0; jobs.length < 25 && i < qs.length; i++) {
    jobs.push({ text: `Q: ${qs[i].slice(0, 35)}?`, level: 4 })
  }

  void canvasH
  return jobs
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface RoastCanvasProps {
  resumeText: string
  pdfFileUrl?: string
  roastData: RoastV4
}

export function RoastCanvas({ resumeText, pdfFileUrl, roastData }: RoastCanvasProps) {
  const [dataUrl, setDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const font = 'Caveat'

  const render = useCallback(async () => {
    if (!roastData?.lineRoasts?.length) return
    setLoading(true)
    setError('')

    try {
      // Wait for Caveat font to be loaded
      await document.fonts.ready

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let items: TextItem[] = []

      if (pdfFileUrl) {
        // ── PDF path ────────────────────────────────────────────────────────
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const resp = await fetch(pdfFileUrl)
        const buf = await resp.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        const page = await pdf.getPage(1)
        const scale = 2.2
        const vp = page.getViewport({ scale })
        canvas.width = vp.width
        canvas.height = vp.height

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas: canvas as any, canvasContext: ctx, viewport: vp } as any).promise

        // Extract text item positions
        const tc = await page.getTextContent()
        for (const raw of tc.items as Array<{ str: string; transform: number[]; width: number; height: number }>) {
          if (!raw.str?.trim()) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [vx, vy] = (vp as any).convertToViewportPoint(raw.transform[4], raw.transform[5])
          items.push({
            str: raw.str,
            x: vx,
            y: vy - raw.height * scale - 2,
            w: raw.width * scale,
            h: raw.height * scale + 4,
          })
        }
      } else {
        // ── Text-only path ──────────────────────────────────────────────────
        canvas.width = 720
        canvas.height = 10000  // will trim

        items = renderTextResume(ctx, resumeText, canvas.width)

        // Trim canvas height
        const maxY = items.reduce((m, it) => Math.max(m, it.y + it.h), 0)
        const finalH = Math.max(900, maxY + 80)
        const imgData = ctx.getImageData(0, 0, canvas.width, finalH)
        canvas.height = finalH
        ctx.putImageData(imgData, 0, 0)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, maxY + 4, canvas.width, finalH)
      }

      // ── Build + place annotations ──────────────────────────────────────────
      const jobs = buildJobs(roastData, canvas.height)
      const { marks, comments } = placeAnnotations(jobs, items, canvas.width, canvas.height)

      // ── Draw everything ────────────────────────────────────────────────────
      drawAll(ctx, marks, comments, font)

      setDataUrl(canvas.toDataURL('image/png', 0.93))
    } catch (e) {
      console.error('RoastCanvas error:', e)
      setError('Could not render — try again.')
    } finally {
      setLoading(false)
    }
  }, [pdfFileUrl, resumeText, roastData, font])

  useEffect(() => {
    render()
  }, [render])

  const download = () => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'resume-roasted.png'
    a.click()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--text-muted)]">
      <Loader2 className="w-5 h-5 animate-spin" />
      <p className="text-xs">Sharpening the red pen…</p>
    </div>
  )

  if (error) return (
    <div className="text-center py-10">
      <p className="text-xs text-red-400 mb-3">{error}</p>
      <Button size="sm" variant="outline" onClick={render}>
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Retry
      </Button>
    </div>
  )

  if (!dataUrl) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-faint)]">
          {pdfFileUrl ? 'Your PDF — destroyed with a red Sharpie' : 'Resume text — annotated (upload PDF for better fidelity)'}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Save PNG
          </Button>
          <Button size="sm" variant="outline" onClick={render} title="Re-render">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-[var(--border)] shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="Annotated resume" className="w-full block" />
      </div>
    </div>
  )
}
