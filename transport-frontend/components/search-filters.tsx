'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export interface SearchFilters {
  name: string
  staffNumber: string
  phoneNumber: string
}

interface SearchFiltersProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  resultCount: number
  totalCount: number
}

export function SearchFiltersBar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: SearchFiltersProps) {
  const hasActiveFilter = filters.name || filters.staffNumber || filters.phoneNumber

  const clear = () => onChange({ name: '', staffNumber: '', phoneNumber: '' })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
            className="pl-9 bg-white"
          />
          {filters.name && (
            <button
              onClick={() => onChange({ ...filters, name: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Staff Number */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by staff no..."
            value={filters.staffNumber}
            onChange={(e) => onChange({ ...filters, staffNumber: e.target.value })}
            className="pl-9 bg-white"
          />
          {filters.staffNumber && (
            <button
              onClick={() => onChange({ ...filters, staffNumber: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Phone Number */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by mobile no..."
            value={filters.phoneNumber}
            onChange={(e) => onChange({ ...filters, phoneNumber: e.target.value })}
            className="pl-9 bg-white"
          />
          {filters.phoneNumber && (
            <button
              onClick={() => onChange({ ...filters, phoneNumber: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Result count + clear */}
      {hasActiveFilter && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-800">{resultCount}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-800">{totalCount}</span>
            {' '}bookings
          </p>
          <Button variant="ghost" size="sm" onClick={clear} className="gap-1.5 text-slate-500 hover:text-slate-800 h-7">
            <X className="w-3.5 h-3.5" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
