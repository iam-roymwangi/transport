'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Route, Activity, Edit2, Loader2, Clock } from 'lucide-react';
import type { Booking, BookingEditRequest } from '@prisma/client';
import { submitEditRequestAction } from '../actions';

interface StaffDashboardClientProps {
  initialBookings: Booking[];
  pendingRequests: BookingEditRequest[];
}

export function StaffDashboardClient({ initialBookings, pendingRequests }: StaffDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const pendingBookingIds = new Set(pendingRequests.map(r => r.bookingId));

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBooking) return;
    
    const formData = new FormData(e.currentTarget);
    const requestedChanges = {
      name: formData.get('name') as string,
      staffNumber: formData.get('staffNumber') as string,
      process: formData.get('process') as string,
      shift: formData.get('shift') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      route: formData.get('route') as string,
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

  return (
    <div className="space-y-4">
      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Request Edit</DialogTitle>
              <DialogDescription>
                Submit your proposed changes. This will be sent to the administrator for approval.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" defaultValue={editingBooking?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staffNumber" className="text-right">Staff ID</Label>
                <Input id="staffNumber" name="staffNumber" defaultValue={editingBooking?.staffNumber} className="col-span-3" required readOnly className="bg-muted" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="process" className="text-right">Process</Label>
                <Input id="process" name="process" defaultValue={editingBooking?.process || ''} className="col-span-3" />
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
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" name="location" defaultValue={editingBooking?.location || ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">Route</Label>
                <Input id="route" name="route" defaultValue={editingBooking?.route || ''} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift & Date</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  You have no bookings.
                </TableCell>
              </TableRow>
            ) : (
              initialBookings.map((booking) => {
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
                        {booking.process ? (
                          <>
                            <Activity className="h-3 w-3 text-muted-foreground" />
                            {booking.process}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                      <div className="flex items-center gap-1 text-sm">
                        {booking.route ? (
                          <>
                            <Route className="h-3 w-3 text-muted-foreground" />
                            {booking.route}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPendingEdit ? (
                         <Badge variant="secondary" className="text-amber-600 bg-amber-100/50">
                           <Clock className="w-3 h-3 mr-1" />
                           Pending Edit
                         </Badge>
                      ) : (
                         <Badge variant="secondary" className="text-emerald-600 bg-emerald-100/50">
                           Active
                         </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={isPendingEdit}
                        onClick={() => {
                          setEditingBooking(booking);
                          setIsEditDialogOpen(true);
                        }}
                      >
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
