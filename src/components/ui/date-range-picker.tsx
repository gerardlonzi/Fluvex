'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

type Range = { from: Date | null; to: Date | null }

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function clampToMidnight(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYmd(s: string | null): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function buildMonthGrid(month: Date): Array<{ date: Date; inMonth: boolean }> {
  const first = startOfMonth(month)
  const startDow = (first.getDay() + 6) % 7 // monday=0
  const start = new Date(first)
  start.setDate(first.getDate() - startDow)

  const cells: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === month.getMonth() })
  }
  return cells
}

function isInRange(d: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false
  const t = clampToMidnight(d).getTime()
  const a = clampToMidnight(from).getTime()
  const b = clampToMidnight(to).getTime()
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return t >= lo && t <= hi
}

export function DateRangePicker({
  value,
  onChange,
  className,
  label = 'Filtrer par date',
  placeholder = 'Choisir une période',
  minDate = null,
  maxDate = null,
}: {
  value: Range
  onChange: (next: Range) => void
  className?: string
  label?: string
  placeholder?: string
  minDate?: Date | null
  maxDate?: Date | null
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const today = useMemo(() => clampToMidnight(new Date()), [])
  const min = minDate ? clampToMidnight(minDate) : null
  const max = maxDate ? clampToMidnight(maxDate) : today
  const [cursorMonth, setCursorMonth] = useState<Date>(() => startOfMonth(new Date()))

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const display = useMemo(() => {
    if (value.from && value.to) return `${formatYmd(value.from)} → ${formatYmd(value.to)}`
    if (value.from) return `${formatYmd(value.from)} → …`
    return ''
  }, [value.from, value.to])

  const grid = useMemo(() => buildMonthGrid(cursorMonth), [cursorMonth])

  const clear = () => onChange({ from: null, to: null })

  const isDayDisabled = (d: Date) => {
    const t = clampToMidnight(d).getTime()
    if (min != null && t < min.getTime()) return true
    if (max != null && t > max.getTime()) return true
    return false
  }

  const selectDay = (d: Date) => {
    if (isDayDisabled(d)) return
    const day = clampToMidnight(d)
    if (!value.from || (value.from && value.to)) {
      onChange({ from: day, to: null })
      return
    }
    onChange({ from: value.from, to: day })
  }

  return (
    <div className={className} ref={containerRef}>
      <div className="text-xs font-bold text-text-muted uppercase mb-1">{label}</div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border transition-colors text-sm font-medium text-text-main"
        >
          <span className={display ? 'text-text-main' : 'text-text-muted'}>
            {display || placeholder}
          </span>
          <Calendar size={18} className="text-text-muted" />
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-[320px] rounded-2xl border border-border bg-surface shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setCursorMonth((m) => addMonths(m, -1))}
                className="p-2 rounded-lg hover:bg-border text-text-muted hover:text-text-main"
                aria-label="Mois précédent"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-sm font-bold text-text-main capitalize">{monthLabel(cursorMonth)}</div>
              <button
                type="button"
                onClick={() => setCursorMonth((m) => addMonths(m, 1))}
                className="p-2 rounded-lg hover:bg-border text-text-muted hover:text-text-main"
                aria-label="Mois suivant"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-text-muted uppercase mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => (
                <div key={i} className="text-center py-1">{x}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map(({ date, inMonth }) => {
                const selectedFrom = value.from && isSameDay(date, value.from)
                const selectedTo = value.to && isSameDay(date, value.to)
                const inRange = isInRange(date, value.from, value.to)
                const disabled = isDayDisabled(date)
                const base = 'h-9 w-9 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center'
                const muted = inMonth ? 'text-text-main' : 'text-text-muted/60'
                const bg = disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : selectedFrom || selectedTo
                    ? 'bg-primary text-[#020617]'
                    : inRange
                      ? 'bg-primary/15 text-text-main'
                      : 'hover:bg-border'
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(date)}
                    className={`${base} ${muted} ${bg}`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-4 gap-2">
              <button
                type="button"
                onClick={() => { clear(); setOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-border text-text-main text-xs font-bold"
              >
                <X size={14} />
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-primary text-[#020617] text-xs font-bold hover:bg-primaryHover"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const dateRangeQuery = {
  parse(search: { get: (k: string) => string | null }): Range {
    return { from: parseYmd(search.get('from')), to: parseYmd(search.get('to')) }
  },
  toQuery(range: Range): Record<string, string> {
    const q: Record<string, string> = {}
    if (range.from) q.from = formatYmd(range.from)
    if (range.to) q.to = formatYmd(range.to)
    return q
  },
}

