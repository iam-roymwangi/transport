'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function DateSelector({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string
  onDateChange: (date: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0])
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date.toISOString().split('T')[0])
      setIsOpen(false)
    }
  }

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousDay}
          className="hover:bg-primary/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 flex-1 sm:flex-none min-w-48 justify-center"
            >
              <CalendarIcon className="w-4 h-4" />
              {formattedDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-lg">
            <Calendar
              mode="single"
              selected={new Date(selectedDate)}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextDay}
          className="hover:bg-secondary/10"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Button
        variant="secondary"
        className="w-full sm:w-auto bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20"
        onClick={handleToday}
      >
        Today
      </Button>
    </div>
  )
}
