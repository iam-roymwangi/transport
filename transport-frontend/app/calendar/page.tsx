'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function isPast(dateStr: string) {
  return dateStr < today()
}

export default function CalendarPage() {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-based
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const fetchCounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/monthly?year=${year}&month=${month}`)
      const data = await res.json()
      setCounts(data)
    } catch {
      setCounts({})
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const goToToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ]

  // Summary stats for the month
  const totalThisMonth = Object.values(counts).reduce((a, b) => a + b, 0)
  const busiest = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]

  const getBadgeStyle = (count: number) => {
    if (count >= 20) return 'bg-red-500 text-white'
    if (count >= 10) return 'bg-orange-400 text-white'
    if (count >= 5)  return 'bg-primary text-white'
    return 'bg-primary/20 text-primary'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookingAdded={fetchCounts} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Month stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">Total this month</p>
              <p className="text-3xl font-bold text-primary">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalThisMonth}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">Busiest day</p>
              <p className="text-lg font-bold text-slate-800">
                {loading ? '—' : busiest ? `${busiest[0].split('-')[2]} (${busiest[1]})` : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-2">Booking density</p>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary/20 inline-block" />1–4</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" />5–9</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />10–19</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />20+</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {MONTHS[month - 1]} {year}
              </h2>
              {(year !== now.getFullYear() || month !== now.getMonth() + 1) && (
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7">
                  Today
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <CardContent className="p-3 sm:p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="aspect-square" />
                  }

                  const dateStr = toDateStr(year, month, day)
                  const count = counts[dateStr] ?? 0
                  const isToday = dateStr === today()
                  const past = isPast(dateStr)
                  const hovered = hoveredDate === dateStr

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !past && router.push(`/?date=${dateStr}`)}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={past}
                      className={`
                        relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5
                        transition-all duration-150 group
                        ${past
                          ? 'opacity-35 cursor-not-allowed bg-slate-50'
                          : 'cursor-pointer hover:bg-primary/5 hover:scale-105'
                        }
                        ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                        ${hovered && !past ? 'bg-primary/5 shadow-sm' : ''}
                      `}
                    >
                      <span className={`
                        text-xs sm:text-sm font-semibold leading-none
                        ${isToday ? 'text-primary' : past ? 'text-slate-400' : 'text-slate-700'}
                      `}>
                        {day}
                      </span>

                      {count > 0 && (
                        <span className={`
                          text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded-full leading-none
                          ${getBadgeStyle(count)}
                        `}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming bookings list */}
        {!loading && Object.keys(counts).length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Days with bookings — {MONTHS[month - 1]} {year}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(counts)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, count]) => {
                    const d = new Date(date + 'T00:00:00')
                    const past = isPast(date)
                    return (
                      <button
                        key={date}
                        onClick={() => !past && router.push(`/?date=${date}`)}
                        disabled={past}
                        className={`
                          flex items-center justify-between px-3 py-2 rounded-lg text-sm
                          transition-colors border border-slate-100
                          ${past
                            ? 'opacity-40 cursor-not-allowed bg-slate-50'
                            : 'hover:bg-primary/5 hover:border-primary/20 cursor-pointer bg-white'
                          }
                        `}
                      >
                        <span className="font-medium text-slate-700">
                          {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getBadgeStyle(count)}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
