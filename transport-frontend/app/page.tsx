import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bus, Users, Shield, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-base leading-tight text-foreground">Transport Booking System</p>
              <p className="text-[11px] text-slate-500 leading-tight">Fleet &amp; shift management</p>
            </div>
            <span className="sm:hidden font-bold text-base text-foreground">TBS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/staff/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Staff Portal</span>
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 py-20 sm:py-28 lg:py-36">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Bus className="w-4 h-4" />
              Transport Booking System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Smarter transport{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                booking for your team
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Manage staff transport bookings by shift, prevent duplicates, import from Microsoft Forms,
              and export driver assignment sheets — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/staff/login">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg px-8 text-base">
                  <Users className="w-5 h-5" />
                  Staff Portal
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  <Shield className="w-5 h-5" />
                  Admin Portal
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              {['Duplicate detection', 'Excel import & export', 'Mobile friendly'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4" />
            <span>Transport Booking System</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/staff/login" className="hover:text-slate-700 transition-colors">Staff Portal</Link>
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Admin Portal</Link>
            <Link href="/calendar" className="hover:text-slate-700 transition-colors">Calendar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
