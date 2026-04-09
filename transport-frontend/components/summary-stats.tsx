import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  loading?: boolean
}

function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
            {loading ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <p className="text-3xl font-bold text-primary">{value}</p>
            )}
          </div>
          {icon && <div className="text-primary/30">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export interface SummaryStatsProps {
  totalBookings: number
  numberOfShifts: number
  mostUsedRoute: string
  loading?: boolean
}

export function SummaryStats({
  totalBookings,
  numberOfShifts,
  mostUsedRoute,
  loading = false,
}: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <StatCard
        label="Total Bookings"
        value={totalBookings}
        loading={loading}
        icon={
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />
      <StatCard
        label="Shifts Today"
        value={numberOfShifts}
        loading={loading}
        icon={
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <StatCard
        label="Most Used Route"
        value={mostUsedRoute || '—'}
        loading={loading}
        icon={
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
      />
    </div>
  )
}
