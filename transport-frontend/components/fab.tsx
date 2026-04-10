'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AddBookingForm } from '@/components/add-booking-form'

export function FloatingAddButton({ onBookingAdded }: { onBookingAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  // Start collapsed (matches SSR), expand after mount, then collapse again after 3s
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(true)
    const t = setTimeout(() => setExpanded(false), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="md:hidden fixed bottom-6 right-5 z-50">
      <AddBookingForm
        forceOpen={open}
        onOpenChange={setOpen}
        onBookingAdded={onBookingAdded}
      />

      <button
        onClick={() => setOpen(true)}
        aria-label="Add booking"
        className="
          flex items-center gap-2
          h-14 rounded-full shadow-2xl ring-4 ring-white
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
          style={{ maxWidth: expanded ? '5rem' : '0px', opacity: expanded ? 1 : 0 }}
        >
          Book
        </span>
      </button>
    </div>
  )
}
