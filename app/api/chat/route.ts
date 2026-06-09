import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SYSTEM_PROMPT, MOCK_INTERVIEW_SYSTEM } from '@/lib/prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      resumeText,
      jdText,
      currentResumeText,
      analysisResult,
      mode,
    } = await req.json()

    // ── Text-based resume edit ────────────────────────────────────────────────
    // Edits the raw resume text directly — preserves original formatting/style
    if (mode === 'edit') {
      const instruction = messages[messages.length - 1]?.content || ''
      const workingText = currentResumeText || resumeText

      const prompt = `You are an expert resume editor. Your job is to edit the resume text below based on the user's instruction.

CRITICAL RULES:
- Return the COMPLETE edited resume text, preserving ALL original formatting, structure, spacing, and style
- Do NOT reformat, reorder sections, or change fonts/styling conventions
- Only modify the content that the instruction asks you to change
- Keep every section that you are not asked to change EXACTLY as it is
- Preserve bullet point style (•, -, *, etc.) exactly as in the original
- Preserve date formats, capitalisation patterns, and spacing exactly as in the original
- Do NOT add new sections unless explicitly asked
- Do NOT remove sections unless explicitly asked

USER INSTRUCTION:
${instruction}

JOB DESCRIPTION CONTEXT (use this to inform what changes to make):
${jdText || 'Not provided'}

ANALYSIS CONTEXT (missing keywords, skills gaps):
${analysisResult ? `Missing skills: ${analysisResult.missingSkills?.slice(0, 6).map((s: {skill: string}) => s.skill).join(', ')}
Missing keywords: ${analysisResult.missingKeywords?.slice(0, 10).join(', ')}` : ''}

CURRENT RESUME TEXT TO EDIT:
---
${workingText}
---

Return a JSON object with this exact structure:
{
  "updatedText": "<the complete edited resume text, preserving all original formatting>",
  "changeDescription": "<1 sentence describing what was changed>",
  "changedSections": ["<section1>", "<section2>"],
  "explanation": "<2-3 sentences explaining the approach and what specifically was changed>"
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 4000,
      })

      const parsed = JSON.parse(response.choices[0].message.content || '{}')
      return NextResponse.json({ editResult: parsed })
    }

    // ── Mock interview ────────────────────────────────────────────────────────
    if (mode === 'interview') {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: MOCK_INTERVIEW_SYSTEM({}, jdText || '', {}),
          },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        stream: true,
        temperature: 0.6,
        max_tokens: 800,
      })
      return streamResponse(stream)
    }

    // ── Recruiter mode ────────────────────────────────────────────────────────
    if (mode === 'recruiter') {
      const systemContent = `${SYSTEM_PROMPT}

You are the hiring manager evaluating this candidate for the role below. Be direct and specific.

RESUME:
${currentResumeText || resumeText}

JOB:
${jdText}`

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemContent },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        stream: true,
        temperature: 0.4,
        max_tokens: 1200,
      })
      return streamResponse(stream)
    }

    // ── Coach (default) ───────────────────────────────────────────────────────
    const systemContent = `${SYSTEM_PROMPT}

You are the user's AI career coach with full context about their resume and target role.

CURRENT RESUME:
${currentResumeText || resumeText}

JOB DESCRIPTION:
${jdText}

ANALYSIS:
Score: ${analysisResult?.overallScore ?? 'N/A'}%
Missing skills: ${analysisResult?.missingSkills?.slice(0, 5).map((s: {skill: string}) => s.skill).join(', ') ?? 'none'}
Missing keywords: ${analysisResult?.missingKeywords?.slice(0, 8).join(', ') ?? 'none'}
Gaps: ${analysisResult?.experienceGaps?.slice(0, 3).join('; ') ?? 'none'}

When the user asks you to edit, rewrite, or change the resume, tell them to use the input box with a clear instruction (e.g. "Make my experience leadership-focused") — those edits update the live document directly. For questions and advice, respond with specific guidance referencing their actual content.

Use markdown. Be specific, never generic.`

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemContent },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 1500,
    })
    return streamResponse(stream)
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}

async function streamResponse(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })
  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
