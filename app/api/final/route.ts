import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { resumeText, jdText, analysisResult, mode } = await req.json()

  if (mode === 'latex') {
    const prompt = `You are an expert LaTeX resume writer. Convert this resume into clean, compilable LaTeX code using the classic professional template.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION CONTEXT (tailor the resume slightly for this role):
${jdText || 'Not provided'}

Rules:
- Use the "article" document class with geometry package for margins
- Use \\textbf for company/school names, \\textit for job titles
- Use \\hrule or \\noindent\\rule for section separators
- Use itemize for bullet points with \\small bullets
- Keep the exact same sections and content as the original resume
- Make it compile on Overleaf without any additional packages beyond: geometry, hyperref, enumitem, titlesec, fontenc, inputenc
- Use clean serif font (default LaTeX font is fine)
- Output ONLY the LaTeX code, starting with \\documentclass and ending with \\end{document}
- No explanations, no markdown fences, just raw LaTeX`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const latex = response.choices[0].message.content || ''
    return NextResponse.json({ latex })
  }

  // mode === 'changes' — structured section-by-section breakdown
  const missingSkills = analysisResult?.missingSkills?.slice(0, 8).map((s: {skill: string}) => s.skill).join(', ') || ''
  const missingKeywords = analysisResult?.missingKeywords?.slice(0, 10).join(', ') || ''
  const suggestions = analysisResult?.suggestions?.slice(0, 6) || []

  const prompt = `You are a senior recruiter and resume coach. Analyze this resume against the job description and produce a precise, section-by-section action plan.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText || 'Not provided'}

ANALYSIS DATA:
- Missing skills: ${missingSkills}
- Missing keywords: ${missingKeywords}
- Suggestions: ${JSON.stringify(suggestions)}

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "name": "Contact / Header",
      "status": "good" | "needs-work" | "missing",
      "summary": "One sentence assessment",
      "keep": ["things that are already strong and should stay"],
      "add": ["specific things to add with exact wording where possible"],
      "remove": ["specific things to cut and why"],
      "rewrite": [
        {
          "original": "exact original bullet or line",
          "improved": "improved version with stronger action verb, metrics, keywords",
          "reason": "why this is better"
        }
      ]
    }
  ],
  "priorityOrder": ["section names in order of impact — highest first"],
  "topThreeWins": ["3 highest-impact changes that will most improve the score"]
}

Cover these sections if they exist in the resume: Contact/Header, Summary/Objective, Experience, Projects, Education, Skills, Certifications.
Be SPECIFIC — reference exact text from the resume. No generic advice.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 3000,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
