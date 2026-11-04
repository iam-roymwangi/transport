'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  CalendarClock,
  Plus,
  Sparkles,
  CalendarDays,
  Users,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  MapPin,
  RefreshCw,
  ExternalLink,
  TableProperties,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { STAFF_ROLES, StaffRole, ROLE_INFO } from '@/lib/booking-options';
import { ScheduleModal } from './schedule-modal';
import { ShiftConfigModal } from './shift-config-modal';
import { AgentRosterTable } from './agent-roster-table';
import {
  generateBookingsForScheduleAction,
  deleteScheduleAction,
  deleteShiftConfigAction,
  batchAutomateMonthBookingsAction,
} from '../../wfm-actions';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WfmDashboardProps {
  initialSchedules: any[];
  initialShifts: any[];
  initialStaff: any[];
  initialCampaigns?: any[];
  initialRosterData?: any;
}

export function WfmDashboard({
  initialSchedules,
  initialShifts,
  initialStaff,
  initialCampaigns = [],
  initialRosterData,
}: WfmDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<any | null>(null);
  const [shiftRoleTarget, setShiftRoleTarget] = useState<string>('Agent');

  // Filters state
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [shiftRoleFilter, setShiftRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [syncingScheduleId, setSyncingScheduleId] = useState<string | null>(null);

  // Tab state with loading effect
  const [activeTab, setActiveTab] = useState<string>('roster');
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);
  const [isTabPending, startTabTransition] = useTransition();

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    setIsTabSwitching(true);
    startTabTransition(() => {
      setActiveTab(newTab);
      setTimeout(() => {
        setIsTabSwitching(false);
      }, 250);
    });
  };

  const TAB_LABELS: Record<string, string> = {
    roster: 'Agent Monthly Shift Roster',
    schedules: 'Monthly Schedules & Roster',
    shifts: 'Adjustable Role Shifts',
    campaigns: 'Campaign Rest Days Policy',
  };

  // Schedules Table Pagination state
  const [schedulePage, setSchedulePage] = useState<number>(1);
  const [schedulePageSize, setSchedulePageSize] = useState<number>(10);

  // Reset page when search or role filter changes
  useEffect(() => {
    setSchedulePage(1);
  }, [searchTerm, roleFilter]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return initialSchedules.filter((sched) => {
      if (roleFilter !== 'ALL' && sched.role !== roleFilter) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const staffName = sched.staff?.name?.toLowerCase() || '';
        const staffNum = sched.staffNumber.toLowerCase();
        const bms = (sched.staff?.bmsNumber || '').toLowerCase();
        if (!staffName.includes(lower) && !staffNum.includes(lower) && !bms.includes(lower)) return false;
      }
      return true;
    });
  }, [initialSchedules, roleFilter, searchTerm]);

  // Paginated schedules calculation
  const totalSchedules = filteredSchedules.length;
  const totalSchedulePages = Math.max(1, Math.ceil(totalSchedules / schedulePageSize));
  const safeSchedulePage = Math.min(schedulePage, totalSchedulePages);
  const scheduleStartIndex = (safeSchedulePage - 1) * schedulePageSize;
  const scheduleEndIndex = Math.min(scheduleStartIndex + schedulePageSize, totalSchedules);
  const paginatedSchedules = useMemo(() => {
    return filteredSchedules.slice(scheduleStartIndex, scheduleEndIndex);
  }, [filteredSchedules, scheduleStartIndex, scheduleEndIndex]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return initialShifts.filter((s) => {
      if (shiftRoleFilter !== 'ALL' && s.role !== shiftRoleFilter) return false;
      return true;
    });
  }, [initialShifts, shiftRoleFilter]);

  // Quick stats
  const activeSchedulesCount = initialSchedules.length;
  const staffWithSchedules = new Set(initialSchedules.map((s) => s.staffNumber)).size;
  const totalStaffCount = initialStaff.length;

  // Handler: Sync / Automate bookings for a single schedule
  const handleGenerateForSchedule = async (scheduleId: string) => {
    setSyncingScheduleId(scheduleId);
    try {
      const res = await generateBookingsForScheduleAction(scheduleId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to automate bookings');
      }
    } catch {
      toast.error('An error occurred during booking automation');
    } finally {
      setSyncingScheduleId(null);
    }
  };

  // Handler: Delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    startTransition(async () => {
      const res = await deleteScheduleAction(scheduleId);
      if (res.success) {
        toast.success('Schedule deleted');
        router.refresh();
      } else {
        toast.error('Failed to delete schedule');
      }
    });
  };

  // Handler: Delete shift config
  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    startTransition(async () => {
      const res = await deleteShiftConfigAction(shiftId);
      if (res.success) {
        toast.success('Shift configuration removed');
        router.refresh();
      } else {
        toast.error('Failed to remove shift');
      }
    });
  };

  // Handler: Batch automate all active schedules
  const handleBatchAutomate = async () => {
    startTransition(async () => {
      const res = await batchAutomateMonthBookingsAction(
        roleFilter !== 'ALL' ? roleFilter : undefined
      );
      if (res.success) {
        toast.success(
          `Batch Automation complete! Created ${res.totalCreated} bookings across ${res.schedulesProcessed} schedules.`
        );
        router.refresh();
      } else {
        toast.error('Batch automation failed');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Workforce Management (WFM) Rostering
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create monthly flexible schedules for all staff roles and automate transport bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShiftToEdit(null);
              setShiftRoleTarget(roleFilter !== 'ALL' ? roleFilter : 'Agent');
              setIsShiftModalOpen(true);
            }}
            className="gap-1.5 text-xs flex-1 sm:flex-initial"
          >
            <Clock className="w-3.5 h-3.5" />
            Adjust Role Shifts
          </Button>

          <Button
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            className="gap-1.5 text-xs bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-sm flex-1 sm:flex-initial"
          >
            <Plus className="w-3.5 h-3.5" />
            Create &amp; Assign Schedule
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeSchedulesCount}</div>
            <p className="text-xs text-muted-foreground">
              Assigned monthly staff rosters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Coverage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffWithSchedules} / {totalStaffCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees with active schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adjustable Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured across 6 roles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Automate Bookings</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              onClick={handleBatchAutomate}
              disabled={isPending || activeSchedulesCount === 0}
              className="w-full h-8 text-xs gap-1.5"
            >
              {isPending ? <Spinner className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync All Schedules
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="bg-slate-100/90 p-1 border inline-flex w-auto min-w-full sm:min-w-0 justify-start h-auto gap-1">
            <TabsTrigger value="roster" className="gap-2 font-semibold whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm shrink-0">
              <TableProperties className="w-4 h-4 text-primary" />
              Agent Monthly Shift Roster
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm shrink-0">
              <CalendarDays className="w-4 h-4" />
              Monthly Schedules &amp; Roster ({activeSchedulesCount})
            </TabsTrigger>
            <TabsTrigger value="shifts" className="gap-2 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm shrink-0">
              <Clock className="w-4 h-4" />
              Adjustable Role Shifts ({initialShifts.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm shrink-0">
              <Users className="w-4 h-4" />
              Campaign Rest Days ({initialCampaigns.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Switch Loading Bar */}
        {(isTabSwitching || isTabPending) && (
          <div className="relative w-full h-1 bg-slate-100 overflow-hidden rounded-full animate-in fade-in duration-150">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-primary animate-pulse w-full" />
          </div>
        )}

        {(isTabSwitching || isTabPending) ? (
          <Card className="border shadow-sm">
            <CardContent className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-in fade-in-50 duration-200">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Spinner className="w-4 h-4 text-primary absolute" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Loading {TAB_LABELS[activeTab] || 'tab data'}...
              </div>
              <p className="text-xs text-muted-foreground">
                Preparing views and schedule configurations
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tab 0: Large Agent Monthly Roster Matrix */}
            <TabsContent value="roster" className="space-y-4">
              {initialRosterData ? (
                <AgentRosterTable initialRosterData={initialRosterData} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Spinner className="w-6 h-6 mx-auto mb-2" />
                    Loading Agent Monthly Shift Roster...
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab 1: Schedules & Rosters */}
            <TabsContent value="schedules" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base sm:text-lg">Staff Rosters &amp; Transport Automation</CardTitle>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {totalSchedules} Total
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Assigned flexible shifts automatically book daily transport using staff destination coordinates.
                      </CardDescription>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                      {/* Role filter */}
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Roles</SelectItem>
                          {STAFF_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Search */}
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search employee, BMS..."
                          className="pl-8 h-8 text-xs w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Desktop & Tablet Table View (hidden on mobile < md) */}
                  <div className="hidden md:block rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[940px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/70">
                            <TableHead className="w-[230px] min-w-[200px]">Employee &amp; Role</TableHead>
                            <TableHead className="w-[150px] min-w-[130px]">Assigned Shift</TableHead>
                            <TableHead className="w-[150px] min-w-[130px]">Duration Period</TableHead>
                            <TableHead className="w-[170px] min-w-[150px]">Working Days</TableHead>
                            <TableHead className="w-[200px] min-w-[170px]">Transport Destination</TableHead>
                            <TableHead className="w-[140px] min-w-[120px]">Automation Status</TableHead>
                            <TableHead className="w-[120px] min-w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchedules.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                No schedules found matching criteria. Click &quot;Create &amp; Assign Schedule&quot; to assign monthly shifts.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedSchedules.map((schedule) => {
                              const staff = schedule.staff;
                              const role = (schedule.role as StaffRole) || 'Agent';
                              const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;
                              const isOvernight =
                                schedule.shift.includes('02:00') ||
                                schedule.shift.includes('01:00') ||
                                schedule.shift.includes('03:00') ||
                                schedule.shift.includes('05:00');

                              const isSyncing = syncingScheduleId === schedule.id;

                              return (
                                <TableRow key={schedule.id} className="hover:bg-slate-50/50">
                                  <TableCell>
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-slate-900 text-sm truncate max-w-[200px]">
                                        {staff?.name || schedule.staffNumber}
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-mono font-bold text-primary">
                                          {staff?.bmsNumber ? `BMS: ${staff.bmsNumber}` : schedule.staffNumber}
                                        </span>
                                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${roleMeta.badgeColor}`}>
                                          {role}
                                        </Badge>
                                        <span className="text-[11px] text-muted-foreground font-mono">
                                          ({schedule.staffNumber})
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-sm text-slate-800">{schedule.shift}</span>
                                        {isOvernight && (
                                          <span title="Overnight shift (cross-midnight)" className="text-xs">
                                            🌙
                                          </span>
                                        )}
                                      </div>
                                      {isOvernight && (
                                        <span className="text-[11px] text-indigo-600 font-medium">Overnight</span>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="text-xs text-slate-700 space-y-0.5">
                                      <div className="font-medium">{format(new Date(schedule.startDate), 'MMM dd, yyyy')}</div>
                                      <div className="text-muted-foreground">to {format(new Date(schedule.endDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                      {DAY_LABELS.map((d, i) => {
                                        const active = (schedule.workingDays as number[]).includes(i);
                                        return (
                                          <span
                                            key={d}
                                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                              active
                                                ? 'bg-primary text-white'
                                                : 'bg-muted text-muted-foreground/40'
                                            }`}
                                          >
                                            {d}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex flex-col text-xs max-w-[190px] space-y-0.5">
                                      <div className="flex items-center gap-1 font-medium text-slate-800 truncate">
                                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                                        <span className="truncate">{staff?.location || '-'} &bull; {staff?.route || '-'}</span>
                                      </div>
                                      {staff?.latitude && staff?.longitude ? (
                                        <a
                                          href={staff.googleMapsUrl || `https://www.google.com/maps?q=${staff.latitude},${staff.longitude}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                                        >
                                          Coords: {staff.latitude.toFixed(4)}, {staff.longitude.toFixed(4)}
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      ) : (
                                        <span className="text-[11px] text-amber-600">Pin coords pending</span>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    {schedule.lastSyncedAt ? (
                                      <div className="flex flex-col gap-0.5">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] w-fit gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          Bookings Synced
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                          {format(new Date(schedule.lastSyncedAt), 'MMM dd, HH:mm')}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] w-fit">
                                        Pending Sync
                                      </Badge>
                                    )}
                                  </TableCell>

                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleGenerateForSchedule(schedule.id)}
                                        disabled={isSyncing}
                                        title="Generate/Update daily transport bookings from this schedule"
                                        className="h-8 text-xs text-primary gap-1"
                                      >
                                        {isSyncing ? (
                                          <Spinner className="w-3.5 h-3.5" />
                                        ) : (
                                          <Sparkles className="w-3.5 h-3.5" />
                                        )}
                                        Automate
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Schedule Cards View (visible on < md) */}
                  <div className="block md:hidden space-y-3">
                    {filteredSchedules.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border bg-muted/10">
                        No schedules found matching criteria. Click &quot;Create &amp; Assign Schedule&quot; to assign monthly shifts.
                      </div>
                    ) : (
                      paginatedSchedules.map((schedule) => {
                        const staff = schedule.staff;
                        const role = (schedule.role as StaffRole) || 'Agent';
                        const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;
                        const isOvernight =
                          schedule.shift.includes('02:00') ||
                          schedule.shift.includes('01:00') ||
                          schedule.shift.includes('03:00') ||
                          schedule.shift.includes('05:00');
                        const isSyncing = syncingScheduleId === schedule.id;

                        return (
                          <div
                            key={schedule.id}
                            className="p-3.5 rounded-xl border bg-card hover:border-primary/30 transition-all shadow-sm space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  {staff?.name || schedule.staffNumber}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="text-xs font-mono font-bold text-primary">
                                    {staff?.bmsNumber ? `BMS: ${staff.bmsNumber}` : schedule.staffNumber}
                                  </span>
                                  <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${roleMeta.badgeColor}`}>
                                    {role}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Shift</span>
                                <div className="font-semibold text-slate-800 flex items-center gap-1">
                                  {schedule.shift}
                                  {isOvernight && <span title="Overnight">🌙</span>}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Period</span>
                                <div className="text-slate-700">
                                  {format(new Date(schedule.startDate), 'MMM dd')} - {format(new Date(schedule.endDate), 'MMM dd')}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Working Days</span>
                              <div className="flex flex-wrap gap-1">
                                {DAY_LABELS.map((d, i) => {
                                  const active = (schedule.workingDays as number[]).includes(i);
                                  return (
                                    <span
                                      key={d}
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                        active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground/40'
                                      }`}
                                    >
                                      {d}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-2 border-t text-xs space-y-1">
                              <div className="flex items-center gap-1 font-medium text-slate-800">
                                <MapPin className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{staff?.location || '-'} &bull; {staff?.route || '-'}</span>
                              </div>
                              {staff?.latitude && staff?.longitude ? (
                                <a
                                  href={staff.googleMapsUrl || `https://www.google.com/maps?q=${staff.latitude},${staff.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                >
                                  Coords: {staff.latitude.toFixed(4)}, {staff.longitude.toFixed(4)}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-amber-600 block">Pin coords pending</span>
                              )}
                            </div>

                            <div className="pt-2 border-t flex items-center justify-between gap-2">
                              {schedule.lastSyncedAt ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Synced {format(new Date(schedule.lastSyncedAt), 'MMM dd')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                  Pending Sync
                                </Badge>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateForSchedule(schedule.id)}
                                disabled={isSyncing}
                                className="h-7 text-xs text-primary gap-1"
                              >
                                {isSyncing ? <Spinner className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                Automate
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Schedules Table Pagination Controls */}
                  {totalSchedules > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
                        <span>
                          Showing <strong className="text-foreground">{scheduleStartIndex + 1}</strong> to{' '}
                          <strong className="text-foreground">{scheduleEndIndex}</strong> of{' '}
                          <strong className="text-foreground">{totalSchedules}</strong> schedules
                        </span>

                        <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                          <span className="text-[11px]">Per page:</span>
                          <Select
                            value={String(schedulePageSize)}
                            onValueChange={(val) => {
                              setSchedulePageSize(Number(val));
                              setSchedulePage(1);
                            }}
                          >
                            <SelectTrigger className="h-7 w-[68px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSchedulePage(1)}
                          disabled={safeSchedulePage === 1}
                          title="First Page"
                        >
                          <ChevronsLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                          disabled={safeSchedulePage === 1}
                          title="Previous Page"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>

                        <div className="flex items-center px-2 text-xs font-medium">
                          Page {safeSchedulePage} of {totalSchedulePages}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSchedulePage((p) => Math.min(totalSchedulePages, p + 1))}
                          disabled={safeSchedulePage === totalSchedulePages}
                          title="Next Page"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSchedulePage(totalSchedulePages)}
                          disabled={safeSchedulePage === totalSchedulePages}
                          title="Last Page"
                        >
                          <ChevronsRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

        {/* Tab 2: Adjustable Role Shifts */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Adjustable Shifts per Role</CardTitle>
                  <CardDescription>
                    Customize shift templates for Agents, Supervisors, QAs, IT, OAM, and OM. Support flexible cross-midnight hours (e.g. 5pm to 2am).
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={shiftRoleFilter} onValueChange={setShiftRoleFilter}>
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                      <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      {STAFF_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    onClick={() => {
                      setShiftToEdit(null);
                      setShiftRoleTarget(shiftRoleFilter !== 'ALL' ? shiftRoleFilter : 'Agent');
                      setIsShiftModalOpen(true);
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Shift
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShifts.map((shift) => {
                  const role = (shift.role as StaffRole) || 'Agent';
                  const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;

                  return (
                    <div
                      key={shift.id}
                      className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={roleMeta.badgeColor}>
                          {role}
                        </Badge>
                        {shift.isOvernight && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                            🌙 Overnight
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-base">{shift.shiftLabel}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{shift.name}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-600">
                        <span>
                          {shift.startTime} &rarr; {shift.endTime}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShiftToEdit(shift);
                              setShiftRoleTarget(shift.role);
                              setIsShiftModalOpen(true);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShift(shift.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Campaign Rest Days Configuration */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Campaign Rest Days Policy (Sun &rarr; Sat Week Cycle)</CardTitle>
                  <CardDescription>
                    Every staff member has 2 rest days per week (5 working days). Rest day pairs vary depending on the campaign.
                  </CardDescription>
                </div>
                <Link href="/admin/campaigns">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Open Campaign Management
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialCampaigns.map((camp: any) => {
                  const isCaptionCall = camp.name === 'Caption Call';
                  return (
                    <div
                      key={camp.id}
                      className={`p-4 rounded-xl border transition-all shadow-sm space-y-3 ${
                        isCaptionCall
                          ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-white border-primary/30'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-slate-900">{camp.name}</span>
                        {isCaptionCall && (
                          <Badge variant="outline" className="bg-primary text-white border-primary text-[10px]">
                            Fri &rarr; Mon Rest Window
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {camp.notes || 'Configured campaign schedule.'}
                      </div>

                      <div className="pt-2 border-t text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Work / Rest Policy:</span>
                          <span className="font-semibold text-slate-800">
                            {camp.workingDaysCount || 5} Work &bull; {camp.restDaysCount || 2} Rest Days
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground block">Allowed Rest Days:</span>
                          <div className="flex flex-wrap gap-1">
                            {DAY_LABELS.map((label, idx) => {
                              const isAllowed = (camp.allowedRestDays || [5, 6, 0, 1]).includes(idx);
                              return (
                                <span
                                  key={label}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    isAllowed
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </>
    )}
  </Tabs>

      {/* Modals */}
      <ScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        staffList={initialStaff}
        shiftsList={initialShifts}
        onCreated={() => router.refresh()}
      />

      <ShiftConfigModal
        open={isShiftModalOpen}
        onOpenChange={setIsShiftModalOpen}
        shiftToEdit={shiftToEdit}
        defaultRole={shiftRoleTarget}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
