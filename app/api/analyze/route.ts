import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SYSTEM_PROMPT, ANALYZE_PROMPT, ROAST_PROMPT, RECRUITER_PROMPT, INTERVIEW_PREP_PROMPT } from '@/lib/prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resumeText, jdText, mode, resumeSchema, missingSkills, companyValues, analysisContext } = body

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text required' }, { status: 400 })
    }

    if (mode === 'roast') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: ROAST_PROMPT(resumeText, jdText || '') },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 4000,
      })
      const result = JSON.parse(response.choices[0].message.content || '{}')
      // Normalise anchorText → targetText for backwards compat
      if (result.annotations) {
        result.annotations = result.annotations.map((a: Record<string, string>) => ({
          ...a,
          targetText: a.anchorText || a.targetText || '',
        }))
      }
      return NextResponse.json({ result })
    }

    if (mode === 'recruiter') {
      if (!jdText) return NextResponse.json({ error: 'JD required for recruiter mode' }, { status: 400 })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: RECRUITER_PROMPT(resumeText, jdText, analysisContext || '') },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      })
      const result = JSON.parse(response.choices[0].message.content || '{}')
      return NextResponse.json({ result })
    }

    if (mode === 'interview-prep') {
      if (!jdText) return NextResponse.json({ error: 'JD required for interview prep' }, { status: 400 })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: INTERVIEW_PREP_PROMPT(resumeSchema || {}, jdText, missingSkills || [], companyValues || []) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000,
      })
      const result = JSON.parse(response.choices[0].message.content || '{}')
      return NextResponse.json({ result })
    }

    // Default: full analysis
    if (!jdText) return NextResponse.json({ error: 'Job description required' }, { status: 400 })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: ANALYZE_PROMPT(resumeText, jdText) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 5000,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed. Check your API key.' }, { status: 500 })
  }
}
