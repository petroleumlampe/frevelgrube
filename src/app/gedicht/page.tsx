'use client'
import { useState, useEffect, useCallback } from 'react'
import TextBody from '@/components/TextBody'

export default function GedichtPage() {
  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const generate = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gedicht', { cache: 'no-store' })
    const data = await res.json()
    setLines(data.lines ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    generate()
    window.addEventListener('gedicht-refresh', generate)
    return () => window.removeEventListener('gedicht-refresh', generate)
  }, [generate])

  return (
    <div className="gedicht-page">
      <p className="gedicht-subtitle">zufällige neukomposition von hier hochgeladenen worten</p>
      {loading ? (
        <span className="gedicht-loading">·  ·  ·</span>
      ) : (
        <TextBody content={lines.join('\n')} immerLyrik className="gedicht-lines" />
      )}
    </div>
  )
}
