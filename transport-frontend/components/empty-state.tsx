import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export function EmptyState({ date }: { date: string }) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No bookings for this date
        </h3>
        <p className="text-slate-600 max-w-sm">
          There are no transport bookings scheduled for{' '}
          <span className="font-medium">{formattedDate}</span>. Add a new booking
          to get started.
        </p>
      </div>
    </Card>
  )
}
