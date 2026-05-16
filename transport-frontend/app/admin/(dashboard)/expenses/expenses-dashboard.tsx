'use client';

import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign, MapPin, Route, TrendingUp, Users, Search, ArrowUpDown, CalendarIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e0e7ff', '#10b981', '#f59e0b'];

type EnrichedBooking = {
  id: string;
  name: string;
  staffNumber: string;
  location: string | null;
  route: string | null;
  primaryRoute: string;
  shift: string;
  date: Date;
  address: string | null;
  distance: number;
  cost: number;
};

interface Props {
  bookings: EnrichedBooking[];
  ratePerKm: number;
}

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
}

const TODAY = new Date().toISOString().split('T')[0];

export function ExpensesDashboard({ bookings, ratePerKm }: Props) {
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterDate, setFilterDate] = useState(TODAY);
  const [sortField, setSortField] = useState<'cost' | 'distance' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const locations = useMemo(() => ['all', ...Array.from(new Set(bookings.map(b => b.location || 'Unknown')))], [bookings]);
  const routes = useMemo(() => ['all', ...Array.from(new Set(bookings.map(b => b.primaryRoute).filter(Boolean)))], [bookings]);

  const filtered = useMemo(() => {
    let result = bookings.filter(b => {
      const matchSearch = search === '' ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.staffNumber.toLowerCase().includes(search.toLowerCase());
      const matchLocation = filterLocation === 'all' || b.location === filterLocation;
      const matchRoute = filterRoute === 'all' || b.primaryRoute === filterRoute;
      const matchDate = !filterDate || new Date(b.date).toISOString().split('T')[0] === filterDate;
      return matchSearch && matchLocation && matchRoute && matchDate;
    });

    result = [...result].sort((a, b) => {
      let av = sortField === 'date' ? new Date(a.date).getTime() : a[sortField];
      let bv = sortField === 'date' ? new Date(b.date).getTime() : b[sortField];
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [bookings, search, filterLocation, filterRoute, filterDate, sortField, sortDir]);

  const totalCost = filtered.reduce((s, b) => s + b.cost, 0);
  const totalDistance = filtered.reduce((s, b) => s + b.distance, 0);
  const avgCostPerBooking = filtered.length ? totalCost / filtered.length : 0;

  // ── Chart data ────────────────────────────────────────────────────────────
  const costByLocation = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(b => {
      const loc = b.location || 'Unknown';
      map[loc] = (map[loc] || 0) + b.cost;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const costByRoute = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(b => {
      if (!b.primaryRoute) return;
      map[b.primaryRoute] = (map[b.primaryRoute] || 0) + b.cost;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.replace(' Road', '').replace(' Way', ''), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transport Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Cost analysis at <span className="font-semibold text-primary">KES {ratePerKm}/km</span> standard rate
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 bg-amber-50 border-amber-200 text-amber-700">
          Prototype — Distances are estimated
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatKES(totalCost)}</div>
            <p className="text-xs text-muted-foreground">{filtered.length} bookings in view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">Estimated total travel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost / Booking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKES(avgCostPerBooking)}</div>
            <p className="text-xs text-muted-foreground">Per staff trip</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filtered.map(b => b.staffNumber)).size}
            </div>
            <p className="text-xs text-muted-foreground">Staff with transport costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Cost by Route
            </CardTitle>
            <CardDescription>Total KES spent per route corridor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costByRoute} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cost by Location
            </CardTitle>
            <CardDescription>Expense distribution across office locations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costByLocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {costByLocation.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatKES(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Cost Breakdown</CardTitle>
          <CardDescription>Per-booking distance and cost details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Date
              </Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or staff no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(l => (
                  <SelectItem key={l} value={l}>{l === 'all' ? 'All Locations' : l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRoute} onValueChange={setFilterRoute}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map(r => (
                  <SelectItem key={r} value={r}>{r === 'all' ? 'All Routes' : r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('date')}
                    >
                      Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort('distance')}
                    >
                      Distance <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                      onClick={() => toggleSort('cost')}
                    >
                      Cost (KES) <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No bookings match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.staffNumber}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{b.location || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.primaryRoute || b.route || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(b.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-sm">{b.distance.toFixed(1)} km</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatKES(b.cost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span className="text-muted-foreground">{filtered.length} records shown</span>
              <span>Total: <span className="text-primary font-bold">{formatKES(totalCost)}</span></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
