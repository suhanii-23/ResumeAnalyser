'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoastV5 } from '@/lib/resume-schema'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }
interface TextBlock extends Rect { text: string }

// ─────────────────────────────────────────────────────────────────────────────
// Seeded RNG — deterministic so annotations don't jump on re-render
// ─────────────────────────────────────────────────────────────────────────────

function mkRng(seed: number) {
  let s = seed | 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s ^= s >>> 16
    return (s >>> 0) / 0xffffffff
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Collision registry — prevents overlapping annotations
// ─────────────────────────────────────────────────────────────────────────────

class Occupied {
  private rects: Rect[] = []

  add(r: Rect) { this.rects.push(r) }

  overlaps(r: Rect, padding = 6): boolean {
    return this.rects.some(
      o =>
        r.x < o.x + o.w + padding &&
        r.x + r.w > o.x - padding &&
        r.y < o.y + o.h + padding &&
        r.y + r.h > o.y - padding
    )
  }

  fits(r: Rect, pageW: number, pageH: number): boolean {
    return (
      r.x >= 0 && r.y >= 0 &&
      r.x + r.w <= pageW &&
      r.y + r.h <= pageH &&
      !this.overlaps(r)
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing primitives
// ─────────────────────────────────────────────────────────────────────────────

function wobbleLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  r: () => number,
  amplitude = 3,
) {
  const steps = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 10))
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    ctx.lineTo(
      x1 + (x2 - x1) * t + (r() * amplitude * 2 - amplitude),
      y1 + (y2 - y1) * t + (r() * amplitude * 2 - amplitude),
    )
  }
  ctx.stroke()
}

function wobbleCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rw: number, rh: number,
  r: () => number,
) {
  ctx.beginPath()
  let first = true
  for (let deg = 0; deg <= 370; deg += 6) {
    const θ = (deg * Math.PI) / 180
    const w = 1 + (r() - 0.5) * 0.18
    const x = cx + rw * w * Math.cos(θ)
    const y = cy + rh * w * Math.sin(θ)
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    first = false
  }
  ctx.stroke()
}

function waveUnderline(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  r: () => number,
) {
  const count = Math.max(3, Math.round(w / 12))
  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let i = 1; i <= count; i++) {
    const px = x + (w / count) * i
    const py = y + (i % 2 === 0 ? 4 : -4) + (r() * 2 - 1)
    ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function strikeThrough(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  r: () => number,
) {
  wobbleLine(ctx, x - 2, y, x + w + 2, y + (r() * 3 - 1.5), r, 2)
}

function curvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  r: () => number,
) {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  if (dist < 20) return
  const mx = (x1 + x2) / 2 + (r() * 40 - 20)
  const my = (y1 + y2) / 2 + (r() * 24 - 12)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(mx, my, x2, y2)
  ctx.stroke()
  const ang = Math.atan2(y2 - my, x2 - mx)
  const sz = 8
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - sz * Math.cos(ang - 0.4), y2 - sz * Math.sin(ang - 0.4))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - sz * Math.cos(ang + 0.4), y2 - sz * Math.sin(ang + 0.4))
  ctx.stroke()
}

// ─────────────────────────────────────────────────────────────────────────────
// Text rendering for text-only fallback
// ─────────────────────────────────────────────────────────────────────────────

function renderTextResume(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
): TextBlock[] {
  const blocks: TextBlock[] = []
  const margin = 72
  const maxW = W - margin * 2
  const baseSz = 13
  const lineH = baseSz * 1.72

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, 20000)

  let y = 64
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line.trim()) { y += lineH * 0.42; continue }

    const isHeading = /^[A-Z][A-Z\s\-—–]+$/.test(line.trim()) && line.trim().length < 36
    const isName = y < 110
    const isBullet = /^[•\-◦▪]/.test(line.trim())

    const sz = isName ? 21 : isHeading ? 14 : baseSz
    const weight = isName || isHeading ? 'bold' : 'normal'
    ctx.font = `${weight} ${sz}px Georgia, serif`
    ctx.fillStyle = '#111111'

    if (isHeading) {
      y += 5
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 0.7
      ctx.beginPath(); ctx.moveTo(margin, y + 3); ctx.lineTo(margin + maxW, y + 3); ctx.stroke()
    }

    // Word wrap
    const words = line.split(' ')
    let cur = ''
    const wrapped: string[] = []
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (ctx.measureText(test).width > maxW) { if (cur) wrapped.push(cur); cur = w }
      else cur = test
    }
    if (cur) wrapped.push(cur)

    for (const wl of wrapped) {
      ctx.fillStyle = '#111111'
      const drawX = isBullet ? margin + 14 : margin
      ctx.fillText(wl, drawX, y)
      const mw = ctx.measureText(wl).width
      blocks.push({ text: wl, x: drawX, y: y - sz, w: mw, h: sz + 4 })
      y += lineH * (sz / baseSz)
    }

    if (isHeading) y += 3
  }

  return blocks
}

