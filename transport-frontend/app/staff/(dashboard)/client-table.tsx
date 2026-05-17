'use client';

import { useState, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Activity, Edit2, Loader2, Clock, Navigation, CalendarIcon, X } from 'lucide-react';
import type { Booking, BookingEditRequest } from '@prisma/client';
import { submitEditRequestAction } from '../actions';
import { LOCATIONS, ROUTES, PROCESSES, SHIFTS } from '@/lib/booking-options';

interface StaffDashboardClientProps {
  initialBookings: Booking[];
  pendingRequests: BookingEditRequest[];
}

export function StaffDashboardClient({ initialBookings, pendingRequests }: StaffDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState('');

  // Controlled select state for edit modal
  const [editLocation, setEditLocation] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editProcess, setEditProcess] = useState('');
  const [editRoute, setEditRoute] = useState('');

  const pendingBookingIds = new Set(pendingRequests.map(r => r.bookingId));

  // Apply date filter
  const filteredBookings = useMemo(() => {
    return initialBookings.filter((b) => {
      const d = new Date(b.date).toISOString().split('T')[0];
      if (dateFilter && d !== dateFilter) return false;
      return true;
    });
  }, [initialBookings, dateFilter]);

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setEditLocation(booking.location ?? '');
    setEditShift(booking.shift ?? '');
    setEditProcess(booking.process ?? '');
    setEditRoute(booking.route ?? '');
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBooking) return;
    const formData = new FormData(e.currentTarget);
    const requestedChanges = {
      name: formData.get('name') as string,
      staffNumber: formData.get('staffNumber') as string,
      process: editProcess,
      shift: editShift,
      date: formData.get('date') as string,
      location: editLocation,
      route: editRoute,
      address: formData.get('address') as string,
    };
    startTransition(async () => {
      const result = await submitEditRequestAction(editingBooking.id, requestedChanges);
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingBooking(null);
        router.refresh();
      } else {
        alert(result.error || 'Failed to submit edit request');
      }
    });
  };

  const clearDates = () => { setDateFilter(''); };

  return (
    <div className="space-y-4">
      {/* ── Date filter ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-slate-700">Filter by date</span>
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); }}
            className="h-8 text-sm w-36" />
          {dateFilter && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={clearDates} className="h-8 gap-1 text-xs">
                <X className="w-3 h-3" /> Clear
              </Button>
            </div>
          )}
        </div>
        {dateFilter && (
          <span className="text-xs text-muted-foreground self-end">
            {filteredBookings.length} of {initialBookings.length} bookings
          </span>
        )}
      </div>

      {/* ── Edit Request Dialog ──────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Request Edit</DialogTitle>
              <DialogDescription>
                Proposed changes will be sent to the administrator for approval.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-sm">Name</Label>
                <Input id="name" name="name" defaultValue={editingBooking?.name}
                  className="col-span-3" required />
              </div>

              {/* Staff ID — read only */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staffNumber" className="text-right text-sm">Staff ID</Label>
                <Input id="staffNumber" name="staffNumber" defaultValue={editingBooking?.staffNumber}
                  className="col-span-3 bg-muted" readOnly />
              </div>

              {/* Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right text-sm">Date</Label>
                <Input id="date" name="date" type="date"
                  defaultValue={editingBooking?.date ? format(new Date(editingBooking.date), 'yyyy-MM-dd') : ''}
                  min={new Date().toISOString().split('T')[0]}
                  className="col-span-3" required />
              </div>

              {/* Shift */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">Shift</Label>
                <div className="col-span-3">
                  <Select value={editShift} onValueChange={setEditShift}>
                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">Location</Label>
                <div className="col-span-3">
                  <Select value={editLocation} onValueChange={setEditLocation}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">Route</Label>
                <div className="col-span-3">
                  <Select value={editRoute} onValueChange={setEditRoute}>
                    <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                    <SelectContent>
                      {ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Process */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm">Process</Label>
                <div className="col-span-3">
                  <Select value={editProcess} onValueChange={setEditProcess}>
                    <SelectTrigger><SelectValue placeholder="Select process" /></SelectTrigger>
                    <SelectContent>
                      {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="address" className="text-right text-sm pt-2">Address</Label>
                <Textarea id="address" name="address"
                  defaultValue={(editingBooking as any)?.address ?? ''}
                  placeholder="Enter address..." className="col-span-3" rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift &amp; Date</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {initialBookings.length === 0 ? 'You have no bookings.' : 'No bookings match the selected date.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => {
                const isPendingEdit = pendingBookingIds.has(booking.id);
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">{booking.shift}</Badge>
                        <div className="text-sm font-medium">{format(new Date(booking.date), 'MMM d, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {booking.process
                          ? <><Activity className="h-3 w-3 text-muted-foreground" />{booking.process}</>
                          : <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {booking.location
                          ? <><MapPin className="h-3 w-3 text-muted-foreground" />{booking.location}</>
                          : <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {booking.route
                          ? <><Navigation className="h-3 w-3 text-muted-foreground" />{booking.route}</>
                          : <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPendingEdit ? (
                        <Badge variant="secondary" className="text-amber-600 bg-amber-100/50">
                          <Clock className="w-3 h-3 mr-1" />Pending Edit
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-emerald-600 bg-emerald-100/50">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled={isPendingEdit}
                        onClick={() => openEditDialog(booking)}>
                        <Edit2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        Request Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
