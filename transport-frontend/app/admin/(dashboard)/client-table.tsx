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
import { MapPin, Route, User, Download, Search, ChevronLeft, ChevronRight, Activity, Trash2, Loader2, Edit2 } from 'lucide-react';
import type { Booking } from '@prisma/client';
import { deleteBookingsAction, updateBookingAction } from '../actions';

interface ClientTableProps {
  initialBookings: Booking[];
}

export function ClientTable({ initialBookings }: ClientTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
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
      const matchesSearch =
        !searchTerm ||
        b.name.toLowerCase().includes(lowerSearch) ||
        b.staffNumber.toLowerCase().includes(lowerSearch);

      const matchesDate = !dateFilter || format(new Date(b.date), 'yyyy-MM-dd') === dateFilter;
      const matchesProcess = processFilter === 'all' || b.process === processFilter;

      return matchesSearch && matchesDate && matchesProcess;
    });
  }, [initialBookings, searchTerm, dateFilter, processFilter]);

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

  const isAllCurrentPageSelected = currentBookings.length > 0 && currentBookings.every((b) => selectedIds.has(b.id));

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
      process: formData.get('process') as string,
      shift: formData.get('shift') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      route: formData.get('route') as string,
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
      'Phone Number': b.phoneNumber || 'N/A',
      'Shift': b.shift,
      'Date': format(new Date(b.date), 'yyyy-MM-dd'),
      'Location': b.location || 'N/A',
      'Route': b.route || 'N/A',
      'Address': b.address || 'N/A',
      'Process': b.process || 'N/A',
      'Booked On': format(new Date(b.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    
    const wscols = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, 
      { wch: 15 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Transport_Bookings_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Make changes to the booking here. Click save when you're done.
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
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or staff id..."
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

          {/* Process Filter */}
          <div className="w-full sm:w-48">
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
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the {selectedIds.size} selected booking{selectedIds.size === 1 ? '' : 's'} from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline" className="w-full lg:w-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
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
              <TableHead>Employee</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Shift & Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              currentBookings.map((booking) => (
                <TableRow key={booking.id} data-state={selectedIds.has(booking.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(booking.id)} 
                      onCheckedChange={(checked) => handleSelectRow(booking.id, checked as boolean)} 
                      aria-label={`Select booking for ${booking.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{booking.name}</div>
                        <div className="text-xs text-muted-foreground">{booking.staffNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      {booking.process ? (
                        <>
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{booking.process}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit">{booking.shift}</Badge>
                      <div className="text-sm">{format(new Date(booking.date), 'MMM d, yyyy')}</div>
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
                    <div className="flex items-center gap-1 text-sm">
                      {booking.address ? (
                        <>
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {booking.address}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Edit Booking"
                      onClick={() => {
                        setEditingBooking(booking);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} entries
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