// ─────────────────────────────────────────────────────────────────────────────
// Text matching — find a phrase in the rendered blocks
// ─────────────────────────────────────────────────────────────────────────────

function findBlock(blocks: TextBlock[], phrase: string): TextBlock | null {
  if (!phrase?.trim() || phrase.length < 3) return null
  const pl = phrase.toLowerCase().trim()

  // exact
  for (const b of blocks) if (b.text.toLowerCase().includes(pl.slice(0, 30))) return b
  // first 15 chars
  const s = pl.slice(0, 15)
  for (const b of blocks) if (b.text.toLowerCase().includes(s)) return b
  // first significant word
  const word = pl.split(/\s+/).find(w => w.length >= 5)
  if (word) for (const b of blocks) if (b.text.toLowerCase().includes(word)) return b
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Placement engine — decides exactly where each annotation goes
// ─────────────────────────────────────────────────────────────────────────────

interface Annotation {
  kind: 'stamp' | 'callout' | 'note'
  text: string
  targetBlock?: TextBlock
  markType?: 'underline' | 'circle' | 'strikethrough'
}

interface Placed {
  kind: 'stamp' | 'callout' | 'note'
  text: string
  // comment position
  cx: number; cy: number
  rotation: number
  fontSize: number
  // mark on text (optional)
  markBlock?: TextBlock
  markType?: 'underline' | 'circle' | 'strikethrough'
  // arrow tip (only when comment is far from mark)
  arrowTipX?: number; arrowTipY?: number
}

const FONT = 'Caveat'
const RED = '#c5000a'
const DARK_RED = '#970008'
const NOTE_RED = '#b80010'

function measureText(ctx: CanvasRenderingContext2D, text: string, fontSize: number): { w: number; h: number } {
  ctx.font = `bold ${fontSize}px "${FONT}", cursive`
  return { w: ctx.measureText(text).width, h: fontSize + 4 }
}

/**
 * Place the verdict stamp — always in the upper-right area,
 * large diagonal, semi-transparent.
 */
function placeStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  pageW: number,
  pageH: number,
  occupied: Occupied,
  rng: () => number,
): Placed | null {
  const fontSize = 64
  const m = measureText(ctx, text, fontSize)
  // Rotated bounding box is larger — approximate
  const rotRad = 0.28  // ~16 deg
  const bw = m.w * Math.cos(rotRad) + m.h * Math.sin(rotRad) + 30
  const bh = m.w * Math.sin(rotRad) + m.h * Math.cos(rotRad) + 30

  // Try positions: top-right quadrant first, then other quadrants
  const candidates: [number, number][] = [
    [pageW * 0.55 + rng() * 40, pageH * 0.08 + rng() * 30],
    [pageW * 0.52 + rng() * 40, pageH * 0.72 + rng() * 30],
    [pageW * 0.12 + rng() * 30, pageH * 0.48 + rng() * 30],
    [pageW * 0.3 + rng() * 40, pageH * 0.25 + rng() * 30],
  ]

  for (const [cx, cy] of candidates) {
    const r: Rect = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }
    if (r.x >= 0 && r.y >= 0 && r.x + r.w <= pageW && r.y + r.h <= pageH) {
      occupied.add(r)
      return {
        kind: 'stamp', text, cx, cy,
        rotation: -(15 + rng() * 10),
        fontSize,
      }
    }
  }
  return null
}

/**
 * Place callouts — large text scattered in margins and open areas.
 * Tries right margin → left margin → below section.
 */
