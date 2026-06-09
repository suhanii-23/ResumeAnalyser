'use client'

import { useResumeStore } from '@/lib/store'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { Footer } from '@/components/landing/Footer'
import { UploadView } from '@/components/upload/UploadView'
import { AnalyzingScreen } from '@/components/analysis/AnalyzingScreen'
import { ResultsView } from '@/components/analysis/ResultsView'

export default function Home() {
  const {
    currentView, resumeText, jdText, jdInput,
    setCurrentView, setIsAnalyzing, setAnalysisResult,
    setAnalysisComplete, pushResumeVersion, reset,
  } = useResumeStore()

  const handleStart = () => setCurrentView('upload')

  const handleAnalyze = async () => {
    const jd = jdText || jdInput
    if (!resumeText || !jd) return

    setCurrentView('analyzing')
    setIsAnalyzing(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText: jd }),
      })
      const data = await res.json()

      if (data.result) {
        setAnalysisResult(data.result)
        setAnalysisComplete(true)

        // Push initial resume version from parsed schema
        if (data.result.resumeSchema) {
          pushResumeVersion(data.result.resumeSchema, 'v1 · Original', 'Initial parsed version')
        }

        setCurrentView('results')
      } else {
        alert(data.error || 'Analysis failed — check your API key.')
        setCurrentView('upload')
      }
    } catch (err) {
      console.error(err)
      alert('Analysis failed. Check your internet connection and API key.')
      setCurrentView('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    reset()
    setCurrentView('landing')
  }

  if (currentView === 'landing') {
    return (
      <main className="bg-[var(--bg)]">
        <Navbar onStart={handleStart} />
        <Hero onStart={handleStart} />
        <Features />
        <Testimonials />
        <Pricing onStart={handleStart} />
        <Footer />
      </main>
    )
  }

  if (currentView === 'upload') {
    return (
      <main className="bg-[var(--bg)]">
        <UploadView onAnalyze={handleAnalyze} />
      </main>
    )
  }

  if (currentView === 'analyzing') {
    return (
      <main className="bg-[var(--bg)]">
        <AnalyzingScreen />
      </main>
    )
  }

  if (currentView === 'results') {
    return (
      <main className="bg-[var(--bg)]">
        <ResultsView onReset={handleReset} />
      </main>
    )
  }

  return null
}
