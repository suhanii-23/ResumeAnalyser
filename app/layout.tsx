import type { Metadata } from 'next'
import { Inter, Caveat } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
// Caveat is used for roast handwritten annotations — exported as CSS variable
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })

export const metadata: Metadata = {
  title: 'ResumeIQ AI – Stop Sending Resumes Into The Void',
  description: 'See exactly why recruiters reject your resume and fix it with AI. ATS scoring, gap analysis, and AI career coaching.',
  keywords: 'resume analyzer, ATS checker, AI resume, job description match, career coach',
  openGraph: {
    title: 'ResumeIQ AI',
    description: 'Stop sending resumes into the void. AI-powered resume analysis.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${caveat.variable}`}>
        {children}
      </body>
    </html>
  )
}
