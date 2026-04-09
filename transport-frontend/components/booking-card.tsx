import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, Navigation, Package, Hash } from 'lucide-react'

export interface Booking {
  id?: string
  name: string
  staffNumber: string
  phoneNumber: string
  location: string
  route: string
  process: string
  address: string
  shift?: string
}

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{booking.name}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <Hash className="w-3 h-3 flex-shrink-0" />
              <span>{booking.staffNumber}</span>
            </div>
          </div>
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {booking.process}
          </span>
        </div>

        {/* Details — compact two-column grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 truncate">{booking.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 truncate">{booking.location}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 col-span-2">
            <Navigation className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 truncate">{booking.route}</span>
          </div>
        </div>

        {/* Address */}
        {booking.address && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5">
            <Package className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 line-clamp-1">{booking.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
