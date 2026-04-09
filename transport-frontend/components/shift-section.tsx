'use client'

import { useState } from 'react'
import { BookingCard, Booking } from './booking-card'
import { Button } from '@/components/ui/button'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 5

export interface ShiftSectionProps {
  shiftTime: string
  bookings: Booking[]
}

export function ShiftSection({ shiftTime, bookings }: ShiftSectionProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(bookings.length / PAGE_SIZE)
  const paginated = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 if bookings change (e.g. filter applied)
  // We use a key on the parent to handle this — no extra effect needed

  return (
    <div className="space-y-4">
      {/* Shift Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{shiftTime}</h3>
            <p className="text-xs text-slate-500">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
          </div>
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-0 sm:pl-12">
        {paginated.map((booking, idx) => (
          <BookingCard key={booking.id || idx} booking={booking} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pl-0 sm:pl-12 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
