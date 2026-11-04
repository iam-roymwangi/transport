'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Users,
  MapPin,
  Route as RouteIcon,
  Phone,
  Search,
  ExternalLink,
  Edit,
  CheckCircle2,
  AlertCircle,
  Compass,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { LOCATIONS, ROUTES } from '@/lib/booking-options';
import { extractCoordinates } from '@/lib/googleMaps';
import { updateAgentTransportBySupervisorAction } from '../../actions';
import type { Staff } from '@prisma/client';

interface SupervisorAgentsClientProps {
  initialAgents: Staff[];
  supervisorName: string;
}

export function SupervisorAgentsClient({
  initialAgents,
  supervisorName,
}: SupervisorAgentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Modal State
  const [editingAgent, setEditingAgent] = useState<Staff | null>(null);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Westend');
  const [route, setRoute] = useState('Jogoo Road');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return initialAgents.filter((agent) => {
      if (routeFilter !== 'ALL' && agent.route !== routeFilter) return false;
      if (locationFilter !== 'ALL' && agent.location !== locationFilter) return false;

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const name = agent.name.toLowerCase();
        const bms = (agent.bmsNumber || '').toLowerCase();
        const staffNum = agent.staffNumber.toLowerCase();
        const addr = (agent.address || '').toLowerCase();
        const ph = (agent.phoneNumber || '').toLowerCase();

        if (
          !name.includes(lower) &&
          !bms.includes(lower) &&
          !staffNum.includes(lower) &&
          !addr.includes(lower) &&
          !ph.includes(lower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [initialAgents, routeFilter, locationFilter, searchTerm]);

  // Pagination calculations
  const totalAgents = filteredAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalAgents / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalAgents);
  const paginatedAgents = useMemo(() => {
    return filteredAgents.slice(startIndex, endIndex);
  }, [filteredAgents, startIndex, endIndex]);

  // Open Edit Modal
  const openEditModal = (agent: Staff) => {
    setEditingAgent(agent);
    setPhone(agent.phoneNumber || '');
    setLocation(agent.location || 'Westend');
    setRoute(agent.route || 'Jogoo Road');
    setAddress(agent.address || '');
    setMapsUrl(agent.googleMapsUrl || '');
    setLatitude(agent.latitude ? String(agent.latitude) : '');
    setLongitude(agent.longitude ? String(agent.longitude) : '');
  };

  // Helper when mapsUrl changes to auto-parse coords
  const handleMapsUrlChange = (val: string) => {
    setMapsUrl(val);
    if (val.trim()) {
      const extracted = extractCoordinates(val.trim());
      if (extracted) {
        setLatitude(String(extracted.latitude));
        setLongitude(String(extracted.longitude));
      }
    }
  };

  // Submit Edit Transport
  const handleSaveTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    startTransition(async () => {
      try {
        const res = await updateAgentTransportBySupervisorAction({
          staffId: editingAgent.id,
          phoneNumber: phone.trim() || undefined,
          location,
          route,
          address: address.trim() || undefined,
          googleMapsUrl: mapsUrl.trim() || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        });

        if (res.success) {
          toast.success(res.message);
          setEditingAgent(null);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update transport details');
        }
      } catch {
        toast.error('An error occurred while saving transport details');
      }
    });
  };

  const pinnedCount = initialAgents.filter((a) => a.latitude && a.longitude).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Agents &amp; Transport Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Maintain accurate pickup landmarks, routes, and GPS coordinates for your direct reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-1 px-2.5">
            Supervisor: {supervisorName}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Team</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agents in your direct team
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPS Coordinates Pinned</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {pinnedCount} / {initialAgents.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ready for precise carpool routing
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pin Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {initialAgents.length - pinnedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Need Google Maps pin updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card with Table & Controls */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Team Directory</CardTitle>
              <CardDescription className="text-xs">
                Select an agent to edit their work hub, dropoff route, address, or map coordinates.
              </CardDescription>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="All Hubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Hubs</SelectItem>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
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

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search agent, BMS, address..."
                  className="pl-8 h-8 text-xs w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Desktop Table View (hidden on mobile < md) */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="w-[220px]">Agent</TableHead>
                    <TableHead className="w-[150px]">Contact</TableHead>
                    <TableHead className="w-[140px]">Work Hub</TableHead>
                    <TableHead className="w-[170px]">Transport Route</TableHead>
                    <TableHead className="w-[200px]">Pickup Landmark / Address</TableHead>
                    <TableHead className="w-[150px]">GPS Coordinates</TableHead>
                    <TableHead className="w-[100px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                        No agents found matching your filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAgents.map((agent) => (
                      <TableRow key={agent.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{agent.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono font-bold text-primary">
                                {agent.bmsNumber ? `BMS: ${agent.bmsNumber}` : agent.staffNumber}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                ({agent.staffNumber})
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-700">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{agent.phoneNumber || 'No phone'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-slate-50">
                            <Building2 className="w-3 h-3 mr-1 text-primary" />
                            {agent.location || 'Westend'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-800">
                            <RouteIcon className="w-3 h-3 text-primary shrink-0" />
                            <span>{agent.route || 'Route Pending'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-slate-600 truncate max-w-[200px]" title={agent.address || ''}>
                            {agent.address || 'Address pending'}
                          </div>
                        </TableCell>

                        <TableCell>
                          {agent.latitude && agent.longitude ? (
                            <div className="flex flex-col text-xs">
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {agent.latitude.toFixed(4)}, {agent.longitude.toFixed(4)}
                              </span>
                              <a
                                href={agent.googleMapsUrl || `https://www.google.com/maps?q=${agent.latitude},${agent.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                              >
                                View Map <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              Pin Pending
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(agent)}
                            className="h-8 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards View (visible on < md) */}
          <div className="block md:hidden space-y-3">
            {filteredAgents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border">
                No agents found matching your filter criteria.
              </div>
            ) : (
              paginatedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 rounded-xl border bg-card shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{agent.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono font-bold text-primary">
                          {agent.bmsNumber ? `BMS: ${agent.bmsNumber}` : agent.staffNumber}
                        </span>
                        <span className="text-[11px] text-muted-foreground">({agent.staffNumber})</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(agent)}
                      className="h-7 text-xs gap-1 border-purple-200 text-purple-700"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Hub &amp; Route</span>
                      <div className="font-medium text-slate-800">
                        {agent.location || 'Westend'} &bull; {agent.route || 'Pending'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Phone</span>
                      <div className="text-slate-700">{agent.phoneNumber || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="text-xs pt-2 border-t space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Landmark</span>
                    <div className="text-slate-700">{agent.address || 'Address pending'}</div>
                    {agent.latitude && agent.longitude ? (
                      <a
                        href={agent.googleMapsUrl || `https://www.google.com/maps?q=${agent.latitude},${agent.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        Coords: {agent.latitude.toFixed(4)}, {agent.longitude.toFixed(4)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-amber-600 block">Pin coords pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalAgents > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
                <span>
                  Showing <strong className="text-foreground">{startIndex + 1}</strong> to{' '}
                  <strong className="text-foreground">{endIndex}</strong> of{' '}
                  <strong className="text-foreground">{totalAgents}</strong> agents
                </span>

                <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                  <span className="text-[11px]">Per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 w-[68px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  title="First Page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <div className="flex items-center px-2 text-xs font-medium">
                  Page {safePage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  title="Next Page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  title="Last Page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transport Modal */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveTransport}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-700" />
                Edit Transport Details for {editingAgent?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update work hub, transport route, pickup landmark, and Google Maps coordinates for{' '}
                <strong>{editingAgent?.bmsNumber ? `BMS: ${editingAgent.bmsNumber}` : editingAgent?.staffNumber}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Work Hub Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Hub Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-xs">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Route */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Transport Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Contact Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="h-9 text-xs"
                />
              </div>

              {/* Address / Landmark */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">
                  Pickup Landmark / Home Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shell Petrol Station, near junction"
                  className="h-9 text-xs"
                />
              </div>

              {/* Google Maps Link */}
              <div className="space-y-1.5">
                <Label htmlFor="mapsUrl" className="text-xs font-semibold">
                  Google Maps Pin Link
                </Label>
                <Input
                  id="mapsUrl"
                  value={mapsUrl}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  placeholder="Paste Google Maps URL (e.g. https://maps.app.goo.gl/... or ?q=-1.29,36.82)"
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pasting a Google Maps pin link will automatically extract latitude and longitude below.
                </p>
              </div>

              {/* Lat & Long */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="lat" className="text-[11px] text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-1.2921"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lng" className="text-[11px] text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    id="lng"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="36.8219"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAgent(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
              >
                {isPending && <Spinner className="w-3.5 h-3.5" />}
                Save Transport Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
