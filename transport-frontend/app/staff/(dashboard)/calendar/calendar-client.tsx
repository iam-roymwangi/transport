'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function StaffCalendarClient({ bookedDates }: { bookedDates: Record<string, number> }) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ];

  const today = todayStr();

  // Stats for the month
  const monthKeys = Object.keys(bookedDates).filter(k => k.startsWith(`${year}-${String(month).padStart(2, '0')}`));
  const bookedCount = monthKeys.length;
  const totalDays = daysInMonth;
  const unbookedCount = totalDays - bookedCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">Your booked and available days at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{bookedCount}</p>
              <p className="text-xs text-muted-foreground">Days booked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Circle className="w-8 h-8 text-slate-300 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-slate-500">{unbookedCount}</p>
              <p className="text-xs text-muted-foreground">Days not booked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Booked
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-200 inline-block" />
                Not booked
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-primary inline-block" />
                Today
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{MONTHS[month - 1]} {year}</h2>
            {(year !== now.getFullYear() || month !== now.getMonth() + 1) && (
              <Button variant="outline" size="sm" className="text-xs h-7"
                onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}>
                Today
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <CardContent className="p-3 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="aspect-square" />;

              const dateStr = toDateStr(year, month, day);
              const isBooked = !!bookedDates[dateStr];
              const count = bookedDates[dateStr] ?? 0;
              const isToday = dateStr === today;
              const isPast = dateStr < today;

              return (
                <button
                  key={dateStr}
                  onClick={() => isBooked && router.push(`/staff?date=${dateStr}`)}
                  className={`
                    relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5
                    transition-all duration-150
                    ${isBooked
                      ? 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer hover:scale-105'
                      : isPast
                        ? 'bg-slate-50 opacity-40 cursor-default'
                        : 'bg-slate-50 cursor-default'
                    }
                    ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                  `}
                >
                  <span className={`text-xs sm:text-sm font-semibold leading-none
                    ${isToday ? 'text-primary' : isBooked ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  {isBooked && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-emerald-500 text-white leading-none">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Booked days list */}
      {monthKeys.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">Booked days — {MONTHS[month - 1]} {year}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {monthKeys.sort().map(date => {
                const d = new Date(date + 'T00:00:00');
                const isPast = date < today;
                return (
                  <button key={date} onClick={() => !isPast && router.push(`/staff?date=${date}`)}
                    disabled={isPast}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border border-slate-100 transition-colors
                      ${isPast ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer bg-white'}`}>
                    <span className="font-medium text-slate-700">
                      {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {bookedDates[date]}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
