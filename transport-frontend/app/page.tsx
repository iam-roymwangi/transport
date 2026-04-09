'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { DateSelector } from '@/components/date-selector'
import { SummaryStats } from '@/components/summary-stats'
import { ShiftSection } from '@/components/shift-section'
import { AddBookingForm } from '@/components/add-booking-form'
import { EmptyState } from '@/components/empty-state'
import { SearchFiltersBar, SearchFilters } from '@/components/search-filters'
import { Booking } from '@/components/booking-card'
import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'

interface BookingsData {
  [shift: string]: Booking[]
}

const EMPTY_FILTERS: SearchFilters = { name: '', staffNumber: '', phoneNumber: '' }

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bookings?date=${selectedDate}`)
      const data: Booking[] = await response.json()
      setAllBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      setAllBookings([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchBookings()
    setFilters(EMPTY_FILTERS) // reset filters on date change
  }, [selectedDate, fetchBookings])

  // Apply search filters
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const name = filters.name.toLowerCase()
      const staff = filters.staffNumber.toLowerCase()
      const phone = filters.phoneNumber.toLowerCase()
      return (
        (!name || b.name?.toLowerCase().includes(name)) &&
        (!staff || b.staffNumber?.toLowerCase().includes(staff)) &&
        (!phone || b.phoneNumber?.toLowerCase().includes(phone))
      )
    })
  }, [allBookings, filters])

  // Group filtered bookings by shift
  const groupedByShift = useMemo(() => {
    const groups: BookingsData = {}
    filteredBookings.forEach((booking) => {
      const shift = booking.shift || 'Unscheduled'
      if (!groups[shift]) groups[shift] = []
      groups[shift].push(booking)
    })
    return groups
  }, [filteredBookings])

  // Summary stats always from full unfiltered set
  const { totalBookings, numberOfShifts, mostUsedRoute } = useMemo(() => {
    const routeCounts: Record<string, number> = {}
    allBookings.forEach((b) => {
      if (b.route) routeCounts[b.route] = (routeCounts[b.route] || 0) + 1
    })
    const mostUsed = Object.entries(routeCounts).sort(([, a], [, b]) => b - a)[0]
    return {
      totalBookings: allBookings.length,
      numberOfShifts: new Set(allBookings.map((b) => b.shift)).size,
      mostUsedRoute: mostUsed ? mostUsed[0] : '',
    }
  }, [allBookings])

  // Sort shifts chronologically
  const sortedShifts = Object.keys(groupedByShift).sort((a, b) => {
    const parse = (s: string) => parseInt(s.split(' - ')[0].replace(/[:/]/g, '').slice(0, 4))
    return parse(a) - parse(b)
  })

  const hasActiveFilter = filters.name || filters.staffNumber || filters.phoneNumber

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Transport Booking
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Manage and track your transport bookings efficiently
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/import">
                <Button variant="outline" size="lg" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Button>
              </Link>
              <AddBookingForm onBookingAdded={fetchBookings} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Select Date</h2>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* Summary Stats */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Overview</h2>
            <SummaryStats
              totalBookings={totalBookings}
              numberOfShifts={numberOfShifts}
              mostUsedRoute={mostUsedRoute}
              loading={loading}
            />
          </section>

          {/* Search Filters */}
          {!loading && allBookings.length > 0 && (
            <section>
              <SearchFiltersBar
                filters={filters}
                onChange={setFilters}
                resultCount={filteredBookings.length}
                totalCount={allBookings.length}
              />
            </section>
          )}

          {/* Bookings Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Bookings by Shift
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-slate-600">Loading bookings...</p>
                </div>
              </div>
            ) : sortedShifts.length > 0 ? (
              <div className="space-y-8">
                {sortedShifts.map((shift) => (
                  <ShiftSection
                    key={`${shift}-${filters.name}-${filters.staffNumber}-${filters.phoneNumber}`}
                    shiftTime={shift}
                    bookings={groupedByShift[shift] || []}
                  />
                ))}
              </div>
            ) : hasActiveFilter ? (
              <div className="text-center py-16 text-slate-500">
                No bookings match your search.
              </div>
            ) : (
              <EmptyState date={selectedDate} />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