function placeCallout(
  ctx: CanvasRenderingContext2D,
  text: string,
  pageW: number,
  pageH: number,
  occupied: Occupied,
  index: number,
  rng: () => number,
): Placed | null {
  const fontSize = 26
  const m = measureText(ctx, text, fontSize)
  const h = m.h + 6
  const w = m.w + 12

  // Stagger vertically by index so they don't all land at y=0
  const baseY = 80 + index * (pageH / 6)

  // Try right margin, left margin, then scattered positions
  const tryCandidates: Rect[] = [
    // right margin
    { x: pageW - w - 10, y: baseY + rng() * 30, w, h },
    { x: pageW - w - 10, y: baseY + pageH * 0.15 + rng() * 30, w, h },
    // left margin
    { x: 8, y: baseY + rng() * 30, w, h },
    { x: 8, y: baseY + pageH * 0.12 + rng() * 20, w, h },
    // scattered in text area (if wide enough)
    { x: pageW * 0.55, y: baseY + rng() * 50, w, h },
    { x: pageW * 0.1, y: baseY + pageH * 0.3 + rng() * 40, w, h },
  ]

  for (const r of tryCandidates) {
    // clamp to page
    r.x = Math.max(4, Math.min(pageW - r.w - 4, r.x))
    r.y = Math.max(4, Math.min(pageH - r.h - 4, r.y))
    if (!occupied.overlaps(r, 8)) {
      occupied.add(r)
      return {
        kind: 'callout', text,
        cx: r.x, cy: r.y + h / 2,
        rotation: (rng() - 0.5) * 14,
        fontSize,
      }
    }
  }
  return null
}

/**
 * Place a recruiter note near its target block.
 * Tries right of target → left → above → below.
 * Records whether arrow is needed.
 */
function placeNote(
  ctx: CanvasRenderingContext2D,
  text: string,
  target: TextBlock | undefined,
  markType: 'underline' | 'circle' | 'strikethrough',
  pageW: number,
  pageH: number,
  occupied: Occupied,
  fallbackY: number,
  rng: () => number,
): Placed | null {
  const fontSize = 15
  const lines = wrapToLines(ctx, text, fontSize, 170)
  const w = Math.max(...lines.map(l => { ctx.font = `bold ${fontSize}px "${FONT}", cursive`; return ctx.measureText(l).width })) + 8
  const h = lines.length * (fontSize + 3) + 6

  let tryRects: Array<Rect & { arrowTipX?: number; arrowTipY?: number }> = []

  if (target) {
    const tx = target.x, ty = target.y, tw = target.w, th = target.h
    const gap = 10
    tryRects = [
      // right of target
      { x: tx + tw + gap, y: ty - 4, w, h, arrowTipX: tx + tw + 2, arrowTipY: ty + th / 2 },
      // left of target
      { x: tx - w - gap, y: ty - 4, w, h, arrowTipX: tx - 2, arrowTipY: ty + th / 2 },
      // above target
      { x: tx, y: ty - h - gap, w, h, arrowTipX: tx + tw / 2, arrowTipY: ty - 2 },
      // below target
      { x: tx, y: ty + th + gap, w, h, arrowTipX: tx + tw / 2, arrowTipY: ty + th + 2 },
      // further right
      { x: pageW - w - 10, y: ty - 4, w, h, arrowTipX: tx + tw, arrowTipY: ty + th / 2 },
      // further left
      { x: 8, y: ty - 4, w, h, arrowTipX: tx, arrowTipY: ty + th / 2 },
    ]
  } else {
    // No target — place in fallback position
    const y = Math.min(fallbackY, pageH - h - 10)
    tryRects = [
      { x: pageW - w - 10, y, w, h },
      { x: 8, y, w, h },
      { x: pageW * 0.5, y, w, h },
    ]
  }

  for (const r of tryRects) {
    const clampedX = Math.max(4, Math.min(pageW - r.w - 4, r.x))
    const clampedY = Math.max(4, Math.min(pageH - r.h - 4, r.y))
    const clamped: Rect = { x: clampedX, y: clampedY, w: r.w, h: r.h }
    if (!occupied.overlaps(clamped, 6)) {
      occupied.add(clamped)
      const noteLeft = clamped.x
      const noteMid = clamped.y + clamped.h / 2

      // Only draw arrow if note is far from target
      let arrowTipX: number | undefined
      let arrowTipY: number | undefined
      if (target && r.arrowTipX != null) {
        const dist = Math.hypot(noteLeft - r.arrowTipX, noteMid - r.arrowTipY!)
        if (dist > 35) {
          arrowTipX = r.arrowTipX
          arrowTipY = r.arrowTipY
        }
      }

      return {
        kind: 'note', text,
        cx: noteLeft, cy: clamped.y,
        rotation: (rng() - 0.5) * 10,
        fontSize,
        markBlock: target,
        markType,
        arrowTipX,
        arrowTipY,
      }
    }
  }
  return null
}

function wrapToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  maxW: number,
): string[] {
  ctx.font = `bold ${fontSize}px "${FONT}", cursive`
  if (ctx.measureText(text).width <= maxW) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (ctx.measureText(t).width > maxW) { if (cur) lines.push(cur); cur = w }
    else cur = t
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [text]
}

// ─────────────────────────────────────────────────────────────────────────────
// Render pass — draws all placed annotations
// ─────────────────────────────────────────────────────────────────────────────

function drawPlaced(ctx: CanvasRenderingContext2D, items: Placed[], rng: () => number) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Pass 1: marks on text
  for (const p of items) {
    if (!p.markBlock || !p.markType) continue
    const r = mkRng(p.cx + p.cy | 0)
    const { x, y, w, h } = p.markBlock
    const mid = y + h / 2
    ctx.strokeStyle = NOTE_RED
    ctx.lineWidth = 2.0
    ctx.globalAlpha = 0.85

    switch (p.markType) {
      case 'underline': waveUnderline(ctx, x - 1, y + h + 2, w + 2, r); break
      case 'circle':    wobbleCircle(ctx, x + w / 2, mid, w / 2 + 9, h / 2 + 7, r); break
      case 'strikethrough': strikeThrough(ctx, x, mid, w, r); break
    }
    ctx.globalAlpha = 1
  }

  // Pass 2: arrows
  for (const p of items) {
    if (p.arrowTipX == null) continue
    const r = mkRng((p.cx + p.cy) * 3 | 0)
    const fromX = p.cx + (p.kind === 'note' ? 60 : 0)
    const fromY = p.cy + (p.fontSize / 2)
    ctx.strokeStyle = p.kind === 'callout' ? DARK_RED : NOTE_RED
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.7
    curvedArrow(ctx, fromX, fromY, p.arrowTipX, p.arrowTipY!, r)
    ctx.globalAlpha = 1
  }

  // Pass 3: text annotations
  for (const p of items) {
    ctx.save()
    ctx.translate(p.cx, p.cy)
    ctx.rotate((p.rotation * Math.PI) / 180)

    if (p.kind === 'stamp') {
      // Large hollow stamp
      ctx.font = `900 ${p.fontSize}px "${FONT}", cursive`
      ctx.globalAlpha = 0.68
      const mw = ctx.measureText(p.text).width
      const pad = 14
      ctx.strokeStyle = RED
      ctx.lineWidth = 4
      ctx.strokeRect(-mw / 2 - pad, -p.fontSize - 2, mw + pad * 2, p.fontSize + 22)
      ctx.fillStyle = RED
      ctx.fillText(p.text, -mw / 2, 0)

    } else if (p.kind === 'callout') {
      // Bold large text, slightly boxed
      ctx.font = `900 ${p.fontSize}px "${FONT}", cursive`
      ctx.globalAlpha = 0.92
      ctx.fillStyle = DARK_RED
      ctx.fillText(p.text, 0, p.fontSize * 0.8)

    } else {
      // Note — multi-line, smaller
      const lines = wrapToLines(ctx, p.text, p.fontSize, 170)
      ctx.font = `bold ${p.fontSize}px "${FONT}", cursive`
      ctx.globalAlpha = 0.9
      ctx.fillStyle = NOTE_RED
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 0, (i + 1) * (p.fontSize + 2))
      }
    }

    ctx.restore()
    ctx.globalAlpha = 1
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface RoastCanvasProps {
  resumeText: string
  pdfFileUrl?: string
  roastData: RoastV5
}

