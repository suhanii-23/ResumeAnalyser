import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, format, filename } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (format === 'txt') {
      const buffer = Buffer.from(text, 'utf-8')
      return new Response(buffer, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename || 'resume'}.txt"`,
        },
      })
    }

    if (format === 'docx') {
      // Return as plain text with docx extension for simplicity
      const buffer = Buffer.from(text, 'utf-8')
      return new Response(buffer.toString(), {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename || 'resume'}.txt"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

