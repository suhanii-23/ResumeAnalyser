import { NextRequest, NextResponse } from 'next/server'

async function parsePDF(buffer: Buffer): Promise<string> {
  const { extractText } = await import('unpdf')
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
  return text || ''
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    if (text) return NextResponse.json({ text: text.trim() })
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name.toLowerCase()
    let extractedText = ''

    if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')

    } else if (fileName.endsWith('.pdf')) {
      try {
        extractedText = await parsePDF(buffer)
      } catch (err) {
        console.error('PDF parse error:', err)
        extractedText = ''
      }

    } else if (fileName.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value || ''
      } catch {
        extractedText = ''
      }

    } else if (fileName.match(/\.(png|jpg|jpeg)$/)) {
      try {
        const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'
        const base64 = buffer.toString('base64')
        const OpenAI = (await import('openai')).default
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: 'Extract all text from this resume image. Return only the extracted text, preserving structure.' },
            ],
          }],
          max_tokens: 4000,
        })
        extractedText = response.choices[0]?.message?.content || ''
      } catch {
        extractedText = ''
      }

    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use PDF, DOCX, TXT, PNG, or JPG.' },
        { status: 400 }
      )
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text. Please paste your resume text directly.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: extractedText.trim() })

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 })
  }
}
