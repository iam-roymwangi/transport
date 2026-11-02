'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CalendarRange, Sparkles, User, Users, CheckCircle2 } from 'lucide-react';
import { STAFF_ROLES, StaffRole, ROLE_INFO, PROCESSES } from '@/lib/booking-options';
import { createScheduleAction } from '../../wfm-actions';

// Week starts on Sunday (index 0) and ends on Saturday (index 6)
const DAYS_OF_WEEK = [
  { label: 'Sunday', short: 'Sun', value: 0 },
  { label: 'Monday', short: 'Mon', value: 1 },
  { label: 'Tuesday', short: 'Tue', value: 2 },
  { label: 'Wednesday', short: 'Wed', value: 3 },
  { label: 'Thursday', short: 'Thu', value: 4 },
  { label: 'Friday', short: 'Fri', value: 5 },
  { label: 'Saturday', short: 'Sat', value: 6 },
];

// Campaign Rest Day Presets (2 rest days per week, week Sun-Sat)
const CAMPAIGN_REST_PRESETS: Record<
  string,
  Array<{ label: string; restDays: number[]; workingDays: number[] }>
> = {
  'Caption Call': [
    { label: 'Friday & Saturday', restDays: [5, 6], workingDays: [0, 1, 2, 3, 4] },
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
    { label: 'Sunday & Monday', restDays: [0, 1], workingDays: [2, 3, 4, 5, 6] },
    { label: 'Friday & Monday', restDays: [5, 1], workingDays: [0, 2, 3, 4, 6] },
  ],
  BT: [
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
    { label: 'Friday & Saturday', restDays: [5, 6], workingDays: [0, 1, 2, 3, 4] },
  ],
  wynZ: [
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
    { label: 'Sunday & Monday', restDays: [0, 1], workingDays: [2, 3, 4, 5, 6] },
  ],
  BD: [
    { label: 'Sunday & Monday', restDays: [0, 1], workingDays: [2, 3, 4, 5, 6] },
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
  ],
  'BT Safety': [
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
    { label: 'Friday & Saturday', restDays: [5, 6], workingDays: [0, 1, 2, 3, 4] },
  ],
  Vinted: [
    { label: 'Friday & Saturday', restDays: [5, 6], workingDays: [0, 1, 2, 3, 4] },
    { label: 'Saturday & Sunday', restDays: [6, 0], workingDays: [1, 2, 3, 4, 5] },
  ],
};

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: any[];
  shiftsList: any[];
  onCreated: () => void;
}

