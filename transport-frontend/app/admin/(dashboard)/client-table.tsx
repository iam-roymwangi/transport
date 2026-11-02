'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MapPin,
  Route,
  User,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trash2,
  Loader2,
  Edit2,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import type { Booking } from '@prisma/client';
import { deleteBookingsAction, updateBookingAction } from '../actions';
import { STAFF_ROLES, StaffRole, ROLE_INFO } from '@/lib/booking-options';

interface ClientTableProps {
  initialBookings: Booking[];
}

export function ClientTable({ initialBookings }: ClientTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const itemsPerPage = 10;

  // Extract unique processes for the filter dropdown
  const uniqueProcesses = useMemo(() => {
    const processes = initialBookings.map((b) => b.process).filter(Boolean) as string[];
    return Array.from(new Set(processes)).sort();
  }, [initialBookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return initialBookings.filter((b) => {
      const lowerSearch = searchTerm.toLowerCase();
      const bms = ((b as any).bmsNumber || '').toLowerCase();
      const matchesSearch =
        !searchTerm ||
        b.name.toLowerCase().includes(lowerSearch) ||
        b.staffNumber.toLowerCase().includes(lowerSearch) ||
        bms.includes(lowerSearch);

      const matchesDate = !dateFilter || format(new Date(b.date), 'yyyy-MM-dd') === dateFilter;
      const matchesProcess = processFilter === 'all' || b.process === processFilter;
      const bookingRole = (b as any).role || 'Agent';
      const matchesRole = roleFilter === 'ALL' || bookingRole === roleFilter;

      return matchesSearch && matchesDate && matchesProcess && matchesRole;
    });
  }, [initialBookings, searchTerm, dateFilter, processFilter, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedIds);
      currentBookings.forEach((b) => newSelected.add(b.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      currentBookings.forEach((b) => newSelected.delete(b.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllCurrentPageSelected =
    currentBookings.length > 0 && currentBookings.every((b) => selectedIds.has(b.id));

  // Delete handler
  const handleDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    startTransition(async () => {
      const result = await deleteBookingsAction(idsToDelete);
      if (result.success) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete bookings');
      }
    });
  };

  // Edit handler
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBooking) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      name: formData.get('name') as string,
      staffNumber: formData.get('staffNumber') as string,
      role: formData.get('role') as string,
      process: formData.get('process') as string,
      shift: formData.get('shift') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      route: formData.get('route') as string,
      address: formData.get('address') as string,
    };

    startTransition(async () => {
      const result = await updateBookingAction(editingBooking.id, updatedData);
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingBooking(null);
        router.refresh();
      } else {
        alert(result.error || 'Failed to update booking');
      }
    });
  };

  // Export to Excel function
  const handleExport = () => {
    const exportData = filteredBookings.map((b) => ({
      'Employee Name': b.name,
      'Staff Number': b.staffNumber,
      'Role': (b as any).role || 'Agent',
      'Phone Number': b.phoneNumber || 'N/A',
      'Shift': b.shift,
      'Date': format(new Date(b.date), 'yyyy-MM-dd'),
      'Location Hub': b.location || 'N/A',
      'Route': b.route || 'N/A',
      'Address': b.address || 'N/A',
      'Coordinates': (b as any).latitude && (b as any).longitude
        ? `${(b as any).latitude}, ${(b as any).longitude}`
        : 'N/A',
      'Google Maps URL': (b as any).googleMapsUrl || 'N/A',
      'Process': b.process || 'N/A',
      'Booked On': format(new Date(b.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    const wscols = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 22 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(
      workbook,
      `Transport_Bookings_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
  };

  return (
    <div className="space-y-4">
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Transport Booking</DialogTitle>
              <DialogDescription>
                Make changes to this transport booking. Changes update immediate driver rosters.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" defaultValue={editingBooking?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staffNumber" className="text-right">Staff ID</Label>
                <Input id="staffNumber" name="staffNumber" defaultValue={editingBooking?.staffNumber} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Input id="role" name="role" defaultValue={(editingBooking as any)?.role || 'Agent'} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift" className="text-right">Shift</Label>
                <Input id="shift" name="shift" defaultValue={editingBooking?.shift} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editingBooking?.date ? format(new Date(editingBooking.date), 'yyyy-MM-dd') : ''} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Hub</Label>
                <Input id="location" name="location" defaultValue={editingBooking?.location || ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">Route</Label>
                <Input id="route" name="route" defaultValue={editingBooking?.route || ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Address</Label>
                <Input id="address" name="address" defaultValue={(editingBooking as any)?.address || ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="process" className="text-right">Process</Label>
                <Input id="process" name="process" defaultValue={editingBooking?.process || ''} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Filter */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or ID..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Date Filter */}
          <div className="relative w-full sm:w-auto">
            <Input
              type="date"
              className="w-full sm:w-auto"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-36">
            <ShadcnSelect
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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
            </ShadcnSelect>
          </div>

          {/* Process Filter */}
          <div className="w-full sm:w-40">
            <ShadcnSelect
              value={processFilter}
              onValueChange={(val) => {
                setProcessFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Processes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processes</SelectItem>
                {uniqueProcesses.map((process) => (
                  <SelectItem key={process} value={process}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the {selectedIds.size} selected booking{selectedIds.size === 1 ? '' : 's'}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline" className="w-full lg:w-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Bookings
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllCurrentPageSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Employee &amp; Role</TableHead>
              <TableHead>Shift &amp; Date</TableHead>
              <TableHead>Location Hub</TableHead>
              <TableHead>Route &amp; Process</TableHead>
              <TableHead>Destination &amp; GPS Pin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No transport bookings found.
                </TableCell>
              </TableRow>
            ) : (
              currentBookings.map((booking) => {
                const role = ((booking as any).role as StaffRole) || 'Agent';
                const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;
                const isOvernight =
                  booking.shift.includes('02:00') ||
                  booking.shift.includes('01:00') ||
                  booking.shift.includes('03:00') ||
                  booking.shift.includes('05:00');
                const lat = (booking as any).latitude;
                const lng = (booking as any).longitude;
                const mapsUrl = (booking as any).googleMapsUrl;

                return (
                  <TableRow
                    key={booking.id}
                    data-state={selectedIds.has(booking.id) ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(booking.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(booking.id, checked as boolean)
                        }
                        aria-label={`Select booking for ${booking.name}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{booking.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono font-bold text-primary">
                              {(booking as any).bmsNumber ? `BMS: ${(booking as any).bmsNumber}` : booking.staffNumber}
                            </span>
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${roleMeta.badgeColor}`}>
                              {role}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({booking.staffNumber})
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="w-fit">{booking.shift}</Badge>
                          {isOvernight && <span title="Overnight shift">🌙</span>}
                        </div>
                        <div className="text-sm font-medium">
                          {format(new Date(booking.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {booking.location ? (
                          <>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {booking.location}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        <div className="flex items-center gap-1">
                          {booking.route ? (
                            <>
                              <Route className="h-3 w-3 text-muted-foreground" />
                              {booking.route}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.process || '-'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="truncate max-w-[180px] text-slate-700" title={booking.address || ''}>
                          {booking.address || '-'}
                        </div>
                        {lat && lng ? (
                          <a
                            href={mapsUrl || `https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <Navigation className="h-3 w-3" />
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBooking(booking);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of{' '}
            {filteredBookings.length} bookings
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