export function RoastCanvas({ resumeText, pdfFileUrl, roastData }: RoastCanvasProps) {
  const [dataUrl, setDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)

  const render = useCallback(async () => {
    if (!roastData) return
    setLoading(true)
    setError('')

    try {
      await document.fonts.ready

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      let blocks: TextBlock[] = []

      // ── Render PDF or text onto canvas ─────────────────────────────────────
      if (pdfFileUrl) {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        const buf = await (await fetch(pdfFileUrl)).arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        const page = await pdf.getPage(1)
        const scale = 2.0
        const vp = page.getViewport({ scale })
        canvas.width = vp.width
        canvas.height = vp.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas: canvas as any, canvasContext: ctx, viewport: vp } as any).promise

        // Extract text blocks
        const tc = await page.getTextContent()
        for (const raw of tc.items as Array<{ str: string; transform: number[]; width: number; height: number }>) {
          if (!raw.str?.trim()) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [vx, vy] = (vp as any).convertToViewportPoint(raw.transform[4], raw.transform[5])
          const scaledH = raw.height * scale
          const scaledW = raw.width * scale
          blocks.push({ text: raw.str, x: vx, y: vy - scaledH - 1, w: scaledW, h: scaledH + 3 })
        }
      } else {
        canvas.width = 720
        canvas.height = 10000
        blocks = renderTextResume(ctx, resumeText, canvas.width)

        // Trim canvas
        const maxY = blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0)
        const finalH = Math.max(900, maxY + 80)
        const imgData = ctx.getImageData(0, 0, canvas.width, finalH)
        canvas.height = finalH
        ctx.putImageData(imgData, 0, 0)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, maxY + 4, canvas.width, finalH)
      }

      // ── Build annotation list ───────────────────────────────────────────────
      const annotations: Annotation[] = [
        // Verdict stamp (1)
        { kind: 'stamp', text: roastData.verdictStamp || 'MAYBE' },
        // Major callouts (5)
        ...(roastData.majorCallouts || []).slice(0, 5).map(t => ({
          kind: 'callout' as const, text: t,
        })),
        // Recruiter notes (10)
        ...(roastData.recruiterNotes || []).slice(0, 10).map(n => ({
          kind: 'note' as const,
          text: n.note,
          targetBlock: findBlock(blocks, n.targetText) || undefined,
          markType: n.markType,
        })),
      ]

      // ── Run placement engine ────────────────────────────────────────────────
      const W = canvas.width
      const H = canvas.height
      const occupied = new Occupied()
      const placed: Placed[] = []
      const baseRng = mkRng(42)

      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i]
        const r = mkRng(i * 997 + 13)

        if (ann.kind === 'stamp') {
          const p = placeStamp(ctx, ann.text, W, H, occupied, r)
          if (p) placed.push(p)

        } else if (ann.kind === 'callout') {
          const p = placeCallout(ctx, ann.text, W, H, occupied, i - 1, r)
          if (p) placed.push(p)

        } else {
          const fallbackY = 120 + (i - 6) * 70
          const p = placeNote(
            ctx, ann.text, ann.targetBlock, ann.markType ?? 'underline',
            W, H, occupied, fallbackY, r,
          )
          if (p) placed.push(p)
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      drawPlaced(ctx, placed, baseRng)

      setDataUrl(canvas.toDataURL('image/png', 0.93))
    } catch (e) {
      console.error('RoastCanvas error:', e)
      setError('Could not render annotated resume.')
    } finally {
      setLoading(false)
    }
  }, [pdfFileUrl, resumeText, roastData])

  useEffect(() => { if (roastData) render() }, [render, roastData])

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'resume-roasted.png'
    a.click()
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--text-muted)]">
      <Loader2 className="w-5 h-5 animate-spin" />
      <p className="text-xs">Placing annotations…</p>
    </div>
  )

  if (error) return (
    <div className="text-center py-10 space-y-3">
      <p className="text-xs text-red-400">{error}</p>
      <Button size="sm" variant="outline" onClick={render}>
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Retry
      </Button>
    </div>
  )

  if (!dataUrl) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-faint)]">
          {pdfFileUrl
            ? 'Your PDF — annotated by a senior recruiter'
            : 'Resume text — upload PDF for better fidelity'}
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
      <div className="rounded-lg overflow-hidden border border-[var(--border)] shadow-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src={dataUrl} alt="Annotated resume" className="w-full block" />
      </div>
    </div>
  )
}