export function ScheduleModal({
  open,
  onOpenChange,
  staffList,
  shiftsList,
  onCreated,
}: ScheduleModalProps) {
  const [loading, setLoading] = useState(false);

  // Month or custom range selection
  const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. "2026-11"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  // Dates
  const [startDate, setStartDate] = useState<string>(() => {
    const [y, m] = currentMonthStr.split('-');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const [y, m] = currentMonthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
  });

  // Campaign & Role
  const [selectedCampaign, setSelectedCampaign] = useState<string>('Caption Call');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Agent');
  const [assignmentMode, setAssignmentMode] = useState<'ROLE' | 'SPECIFIC'>('SPECIFIC');
  const [selectedStaffNumbers, setSelectedStaffNumbers] = useState<string[]>([]);

  // Shift & working days: Default Sun-Thu working (Fri-Sat rest) for Caption Call, or Mon-Fri (Sat-Sun rest)
  const [selectedShift, setSelectedShift] = useState<string>('17:00 - 02:00');
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun to Thu (Fri & Sat rest)
  const [notes, setNotes] = useState<string>('');
  const [autoGenerateBookings, setAutoGenerateBookings] = useState<boolean>(true);

  // Handle month change
  const handleMonthChange = (monthVal: string) => {
    setSelectedMonth(monthVal);
    const [y, m] = monthVal.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`);
    setEndDate(`${y}-${String(m).padStart(2, '0')}-${lastDay}`);
  };

  // Rest days calculation
  const restDays = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !workingDays.includes(d));
  }, [workingDays]);

  const restDayNames = useMemo(() => {
    return restDays.map((d) => DAYS_OF_WEEK.find((w) => w.value === d)?.label).join(' & ');
  }, [restDays]);

  // Campaign presets
  const campaignPresets = useMemo(() => {
    return CAMPAIGN_REST_PRESETS[selectedCampaign] || CAMPAIGN_REST_PRESETS['Caption Call'];
  }, [selectedCampaign]);

  const applyRestDayPreset = (presetWorkingDays: number[]) => {
    setWorkingDays(presetWorkingDays);
  };

  // Filter staff by role & campaign if applicable
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => !selectedRole || s.role === selectedRole);
  }, [staffList, selectedRole]);

  // Shifts available for selected role
  const availableShifts = useMemo(() => {
    const roleShifts = shiftsList.filter((s) => s.role === selectedRole && s.isActive);
    if (roleShifts.length > 0) return roleShifts;
    return [
      { shiftLabel: '17:00 - 02:00', name: 'Flexible Evening (5pm - 2am)', isOvernight: true },
      { shiftLabel: '12:00 - 21:00', name: 'Day Shift', isOvernight: false },
      { shiftLabel: '13:00 - 22:00', name: 'Afternoon Shift', isOvernight: false },
      { shiftLabel: '20:00 - 05:00', name: 'Night Shift', isOvernight: true },
      { shiftLabel: '08:00 - 17:00', name: 'Standard Day', isOvernight: false },
    ];
  }, [shiftsList, selectedRole]);

  const toggleDay = (dayVal: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const toggleSelectAllStaff = () => {
    if (selectedStaffNumbers.length === filteredStaff.length) {
      setSelectedStaffNumbers([]);
    } else {
      setSelectedStaffNumbers(filteredStaff.map((s) => s.staffNumber));
    }
  };

  const toggleStaff = (staffNumber: string) => {
    setSelectedStaffNumbers((prev) =>
      prev.includes(staffNumber) ? prev.filter((s) => s !== staffNumber) : [...prev, staffNumber]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetStaffNumbers =
      assignmentMode === 'ROLE'
        ? filteredStaff.map((s) => s.staffNumber)
        : selectedStaffNumbers;

    if (targetStaffNumbers.length === 0) {
      toast.error('Please select at least one staff member or choose a role with active employees.');
      return;
    }

    if (workingDays.length === 0) {
      toast.error('Please select at least one active working day.');
      return;
    }

    setLoading(true);
    try {
      const scheduleNotes = `Campaign: ${selectedCampaign}. Rest Days: ${restDayNames}. ${notes}`.trim();
      const res = await createScheduleAction({
        staffNumbers: targetStaffNumbers,
        role: selectedRole,
        shift: selectedShift,
        startDate,
        endDate,
        workingDays,
        notes: scheduleNotes,
        autoGenerateBookings,
      });

      if (res.success) {
        toast.success(
          `Successfully created ${res.schedulesCount} schedule(s)!` +
            (autoGenerateBookings
              ? ` Automated ${res.automatedBookingsCount} transport bookings.`
              : '')
        );
        onCreated();
        onOpenChange(false);
      } else {
        toast.error('Failed to create schedule');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while creating schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" />
              Create &amp; Assign Monthly Schedule
            </DialogTitle>
            <DialogDescription>
              Assign flexible shifts (e.g., 5pm to 2am) on a Sunday-to-Saturday week with 2 rest days per week.
            </DialogDescription>
          </DialogHeader>

          {/* Schedule Duration / Month */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-900">Schedule Duration</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCustomRange(!isCustomRange)}
                className="text-xs text-primary"
              >
                {isCustomRange ? 'Switch to Month Selector' : 'Use Custom Date Range'}
              </Button>
            </div>

            {!isCustomRange ? (
              <div className="space-y-1">
                <Label htmlFor="month-picker" className="text-xs text-muted-foreground">Select Month (usually 1 month)</Label>
                <Input
                  id="month-picker"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  disabled={loading}
                  className="w-full sm:w-60"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Active range: <strong>{startDate}</strong> to <strong>{endDate}</strong>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campaign & Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sched-campaign">Campaign / Process</Label>
              <Select
                value={selectedCampaign}
                onValueChange={(val) => {
                  setSelectedCampaign(val);
                  // Apply default rest days for campaign
                  const defaultPreset = CAMPAIGN_REST_PRESETS[val]?.[0];
                  if (defaultPreset) {
                    setWorkingDays(defaultPreset.workingDays);
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="sched-campaign">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESSES.map((proc) => (
                    <SelectItem key={proc} value={proc}>
                      {proc} {proc === 'Caption Call' && '🌟 (Fri-Mon Rest Days)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sched-role">Staff Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(val: StaffRole) => {
                  setSelectedRole(val);
                  setSelectedStaffNumbers([]);
                }}
                disabled={loading}
              >
                <SelectTrigger id="sched-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} &mdash; {ROLE_INFO[r]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-2">
            <Label htmlFor="sched-shift">Assigned Shift for {selectedRole}</Label>
            <Select
              value={selectedShift}
              onValueChange={setSelectedShift}
              disabled={loading}
            >
              <SelectTrigger id="sched-shift">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {availableShifts.map((s: any) => (
                  <SelectItem key={s.shiftLabel || s.shift} value={s.shiftLabel || s.shift}>
                    {s.shiftLabel || s.shift} {s.isOvernight ? '🌙 (Overnight 5pm - 2am)' : ''} &mdash; {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Rest Days & Working Days (Sun - Sat Week) */}
          <div className="p-4 rounded-xl border bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs font-semibold text-slate-900">
                  Week Cycle: Sunday to Saturday &bull; 2 Rest Days
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {selectedCampaign === 'Caption Call'
                    ? 'For Caption Call, rest days range from Friday to Monday. All staff have 2 rest days per week.'
                    : 'All staff have 2 rest days per week (5 working days).'}
                </p>
              </div>

              {workingDays.length === 5 ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] self-start sm:self-auto gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  5 Work Days / 2 Rest Days
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] self-start sm:self-auto">
                  {workingDays.length} Work Days ({7 - workingDays.length} Rest Days)
                </Badge>
              )}
            </div>

            {/* Quick Presets for 2 Rest Days */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Rest Day Presets for {selectedCampaign}:
              </span>
              <div className="flex flex-wrap gap-2">
                {campaignPresets.map((preset) => {
                  const isCurrent =
                    JSON.stringify(workingDays.slice().sort()) ===
                    JSON.stringify(preset.workingDays.slice().sort());
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => applyRestDayPreset(preset.workingDays)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        isCurrent
                          ? 'bg-primary text-white border-primary font-bold shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {preset.label} (Rest)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sunday to Saturday Work Days Picker */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-700 mb-1.5 block">
                Active Working Days (Sunday &rarr; Saturday):
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isWork = workingDays.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition-all ${
                        isWork
                          ? 'bg-primary text-white border-primary font-bold shadow-sm'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <div>{day.short}</div>
                      <div className="text-[10px] mt-0.5 opacity-90">
                        {isWork ? 'Work' : 'Rest'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">Assign To Staff</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={assignmentMode === 'ROLE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssignmentMode('ROLE')}
                  className="h-7 text-xs gap-1"
                >
                  <Users className="w-3 h-3" />
                  All {selectedRole}s ({filteredStaff.length})
                </Button>
                <Button
                  type="button"
                  variant={assignmentMode === 'SPECIFIC' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssignmentMode('SPECIFIC')}
                  className="h-7 text-xs gap-1"
                >
                  <User className="w-3 h-3" />
                  Specific Staff
                </Button>
              </div>
            </div>

            {assignmentMode === 'SPECIFIC' && (
              <div className="border rounded-xl p-3 bg-card max-h-48 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-xs text-muted-foreground">
                    {selectedStaffNumbers.length} of {filteredStaff.length} staff selected
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAllStaff}
                    className="h-6 text-xs text-primary"
                  >
                    {selectedStaffNumbers.length === filteredStaff.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
                {filteredStaff.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No active staff found with role &quot;{selectedRole}&quot;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredStaff.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs select-none"
                      >
                        <Checkbox
                          checked={selectedStaffNumbers.includes(staff.staffNumber)}
                          onCheckedChange={() => toggleStaff(staff.staffNumber)}
                          disabled={loading}
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900">{staff.name}</span>
                          <span className="text-primary ml-1.5 font-mono font-bold">
                            BMS: {staff.bmsNumber || staff.staffNumber}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transport Booking Automation Toggle */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="auto-book" className="font-semibold text-sm text-slate-900 cursor-pointer">
                  Automate Transport Bookings
                </Label>
              </div>
              <Checkbox
                id="auto-book"
                checked={autoGenerateBookings}
                onCheckedChange={(c) => setAutoGenerateBookings(!!c)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When checked, transport bookings will be automatically booked for all 5 scheduled working days each week using their 7-digit BMS number and shared destination coordinates.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Spinner className="w-4 h-4" />}
              Publish &amp; Assign Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
