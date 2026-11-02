'use client';

import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  Search,
  Download,
  CalendarDays,
  User,
  Users,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import {
  getAgentMonthlyRosterAction,
  updateAgentDayShiftAction,
  batchApplyAgentPatternAction,
  updateAgentSupervisorAction,
} from '../../wfm-actions';

const SHIFT_OPTIONS = [
  { value: 'OFF', label: 'OFF (Rest Day)', short: 'OFF', color: 'bg-slate-100 text-slate-500 hover:bg-slate-200' },
  { value: '17:00 - 02:00', label: '17:00 - 02:00 (5pm - 2am 🌙)', short: '17-02', isOvernight: true, color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' },
  { value: '12:00 - 21:00', label: '12:00 - 21:00 (Midday)', short: '12-21', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' },
  { value: '13:00 - 21:30/22:00', label: '13:00 - 21:30/22:00', short: '13-22', color: 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200' },
  { value: '14:30/15:00 - 00:00', label: '14:30 - 00:00 🌙', short: '14-00', isOvernight: true, color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200' },
  { value: '16:00 - 01:00', label: '16:00 - 01:00 🌙', short: '16-01', isOvernight: true, color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200' },
  { value: '18:00 - 03:00', label: '18:00 - 03:00 🌙', short: '18-03', isOvernight: true, color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200' },
  { value: '20:00 - 05:00', label: '20:00 - 05:00 (Night 🌙)', short: '20-05', isOvernight: true, color: 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200' },
  { value: '08:00 - 17:00', label: '08:00 - 17:00 (Morning)', short: '08-17', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' },
];

interface AgentRosterTableProps {
  initialRosterData: {
    monthStr: string;
    monthDays: Array<{
      dayNum: number;
      dateStr: string;
      dayOfWeek: number;
      dayName: string;
    }>;
    agents: Array<{
      id: string;
      name: string;
      bmsNumber?: string | null;
      staffNumber: string;
      supervisorName?: string | null;
      supervisorId?: string | null;
      location?: string | null;
      route?: string | null;
      address?: string | null;
      currentShift?: string | null;
      process?: string | null;
    }>;
    supervisors: Array<{
      id: string;
      name: string;
      bmsNumber?: string | null;
    }>;
    bookingsMap: Record<string, Record<number, { shift: string; bookingId: string }>>;
  };
}

export function AgentRosterTable({ initialRosterData }: AgentRosterTableProps) {
  const [isPending, startTransition] = useTransition();

  // State
  const [currentMonth, setCurrentMonth] = useState<string>(initialRosterData.monthStr || '2026-11');
  const [monthDays, setMonthDays] = useState(initialRosterData.monthDays);
  const [agents, setAgents] = useState(initialRosterData.agents);
  const [supervisors, setSupervisors] = useState(initialRosterData.supervisors);
  const [bookingsMap, setBookingsMap] = useState(initialRosterData.bookingsMap);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');

  // Quick Pattern Modal
  const [patternAgent, setPatternAgent] = useState<any | null>(null);
  const [patternShift, setPatternShift] = useState('17:00 - 02:00');
  const [patternRestPreset, setPatternRestPreset] = useState<number[]>([5, 6]); // Fri & Sat rest
  const [isPatternOpen, setIsPatternOpen] = useState(false);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const lower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        agent.name.toLowerCase().includes(lower) ||
        agent.staffNumber.toLowerCase().includes(lower) ||
        (agent.bmsNumber && agent.bmsNumber.toLowerCase().includes(lower)) ||
        (agent.supervisorName && agent.supervisorName.toLowerCase().includes(lower));

      const matchesSup =
        supervisorFilter === 'ALL' || agent.supervisorName === supervisorFilter;

      return matchesSearch && matchesSup;
    });
  }, [agents, searchTerm, supervisorFilter]);

  // Navigate months
  const handleMonthChange = async (newMonth: string) => {
    setCurrentMonth(newMonth);
    startTransition(async () => {
      try {
        const data = await getAgentMonthlyRosterAction(newMonth);
        setMonthDays(data.monthDays);
        setAgents(data.agents);
        setSupervisors(data.supervisors);
        setBookingsMap(data.bookingsMap);
      } catch {
        toast.error('Failed to load roster for ' + newMonth);
      }
    });
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    const nextStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(nextStr);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(Date.UTC(y, m, 1));
    const nextStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(nextStr);
  };

  // Editable Cell Handler: Updates shift immediately
  const handleCellShiftChange = async (
    staffNumber: string,
    dayNum: number,
    dateStr: string,
    newShift: string
  ) => {
    // 1. Optimistic update
    setBookingsMap((prev) => {
      const updated = { ...prev };
      if (!updated[staffNumber]) {
        updated[staffNumber] = {};
      }
      if (newShift === 'OFF') {
        delete updated[staffNumber][dayNum];
      } else {
        updated[staffNumber][dayNum] = {
          shift: newShift,
          bookingId: updated[staffNumber][dayNum]?.bookingId || 'temp',
        };
      }
      return updated;
    });

    // 2. Server mutation
    try {
      const res = await updateAgentDayShiftAction({
        staffNumber,
        dateStr,
        shift: newShift,
      });
      if (!res.success) {
        toast.error('Could not save shift change');
      }
    } catch {
      toast.error('Failed to update shift');
    }
  };

  // Inline Supervisor Change
  const handleSupervisorChange = async (staffNumber: string, newSup: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.staffNumber === staffNumber ? { ...a, supervisorName: newSup } : a))
    );
    try {
      await updateAgentSupervisorAction({
        staffNumber,
        supervisorName: newSup,
      });
      toast.success('Supervisor updated');
    } catch {
      toast.error('Failed to update supervisor');
    }
  };

  // Batch Pattern Fill
  const handleApplyPattern = async () => {
    if (!patternAgent) return;
    const workingDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !patternRestPreset.includes(d));

    startTransition(async () => {
      try {
        const res = await batchApplyAgentPatternAction({
          staffNumber: patternAgent.staffNumber,
          monthStr: currentMonth,
          shift: patternShift,
          workingDays,
        });

        if (res.success) {
          toast.success(`Applied shift pattern for ${patternAgent.name} (${res.updatedCount} days scheduled).`);
          setIsPatternOpen(false);
          // Refresh month roster
          const data = await getAgentMonthlyRosterAction(currentMonth);
          setBookingsMap(data.bookingsMap);
        } else {
          toast.error('Failed to apply pattern');
        }
      } catch {
        toast.error('Error applying shift pattern');
      }
    });
  };

  // Export Roster to Excel
  const handleExportRoster = () => {
    const exportData = filteredAgents.map((agent) => {
      const row: any = {
        'Agent Name': agent.name,
        'BMS Number': agent.bmsNumber || 'N/A',
        'Staff ID': agent.staffNumber,
        'Supervisor': agent.supervisorName || 'Not Assigned',
        'Campaign': agent.process || 'N/A',
      };

      let workCount = 0;
      let restCount = 0;

      for (const d of monthDays) {
        const booking = bookingsMap[agent.staffNumber]?.[d.dayNum];
        const val = booking ? booking.shift : 'OFF';
        row[`${d.dayNum} ${d.dayName}`] = val;
        if (val === 'OFF') {
          restCount++;
        } else {
          workCount++;
        }
      }

      row['Total Work Days'] = workCount;
      row['Total Rest Days'] = restCount;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Agents_${currentMonth}`);
    XLSX.writeFile(workbook, `WFM_Agent_Roster_${currentMonth}.xlsx`);
  };

  // Helper to format short badge text
  const getShiftBadge = (shiftStr?: string) => {
    if (!shiftStr || shiftStr === 'OFF') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500 border border-slate-200">
          OFF
        </span>
      );
    }
    const option = SHIFT_OPTIONS.find((s) => s.value === shiftStr);
    const shortText = option?.short || shiftStr.substring(0, 5);
    const isOvernight = shiftStr.includes('02:00') || shiftStr.includes('01:00') || shiftStr.includes('03:00') || shiftStr.includes('05:00');

    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border flex items-center gap-0.5 ${
          option?.color || 'bg-purple-100 text-purple-800 border-purple-200'
        }`}
      >
        {shortText}
        {isOvernight && <span className="text-[9px]">🌙</span>}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl bg-card border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Agent Monthly Shift Roster (1st to Last Day)
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {filteredAgents.length} Agents
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete day-by-day shift matrix with inline editable cells. Changes instantly automate transport bookings.
          </p>
        </div>

        {/* Month Navigator & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              disabled={isPending}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold px-2 text-slate-800 font-mono">
              {format(new Date(`${currentMonth}-01`), 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              disabled={isPending}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportRoster}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Month Roster
          </Button>
        </div>
      </div>

      {/* Filter Toolbar & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agent, BMS no, supervisor..."
              className="pl-8 h-8 text-xs bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Supervisor Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Supervisor:</span>
            <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
              <SelectTrigger className="h-8 text-xs w-48 bg-white">
                <SelectValue placeholder="All Supervisors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Supervisors</SelectItem>
                {supervisors.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} (BMS: {s.bmsNumber || '-'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-500">Legend:</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold">
            17-02 🌙 (5pm-2am)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-bold">
            12-21 (Day)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200 font-bold">
            20-05 🌙 (Night)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-bold">
            OFF (Rest Day)
          </span>
        </div>
      </div>

      {/* Large Roster Matrix Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-xs border-collapse">
            {/* Table Header */}
            <thead className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur border-b">
              <tr>
                {/* Frozen Column 1: Agent Name */}
                <th className="sticky left-0 z-40 bg-slate-100 px-3 py-2.5 text-left font-bold text-slate-800 min-w-[150px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r">
                  Agent Name
                </th>

                {/* Frozen Column 2: BMS No */}
                <th className="sticky left-[150px] z-40 bg-slate-100 px-3 py-2.5 text-left font-bold text-slate-800 min-w-[100px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r">
                  BMS No
                </th>

                {/* Frozen Column 3: Supervisor */}
                <th className="sticky left-[250px] z-40 bg-slate-100 px-3 py-2.5 text-left font-bold text-slate-800 min-w-[150px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] border-r">
                  Supervisor
                </th>

                {/* Day Columns (Day 1 to 28/30/31) */}
                {monthDays.map((d) => {
                  const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6; // Sun or Sat
                  return (
                    <th
                      key={d.dayNum}
                      className={`px-1.5 py-2 text-center font-bold min-w-[62px] border-r ${
                        isWeekend ? 'bg-amber-50/70 text-amber-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground uppercase">{d.dayName}</div>
                      <div className="text-xs font-bold">{d.dayNum}</div>
                    </th>
                  );
                })}

                {/* Summary Work/Rest Days Column */}
                <th className="sticky right-0 z-40 bg-slate-100 px-3 py-2.5 text-center font-bold text-slate-800 min-w-[90px] shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] border-l">
                  Work / Rest
                </th>
                <th className="px-2 py-2.5 text-center font-bold text-slate-800 min-w-[70px]">
                  Pattern
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={monthDays.length + 5} className="text-center py-12 text-muted-foreground">
                    No agents found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  let workCount = 0;
                  let restCount = 0;

                  for (const d of monthDays) {
                    const booking = bookingsMap[agent.staffNumber]?.[d.dayNum];
                    if (booking && booking.shift !== 'OFF') {
                      workCount++;
                    } else {
                      restCount++;
                    }
                  }

                  return (
                    <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Frozen Column 1: Agent Name */}
                      <td className="sticky left-0 z-20 bg-card px-3 py-2 border-r shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)] font-medium text-slate-900 truncate max-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate font-semibold" title={agent.name}>
                            {agent.name}
                          </span>
                        </div>
                      </td>

                      {/* Frozen Column 2: BMS No */}
                      <td className="sticky left-[150px] z-20 bg-card px-3 py-2 border-r shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                        <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                          {agent.bmsNumber || agent.staffNumber}
                        </span>
                      </td>

                      {/* Frozen Column 3: Supervisor (Editable) */}
                      <td className="sticky left-[250px] z-20 bg-card px-2 py-1.5 border-r shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]">
                        <Select
                          value={agent.supervisorName || ''}
                          onValueChange={(val) => handleSupervisorChange(agent.staffNumber, val)}
                        >
                          <SelectTrigger className="h-7 text-[11px] w-full border-transparent hover:border-slate-300 bg-transparent px-1.5">
                            <SelectValue placeholder="Assign Sup" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Day Columns 1 to 28/30/31 (Editable Cells) */}
                      {monthDays.map((d) => {
                        const booking = bookingsMap[agent.staffNumber]?.[d.dayNum];
                        const currentShift = booking ? booking.shift : 'OFF';
                        const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;

                        return (
                          <td
                            key={d.dayNum}
                            className={`p-1 text-center border-r transition-colors ${
                              isWeekend ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            <Select
                              value={currentShift}
                              onValueChange={(val) =>
                                handleCellShiftChange(agent.staffNumber, d.dayNum, d.dateStr, val)
                              }
                            >
                              <SelectTrigger className="h-7 w-full min-w-[56px] border-none bg-transparent hover:bg-slate-200/60 p-0.5 justify-center shadow-none focus:ring-1">
                                {getShiftBadge(currentShift)}
                              </SelectTrigger>
                              <SelectContent align="center" className="min-w-[190px]">
                                {SHIFT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold">{opt.short}</span>
                                      <span className="text-muted-foreground text-[11px]">&mdash; {opt.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      })}

                      {/* Summary Col: Work / Rest */}
                      <td className="sticky right-0 z-20 bg-card px-2 py-2 text-center border-l shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.04)] font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold">{workCount}W</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-slate-500 font-medium">{restCount}R</span>
                      </td>

                      {/* Quick Pattern Action */}
                      <td className="px-1 py-1 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPatternAgent(agent);
                            setIsPatternOpen(true);
                          }}
                          title="Apply 5-work / 2-rest pattern to this agent"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Modal: Apply Shift Pattern across Month */}
      <Dialog open={isPatternOpen} onOpenChange={setIsPatternOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Monthly Schedule Pattern
            </DialogTitle>
            <DialogDescription>
              Apply a 5-day work / 2-day rest shift rotation across the entire month of {currentMonth} for <strong>{patternAgent?.name}</strong> (BMS: {patternAgent?.bmsNumber}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">Assigned Shift</span>
              <Select value={patternShift} onValueChange={setPatternShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_OPTIONS.filter((s) => s.value !== 'OFF').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">2 Rest Days Policy</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Friday & Saturday', days: [5, 6] },
                  { label: 'Saturday & Sunday', days: [6, 0] },
                  { label: 'Sunday & Monday', days: [0, 1] },
                  { label: 'Friday & Monday', days: [5, 1] },
                ].map((preset) => {
                  const isSelected = JSON.stringify(patternRestPreset) === JSON.stringify(preset.days);
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setPatternRestPreset(preset.days)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary font-bold shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              This will update all {monthDays.length} days of {currentMonth} for {patternAgent?.name}: 5 active working days per week and 2 rest days. Existing transport bookings will be synced automatically.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPatternOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplyPattern}
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              {isPending && <Spinner className="w-4 h-4" />}
              Apply Month Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
