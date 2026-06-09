import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    // If raw text is provided
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
      try {
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(buffer)
        extractedText = data.text
      } catch {
        // Fallback: return a message to use text paste
        extractedText = `[PDF parsing attempted for: ${file.name}. If text extraction failed, please paste the resume text directly.]`
      }
    } else if (fileName.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } catch {
        extractedText = `[DOCX parsing attempted for: ${file.name}. Please paste the resume text if needed.]`
      }
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    ) {
      // For images, we'll use OpenAI vision
      const base64 = buffer.toString('base64')
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'

      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: 'text',
                text: 'Extract all text from this resume/document image. Return only the extracted text, preserving structure.',
              },
            ],
          },
        ],
        max_tokens: 4000,
      })

      extractedText = response.choices[0]?.message?.content || ''
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 })
    }

    return NextResponse.json({ text: extractedText.trim() })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    )
  }
}
