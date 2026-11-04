'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import {
  Car,
  Navigation,
  MapPin,
  Users,
  Clock,
  Sparkles,
  Phone,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LOCATIONS, ROUTES, SHIFTS } from '@/lib/booking-options';
import {
  autoPlanTripsAction,
  updateTripStatusAction,
  deleteTripAction,
  saveVehicleAction,
  deleteVehicleAction,
} from '../../trip-actions';

interface TripsDashboardProps {
  initialTrips: any[];
  initialVehicles: any[];
  initialDate: string;
}

export function TripsDashboard({
  initialTrips,
  initialVehicles,
  initialDate,
}: TripsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedShift, setSelectedShift] = useState<string>('17:00 - 02:00');
  const [selectedHub, setSelectedHub] = useState<string>('Westend');
  const [tripType, setTripType] = useState<'DROPOFF' | 'PICKUP'>('DROPOFF');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Toyota HiAce Van (14-Seater)');
  const [vehicleCapacity, setVehicleCapacity] = useState('14');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Auto-dispatch confirmation dialog state
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);

  // Tab state with loading effect
  const [activeTab, setActiveTab] = useState<string>('trips');
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

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return initialTrips.filter((t) => {
      const tripDateStr = format(new Date(t.date), 'yyyy-MM-dd');
      if (tripDateStr !== selectedDate) return false;
      if (selectedShift !== 'ALL' && t.shift !== selectedShift) return false;
      if (routeFilter !== 'ALL' && t.route !== routeFilter) return false;
      if (t.type !== tripType) return false;
      return true;
    });
  }, [initialTrips, selectedDate, selectedShift, routeFilter, tripType]);

  // Statistics
  const totalPassengers = filteredTrips.reduce(
    (acc, t) => acc + (t.passengers?.length || 0),
    0
  );
  const activeFleetCount = initialVehicles.length;

  // Handler: Run carpool auto-dispatch
  const handleAutoDispatch = async () => {
    startTransition(async () => {
      const res = await autoPlanTripsAction({
        date: selectedDate,
        shift: selectedShift,
        hubLocation: selectedHub,
        type: tripType,
      });

      if (res.success) {
        toast.success(res.message);
        setIsDispatchDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to dispatch trips');
      }
    });
  };

  // Handler: Status change
  const handleStatusChange = async (tripId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateTripStatusAction(tripId, newStatus);
      if (res.success) {
        toast.success(`Trip status set to ${newStatus}`);
        router.refresh();
      } else {
        toast.error('Failed to update status');
      }
    });
  };

  // Handler: Delete trip
  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip manifest?')) return;
    startTransition(async () => {
      const res = await deleteTripAction(tripId);
      if (res.success) {
        toast.success('Trip removed');
        router.refresh();
      } else {
        toast.error('Failed to delete trip');
      }
    });
  };

  // Handler: Add vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveVehicleAction({
        plateNumber: vehiclePlate,
        model: vehicleModel,
        capacity: parseInt(vehicleCapacity),
        driverName,
        driverPhone,
        status: 'AVAILABLE',
      });
      if (res.success) {
        toast.success(`Vehicle ${vehiclePlate} added to fleet!`);
        setIsVehicleModalOpen(false);
        setVehiclePlate('');
        setDriverName('');
        setDriverPhone('');
        router.refresh();
      } else {
        toast.error('Failed to add vehicle');
      }
    });
  };

  // Export Driver Manifest
  const handleExportManifest = (trip: any) => {
    const passengers = trip.passengers || [];
    const exportData = passengers.map((p: any) => ({
      'Stop #': p.stopSequence,
      'Staff Name': p.staffName,
      'BMS Number': p.bmsNumber,
      'Phone Number': p.phoneNumber || 'N/A',
      'Destination Address': p.address || 'N/A',
      'Distance from Hub (KM)': p.distanceKm ? `${p.distanceKm} km` : 'N/A',
      'Coordinates': p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : 'N/A',
      'Status': p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Driver Manifest');
    XLSX.writeFile(
      workbook,
      `Manifest_${trip.tripNumber}_${trip.route.replace(/\s+/g, '_')}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Navigation className="w-8 h-8 text-primary" />
            Trip Tracking &amp; Carpool Dispatch
          </h1>
          <p className="text-muted-foreground mt-1">
            Carpool staff on the same route. Drop-offs: closest dropped first, farthest last. Pickups: vice versa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVehicleModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Fleet Vehicle
          </Button>

          <Button
            size="sm"
            onClick={() => setIsDispatchDialogOpen(true)}
            className="gap-1.5 text-xs bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Dispatch Carpool Trips
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispatched Trips</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredTrips.length}</div>
            <p className="text-xs text-muted-foreground">
              Trips scheduled for {selectedDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carpooled Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassengers}</div>
            <p className="text-xs text-muted-foreground">
              Employees assigned to routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Vehicles</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFleetCount}</div>
            <p className="text-xs text-muted-foreground">
              5-Seaters to 14-Seater Vans ready
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Routing Rule</CardTitle>
            <Navigation className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-semibold text-slate-800">
              {tripType === 'DROPOFF' ? 'Drop-off (Closest First)' : 'Pickup (Farthest First)'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {tripType === 'DROPOFF'
                ? 'Nearest passenger dropped 1st, farthest dropped last'
                : 'Farthest picked up 1st, closest picked up last'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Trips Manifest vs Fleet */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips" className="gap-2">
            <Navigation className="w-4 h-4" />
            Live Trips &amp; Route Manifests ({filteredTrips.length})
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
            <Car className="w-4 h-4" />
            Fleet Vehicles ({initialVehicles.length})
          </TabsTrigger>
        </TabsList>

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
                Loading {activeTab === 'trips' ? 'Live Trips & Route Manifests' : 'Fleet Vehicles'}...
              </div>
              <p className="text-xs text-muted-foreground">
                Retrieving vehicle and route assignments
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tab 1: Live Trips */}
            <TabsContent value="trips" className="space-y-4">
          {/* Filter Bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Trip Date</span>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Shift</span>
                  <Select value={selectedShift} onValueChange={setSelectedShift}>
                    <SelectTrigger className="h-8 text-xs w-48">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Shifts</SelectItem>
                      {SHIFTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Hub Location</span>
                  <Select value={selectedHub} onValueChange={setSelectedHub}>
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder="Hub" />
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

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Route</span>
                  <Select value={routeFilter} onValueChange={setRouteFilter}>
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder="All Routes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Routes</SelectItem>
                      {ROUTES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Trip Mode</span>
                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border">
                    <button
                      type="button"
                      onClick={() => setTripType('DROPOFF')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        tripType === 'DROPOFF'
                          ? 'bg-white shadow text-slate-900 font-bold'
                          : 'text-muted-foreground hover:text-slate-900'
                      }`}
                    >
                      Drop-off (Closest 1st)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType('PICKUP')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        tripType === 'PICKUP'
                          ? 'bg-white shadow text-slate-900 font-bold'
                          : 'text-muted-foreground hover:text-slate-900'
                      }`}
                    >
                      Pickup (Farthest 1st)
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trips Manifest Cards */}
          {filteredTrips.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">No Trips Dispatched for this Slot</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Click &quot;Auto-Dispatch Carpool Trips&quot; to group today&apos;s bookings by route, sequence passenger drop-offs/pickups by distance, and assign fleet vehicles.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsDispatchDialogOpen(true)}
                  className="gap-1.5 text-xs bg-gradient-to-r from-primary to-secondary mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Dispatch Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => {
                const vehicle = trip.vehicle;
                const passengers = trip.passengers || [];
                const statusColor =
                  trip.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : trip.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
                    : 'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <Card key={trip.id} className="overflow-hidden border shadow-sm">
                    {/* Header Banner */}
                    <div className="p-4 bg-slate-50 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary">
                            {trip.tripNumber}
                          </span>
                          <Badge variant="outline" className={statusColor}>
                            {trip.status}
                          </Badge>
                          <Badge variant="secondary" className="font-normal text-xs">
                            {trip.type === 'DROPOFF'
                              ? 'Drop-off (Closest 1st)'
                              : 'Pickup (Farthest 1st)'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Route: <strong>{trip.route}</strong>
                          </span>
                          &bull;
                          <span>
                            Hub: <strong>{trip.hubLocation || 'Westend'}</strong>
                          </span>
                          &bull;
                          <span>
                            Shift: <strong>{trip.shift}</strong>
                          </span>
                          &bull;
                          <span>
                            Passengers: <strong>{passengers.length}</strong> / {vehicle?.capacity || 14} seats
                          </span>
                        </div>
                      </div>

                      {/* Vehicle & Driver Cardlet */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-primary" />
                            {vehicle?.plateNumber} &mdash; {vehicle?.model}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1.5">
                            <span>Driver: {trip.driverName || vehicle?.driverName || 'Assigned'}</span>
                            {(trip.driverPhone || vehicle?.driverPhone) && (
                              <span className="text-slate-700 font-mono">
                                ({trip.driverPhone || vehicle?.driverPhone})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status switcher */}
                        <Select
                          value={trip.status}
                          onValueChange={(val) => handleStatusChange(trip.id, val)}
                        >
                          <SelectTrigger className="h-8 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportManifest(trip)}
                          className="h-8 text-xs gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Manifest
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Ordered Passenger Stop Manifest */}
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1">
                          <span>
                            {trip.type === 'DROPOFF'
                              ? `Stop Sequence: Depart ${trip.hubLocation || 'Hub'} → Drop Closest First → Farthest Last`
                              : `Stop Sequence: Pickup Farthest First → Deliver to ${trip.hubLocation || 'Hub'}`}
                          </span>
                        </div>

                        <div className="relative border-l-2 border-primary/30 ml-4 pl-4 space-y-4 py-2">
                          {/* Origin point */}
                          <div className="relative">
                            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-sm" />
                            <div className="text-xs font-bold text-slate-900">
                              {trip.type === 'DROPOFF'
                                ? `Depart Hub: ${trip.hubLocation || 'Westend Office'} (0.0 km)`
                                : `Origin: First Pickup Point`}
                            </div>
                          </div>

                          {/* Sequenced Passenger Stops */}
                          {passengers.map((p: any, idx: number) => {
                            const isFirst = idx === 0;
                            const isLast = idx === passengers.length - 1;

                            return (
                              <div key={p.id} className="relative group">
                                <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-white shadow-sm" />
                                <div className="p-3 rounded-lg border bg-card hover:bg-slate-50 transition-all text-xs space-y-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-primary">
                                        Stop #{p.stopSequence}
                                      </span>
                                      <span className="font-semibold text-slate-900 text-sm">
                                        {p.staffName}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
                                        BMS: {p.bmsNumber}
                                      </span>
                                      {isFirst && trip.type === 'DROPOFF' && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                          Closest Drop-off
                                        </Badge>
                                      )}
                                      {isLast && trip.type === 'DROPOFF' && (
                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                          Farthest Drop-off
                                        </Badge>
                                      )}
                                      {isFirst && trip.type === 'PICKUP' && (
                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                          Farthest 1st Pickup
                                        </Badge>
                                      )}
                                      {isLast && trip.type === 'PICKUP' && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                          Closest Final Pickup
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-600">
                                      <span className="font-semibold text-slate-800">
                                        {p.distanceKm} km from hub
                                      </span>
                                      {p.phoneNumber && (
                                        <a
                                          href={`tel:${p.phoneNumber}`}
                                          className="flex items-center gap-1 hover:underline text-primary"
                                        >
                                          <Phone className="w-3 h-3" />
                                          {p.phoneNumber}
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-muted-foreground gap-1 pt-0.5">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate max-w-md">{p.address || 'Address pending'}</span>
                                    </div>

                                    {p.latitude && p.longitude && (
                                      <a
                                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                                      >
                                        GPS: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Destination for Pickups */}
                          {trip.type === 'PICKUP' && (
                            <div className="relative">
                              <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-sm" />
                              <div className="text-xs font-bold text-slate-900">
                                Arrive Hub: {trip.hubLocation || 'Westend Office'} (All Passengers Dropped at Office)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Fleet Vehicles */}
        <TabsContent value="fleet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Transport Fleet</CardTitle>
                  <CardDescription>
                    Vehicles from 5-seater sedans up to 14-seater vans used for staff carpooling and shift routing.
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Vehicle
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {initialVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {vehicle.plateNumber}
                      </span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {vehicle.capacity} Seats
                      </Badge>
                    </div>

                    <div>
                      <div className="font-semibold text-sm text-slate-800">{vehicle.model}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {vehicle.capacity <= 5
                          ? 'Small Sedan / Wagon'
                          : vehicle.capacity <= 8
                          ? 'Mid-Size Van / MPV'
                          : '14-Seater Commuter Van'}
                      </div>
                    </div>

                    <div className="pt-2 border-t text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Driver:</span>
                        <span className="font-medium">{vehicle.driverName || 'Not assigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-mono">{vehicle.driverPhone || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </>
    )}
  </Tabs>

      {/* Auto-Dispatch Dialog */}
      <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Auto-Dispatch Carpool Trips
            </DialogTitle>
            <DialogDescription>
              Automatically group staff on the same route into 5-seater to 14-seater vehicles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="p-3 rounded-lg border bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Date:</span>
                <span className="font-bold text-slate-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift:</span>
                <span className="font-bold text-slate-900">{selectedShift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hub Location:</span>
                <span className="font-bold text-slate-900">{selectedHub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Routing Logic:</span>
                <span className="font-bold text-primary">
                  {tripType === 'DROPOFF'
                    ? 'Drop-off (Closest Dropped First, Farthest Last)'
                    : 'Pickup (Farthest Picked 1st, Closest Last)'}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              The engine will match passengers on each route to the best-fitting available vehicle (5-seater to 14-seater) and calculate stop order using exact destination GPS coordinates.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDispatchDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAutoDispatch}
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              {isPending && <Spinner className="w-4 h-4" />}
              Generate &amp; Dispatch Trips
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Modal */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveVehicle}>
            <DialogHeader>
              <DialogTitle>Add Fleet Vehicle</DialogTitle>
              <DialogDescription>
                Add a 5-seater car up to a 14-seater van to the transport fleet.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold">Plate Number</span>
                <Input
                  placeholder="e.g. KDF 778H"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold">Vehicle Model</span>
                <Input
                  placeholder="e.g. Toyota HiAce Van (14-Seater)"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold">Seating Capacity</span>
                <Select
                  value={vehicleCapacity}
                  onValueChange={setVehicleCapacity}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5-Seater (Sedan / Wagon)</SelectItem>
                    <SelectItem value="7">7-Seater (Noah / Voxy)</SelectItem>
                    <SelectItem value="9">9-Seater (HiAce Mini)</SelectItem>
                    <SelectItem value="14">14-Seater (Commuter Van)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold">Driver Name</span>
                  <Input
                    placeholder="e.g. Boniface Mutua"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold">Driver Phone</span>
                  <Input
                    placeholder="e.g. 0700 678 901"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Spinner className="w-4 h-4" />}
                Save Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
