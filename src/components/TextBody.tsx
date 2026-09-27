'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

// Umgebrochene Verse fallen als Treppe die Seite hinunter. Ab der MAX_STUFEN-ten Stufe
// geht es nicht tiefer, weitere Zeilen bleiben auf dieser Höhe.
const STUFE_EM = 0.9
const MAX_STUFEN = 6
const tiefe = (j: number) => Math.min(j, MAX_STUFEN - 1)

type Layout = (string[] | null)[]

// Prosa bekommt weder Treppe noch Einzug. Als Prosa gilt ein Text nur, wenn mindestens zwei Drittel
// seiner Zeilen lange Absätze mit mehreren Sätzen sind; im Zweifel ist es Lyrik.
function isProsa(lines: string[]): boolean {
  const filled = lines.map(l => l.trim()).filter(Boolean)
  if (filled.length < 3) return false
  const absaetze = filled.filter(l => l.length > 120 && (l.match(/[.!?:;] +\S/g) ?? []).length >= 2)
  return absaetze.length / filled.length >= 2 / 3
}

function treppe(line: string, width: number, step: number, measure: (s: string) => number): string[] | null {
  const words = line.trim().split(/\s+/)
  const stufen: string[] = []
  let current = ''
  for (const w of words) {
    const next = current ? `${current} ${w}` : w
    if (current && measure(next) > width - tiefe(stufen.length) * step) {
      stufen.push(current)
      current = w
    } else {
      current = next
    }
  }
  stufen.push(current)
  return stufen.length > 1 ? stufen : null
}

export default function TextBody({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>([])
  // Text bleibt unsichtbar, bis die Treppe mit der richtigen Schrift berechnet ist.
  const [ready, setReady] = useState(false)
  const lines = useMemo(() => content.split('\n'), [content])
  const prosa = useMemo(() => isProsa(lines), [lines])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx || prosa) {
      setReady(true)
      return
    }

    const compute = () => {
      const style = getComputedStyle(el)
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const step = parseFloat(style.fontSize) * STUFE_EM
      const measure = (s: string) => ctx.measureText(s).width
      setLayout(lines.map(l => treppe(l, el.clientWidth, step, measure)))
    }

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(compute)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      clearTimeout(fallback)
      compute()
      setReady(true)
    }
    document.fonts.ready.then(reveal)
    const fallback = setTimeout(reveal, 1500)
    return () => {
      revealed = true
      observer.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
    }
  }, [lines, prosa])

  return (
    <div className={`text-content${prosa ? ' prosa' : ''}${ready ? ' bereit' : ''}`} ref={ref}>
      <noscript><style>{'.text-content { opacity: 1; }'}</style></noscript>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="leerzeile" />
        const stufen = layout[i]
        if (!stufen) return <div key={i} className="vers">{line}</div>
        return (
          <div key={i}>
            {stufen.map((s, j) => (
              <div key={j} className="stufe" style={{ paddingLeft: `${tiefe(j) * STUFE_EM}em` }}>{s}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
