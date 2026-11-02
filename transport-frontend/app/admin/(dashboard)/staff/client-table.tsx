'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  MapPin,
  Route,
  User,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Navigation,
  ExternalLink,
  Edit,
  Compass,
} from 'lucide-react';
import type { Staff } from '@prisma/client';
import {
  STAFF_ROLES,
  StaffRole,
  ROLE_INFO,
  LOCATIONS,
  ROUTES,
  PROCESSES,
  SHIFTS,
} from '@/lib/booking-options';
import {
  extractCoordinates,
  buildGoogleMapsUrl,
  calculateDistanceToHub,
} from '@/lib/googleMaps';
import { updateStaffRoleAndTransportAction } from '../../wfm-actions';

interface StaffClientTableProps {
  initialStaff: Staff[];
}

export function StaffClientTable({ initialStaff }: StaffClientTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [geoLocating, setGeoLocating] = useState(false);

  // Edit form state
  const [editRole, setEditRole] = useState<string>('Agent');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editRoute, setEditRoute] = useState<string>('');
  const [editShift, setEditShift] = useState<string>('');
  const [editProcess, setEditProcess] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editMapsUrl, setEditMapsUrl] = useState<string>('');
  const [editLat, setEditLat] = useState<string>('');
  const [editLng, setEditLng] = useState<string>('');

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setEditRole((staff as any).role || 'Agent');
    setEditPhone(staff.phoneNumber || '');
    setEditLocation(staff.location || '');
    setEditRoute(staff.route || '');
    setEditShift(staff.currentShift || '');
    setEditProcess(staff.process || '');
    setEditAddress(staff.address || '');
    setEditMapsUrl((staff as any).googleMapsUrl || '');
    setEditLat((staff as any).latitude ? String((staff as any).latitude) : '');
    setEditLng((staff as any).longitude ? String((staff as any).longitude) : '');
    setIsEditDialogOpen(true);
  };

  const handleMapsUrlChange = (url: string) => {
    setEditMapsUrl(url);
    const coords = extractCoordinates(url);
    if (coords) {
      setEditLat(coords.latitude.toString());
      setEditLng(coords.longitude.toString());
      toast.success(`Coordinates extracted: ${coords.latitude}, ${coords.longitude}`);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const url = buildGoogleMapsUrl(lat, lng);
        setEditLat(lat.toString());
        setEditLng(lng.toString());
        setEditMapsUrl(url);
        setGeoLocating(false);
        toast.success('Coordinates retrieved from GPS');
      },
      () => {
        setGeoLocating(false);
        toast.error('Could not detect location');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const distanceInfo =
    editLat && editLng && editLocation
      ? calculateDistanceToHub(
          { latitude: parseFloat(editLat), longitude: parseFloat(editLng) },
          editLocation
        )
      : null;

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    startTransition(async () => {
      const latVal = editLat ? parseFloat(editLat) : null;
      const lngVal = editLng ? parseFloat(editLng) : null;
      const res = await updateStaffRoleAndTransportAction(editingStaff.id, {
        role: editRole,
        phoneNumber: editPhone,
        location: editLocation,
        route: editRoute,
        currentShift: editShift,
        process: editProcess,
        address: editAddress,
        googleMapsUrl: editMapsUrl,
        latitude: latVal,
        longitude: lngVal,
        pinLocation: latVal && lngVal ? `${latVal}, ${lngVal}` : undefined,
      });

      if (res.success) {
        toast.success(`Updated ${editingStaff.name} transport details!`);
        setIsEditDialogOpen(false);
        router.refresh();
      } else {
        toast.error('Failed to update staff details');
      }
    });
  };

  // Filter staff based on search term & role
  const filteredStaff = useMemo(() => {
    return initialStaff.filter((s) => {
      const lowerSearch = searchTerm.toLowerCase();
      const bms = ((s as any).bmsNumber || '').toLowerCase();
      const matchesSearch =
        !searchTerm ||
        s.name.toLowerCase().includes(lowerSearch) ||
        s.staffNumber.toLowerCase().includes(lowerSearch) ||
        bms.includes(lowerSearch);

      const staffRole = (s as any).role || 'Agent';
      const matchesRole = roleFilter === 'ALL' || staffRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [initialStaff, searchTerm, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to Excel function
  const handleExport = () => {
    const exportData = filteredStaff.map((s) => ({
      'Employee Name': s.name,
      'BMS Number': (s as any).bmsNumber || 'N/A',
      'Staff Number': s.staffNumber,
      'Role': (s as any).role || 'Agent',
      'Phone Number': s.phoneNumber || 'N/A',
      'Location': s.location || 'N/A',
      'Current Shift': s.currentShift || 'N/A',
      'Process': s.process || 'N/A',
      'Route': s.route || 'N/A',
      'Address': s.address || 'N/A',
      'Latitude': (s as any).latitude || 'N/A',
      'Longitude': (s as any).longitude || 'N/A',
      'Google Maps URL': (s as any).googleMapsUrl || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Directory');

    const wscols = [
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 },
      { wch: 12 }, { wch: 35 },
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Staff_Directory.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or staff ID..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
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
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
          <Button variant="outline" className="w-full lg:w-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Directory
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee &amp; Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location Hub &amp; Shift</TableHead>
              <TableHead>Route &amp; Process</TableHead>
              <TableHead>Exact Destination / GPS</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No staff members found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              currentStaff.map((staff) => {
                const role = ((staff as any).role as StaffRole) || 'Agent';
                const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;
                const lat = (staff as any).latitude;
                const lng = (staff as any).longitude;
                const mapsUrl = (staff as any).googleMapsUrl;

                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{staff.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono font-bold text-primary">
                              {(staff as any).bmsNumber ? `BMS: ${(staff as any).bmsNumber}` : staff.staffNumber}
                            </span>
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${roleMeta.badgeColor}`}>
                              {role}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({staff.staffNumber})
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {staff.phoneNumber ? (
                          <>
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{staff.phoneNumber}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          {staff.location ? (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{staff.location}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="w-fit font-normal text-xs">
                          {staff.currentShift || 'No Shift Assigned'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          {staff.route ? (
                            <>
                              <Route className="h-3 w-3 text-muted-foreground" />
                              <span>{staff.route}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Process: {staff.process || '-'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="truncate max-w-[200px] text-slate-700" title={staff.address || ''}>
                          {staff.address || '-'}
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
                        ) : (
                          <span className="text-muted-foreground text-[11px]">No GPS Pin</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(staff)}
                        className="h-8 text-xs gap-1"
                      >
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        Edit Details
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} employees
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

      {/* Edit Staff & Transport Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveStaff}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Edit Staff &amp; Transport Details: {editingStaff?.name}
              </DialogTitle>
              <DialogDescription>
                Update employee role (Agent, Supervisor, QA, IT, OAM, OM) and shared transport coordinates.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Staff Role</Label>
                  <Select value={editRole} onValueChange={setEditRole} disabled={isPending}>
                    <SelectTrigger id="staff-role">
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

                <div className="space-y-2">
                  <Label htmlFor="staff-phone">Phone Number</Label>
                  <Input
                    id="staff-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-loc">Office Hub Location</Label>
                  <Select value={editLocation} onValueChange={setEditLocation} disabled={isPending}>
                    <SelectTrigger id="staff-loc">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-route">Transport Route</Label>
                  <Select value={editRoute} onValueChange={setEditRoute} disabled={isPending}>
                    <SelectTrigger id="staff-route">
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-shift">Current Shift</Label>
                  <Select value={editShift} onValueChange={setEditShift} disabled={isPending}>
                    <SelectTrigger id="staff-shift">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-process">Process</Label>
                  <Select value={editProcess} onValueChange={setEditProcess} disabled={isPending}>
                    <SelectTrigger id="staff-process">
                      <SelectValue placeholder="Select process" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESSES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-address">Destination Address</Label>
                <Input
                  id="staff-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Roysambu Lumumba Dr"
                  disabled={isPending}
                />
              </div>

              {/* Exact Google Maps Destination Pin & Coordinates */}
              <div className="p-4 rounded-xl border bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800">
                    Exact Google Maps Pin Location
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseGps}
                    disabled={geoLocating || isPending}
                    className="h-7 text-xs gap-1"
                  >
                    {geoLocating ? <Spinner className="w-3 h-3" /> : <Compass className="w-3 h-3 text-primary" />}
                    Use GPS
                  </Button>
                </div>

                <div className="space-y-1">
                  <Input
                    placeholder="Paste Google Maps URL"
                    value={editMapsUrl}
                    onChange={(e) => handleMapsUrlChange(e.target.value)}
                    className="text-xs font-mono"
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Latitude</span>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-1.2612"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      className="text-xs font-mono"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Longitude</span>
                    <Input
                      type="number"
                      step="any"
                      placeholder="36.8044"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      className="text-xs font-mono"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {distanceInfo && (
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <Navigation className="w-3 h-3" />
                      Distance to {distanceInfo.hubName}: {distanceInfo.distanceKm} km
                    </span>
                    {editMapsUrl && (
                      <a
                        href={editMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-0.5 text-xs"
                      >
                        Map <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Spinner className="w-4 h-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
