import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    if (text) {
      return NextResponse.json({ text: text.trim() })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name.toLowerCase()
    let extractedText = ''

    if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')

    } else if (fileName.endsWith('.pdf')) {
      // Use OpenAI vision to extract text from PDF — more reliable than pdf-parse in serverless
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      // Convert first ~3 pages worth via vision API by treating the PDF as a file upload
      // Use the Assistants Files API or just read via the text extraction approach
      try {
        // Try pdf-parse first (works locally)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse/lib/pdf-parse.js')
        const data = await pdfParse(buffer)
        extractedText = data.text || ''
      } catch {
        extractedText = ''
      }

      // If pdf-parse failed or returned nothing, fall back to OpenAI vision on the raw bytes
      if (!extractedText.trim()) {
        try {
          const base64 = buffer.toString('base64')
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:application/pdf;base64,${base64}` },
                  },
                  {
                    type: 'text',
                    text: 'This is a resume PDF. Extract ALL text exactly as it appears — name, contact info, every job, every bullet point, education, skills. Preserve original formatting, spacing, and structure. Return only the raw extracted text.',
                  },
                ],
              },
            ],
            max_tokens: 4000,
          })
          extractedText = response.choices[0]?.message?.content || ''
        } catch {
          extractedText = ''
        }
      }

    } else if (fileName.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } catch {
        extractedText = ''
      }

    } else if (fileName.match(/\.(png|jpg|jpeg)$/)) {
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'
      const base64 = buffer.toString('base64')
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: 'Extract all text from this resume image. Return only the extracted text, preserving structure.' },
            ],
          },
        ],
        max_tokens: 4000,
      })
      extractedText = response.choices[0]?.message?.content || ''

    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use PDF, DOCX, TXT, or image.' }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from file. Try pasting the resume text directly.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: extractedText.trim() })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 })
  }
}
