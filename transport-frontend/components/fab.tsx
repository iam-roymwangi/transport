'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { BookingDialog } from '@/components/add-booking-form'

export function FloatingAddButton({ onBookingAdded }: { onBookingAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(true)
    const t = setTimeout(() => setExpanded(false), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Fully controlled dialog — no trigger button inside */}
      <BookingDialog open={open} onOpenChange={setOpen} onBookingAdded={onBookingAdded} />

      {/* FAB — mobile only, nothing overlapping it */}
      <div className="md:hidden fixed bottom-6 right-5 z-[9999]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Book now"
          className="
            flex items-center gap-2 h-14 rounded-full shadow-2xl ring-4 ring-white
            bg-gradient-to-br from-primary to-secondary
            text-white font-semibold
            hover:scale-105 active:scale-95
            transition-all duration-300 ease-in-out
            overflow-hidden px-4
          "
          style={{ minWidth: '3.5rem' }}
        >
          <Plus className="w-6 h-6 flex-shrink-0" />
          <span
            className="overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out text-sm"
            style={{ maxWidth: expanded ? '6rem' : '0px', opacity: expanded ? 1 : 0 }}
          >
            Book Now
          </span>
        </button>
      </div>
    </>
  )
}
