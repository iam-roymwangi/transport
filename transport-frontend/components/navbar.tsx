'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AddBookingForm } from '@/components/add-booking-form'
import {
  LayoutDashboard,
  CalendarDays,
  Download,
  Menu,
  X,
  Bus,
} from 'lucide-react'

interface NavbarProps {
  onExport?: () => void
  exportDisabled?: boolean
  onBookingAdded?: () => void
}

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

export function Navbar({ onExport, exportDisabled, onBookingAdded }: NavbarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-base leading-tight text-foreground">
                Transport Booking System
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Fleet &amp; shift management
              </p>
            </div>
            <span className="sm:hidden text-base text-foreground">Transport Booking</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={exportDisabled}
                onClick={onExport}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
            <AddBookingForm onBookingAdded={onBookingAdded} />
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              )
            })}

            {/* Mobile actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {onExport && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={exportDisabled}
                  onClick={() => { onExport(); setMenuOpen(false) }}
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
