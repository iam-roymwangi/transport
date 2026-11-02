'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle2, Clock, CalendarDays, MapPin } from 'lucide-react';
import { ROLE_INFO, StaffRole } from '@/lib/booking-options';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface StaffScheduleClientProps {
  staff: any;
  schedules: any[];
}

export function StaffScheduleClient({ staff, schedules }: StaffScheduleClientProps) {
  const role = (staff?.role as StaffRole) || 'Agent';
  const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">My Work Schedule</h1>
            <Badge variant="outline" className={roleMeta.badgeColor}>
              {role}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            View your shifts assigned by Workforce Management (WFM) and automated transport bookings.
          </p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No Active Schedule Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Workforce Management (WFM) has not assigned an active schedule for your account yet. Once published, your monthly shifts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {schedules.map((schedule) => {
            const startStr = format(new Date(schedule.startDate), 'MMM dd, yyyy');
            const endStr = format(new Date(schedule.endDate), 'MMM dd, yyyy');
            const workingDays = schedule.workingDays as number[];

            return (
              <Card key={schedule.id} className="overflow-hidden border-primary/20 shadow-sm">
                <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold text-slate-900">
                          {schedule.shift}
                        </CardTitle>
                        {schedule.shift.includes('02:00') || schedule.shift.includes('01:00') || schedule.shift.includes('03:00') || schedule.shift.includes('05:00') ? (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-normal">
                            🌙 Overnight Shift
                          </Badge>
                        ) : null}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span>Schedule Period: <strong>{startStr}</strong> &mdash; <strong>{endStr}</strong></span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {schedule.lastSyncedAt ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Transport Bookings Automated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 py-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Transport Sync
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Working Days */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Working Days</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAY_NAMES.map((dayName, idx) => {
                        const isWorking = workingDays.includes(idx);
                        return (
                          <div
                            key={dayName}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                              isWorking
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-muted/40 text-muted-foreground border-border opacity-50'
                            }`}
                          >
                            {dayName}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transport Details Preview for this schedule */}
                  <div className="p-4 rounded-xl bg-slate-50 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        Destination Hub: <strong>{staff.location || 'Not set'}</strong> &bull; Route: <strong>{staff.route || 'Not set'}</strong>
                        {staff.pinLocation && (
                          <span className="text-muted-foreground ml-1">({staff.pinLocation})</span>
                        )}
                      </div>
                    </div>
                    {schedule.lastSyncedAt && (
                      <span className="text-muted-foreground text-[11px]">
                        Last synced: {format(new Date(schedule.lastSyncedAt), 'MMM dd, HH:mm')}
                      </span>
                    )}
                  </div>

                  {schedule.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border">
                      <strong>WFM Note:</strong> {schedule.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
