import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getLoggedInSupervisor } from '../actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  CalendarDays,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function SupervisorDashboardPage() {
  const supervisor = await getLoggedInSupervisor();

  if (!supervisor || supervisor.role !== 'Supervisor') {
    redirect('/supervisor/login');
  }

  // 1. Fetch assigned agents for this supervisor
  const agents = await prisma.staff.findMany({
    where: {
      OR: [
        { supervisorId: supervisor.id },
        { supervisorName: supervisor.name },
      ],
    },
    orderBy: { name: 'asc' },
  });

  const agentStaffNumbers = agents.map((a) => a.staffNumber);

  // 2. Fetch pending shift edit requests
  const pendingRequests = await prisma.bookingEditRequest.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { supervisorId: supervisor.id },
        { supervisorName: supervisor.name },
        { staffNumber: { in: agentStaffNumbers } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Fetch approved requests count
  const approvedCount = await prisma.bookingEditRequest.count({
    where: {
      status: 'APPROVED',
      OR: [
        { supervisorId: supervisor.id },
        { supervisorName: supervisor.name },
        { staffNumber: { in: agentStaffNumbers } },
      ],
    },
  });

  // 4. Fetch original bookings for recent pending requests
  const bookingIds = pendingRequests.slice(0, 5).map((r) => r.bookingId);
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
  });
  const bookingsMap = new Map(bookings.map((b) => [b.id, b]));

  // Count distinct routes
  const distinctRoutes = new Set(agents.map((a) => a.route).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {supervisor.name}
            </h1>
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/40 text-xs">
              Supervisor
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
            Manage your frontline agents, review and approve daily shift change requests, and update transport pickup details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/supervisor/requests">
            <Button size="sm" className="bg-white text-purple-900 hover:bg-white/90 text-xs gap-1.5 font-semibold">
              <FileCheck2 className="w-4 h-4" />
              Review Requests ({pendingRequests.length})
            </Button>
          </Link>
          <Link href="/supervisor/agents">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs gap-1.5">
              <Users className="w-4 h-4" />
              My Agents ({agents.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-purple-100 dark:border-purple-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assigned Agents</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{agents.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct reports under supervision
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Shift Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shift edits resolved
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Routes</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{distinctRoutes.size}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pickup routes across Nairobi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Pending Requests Preview & Quick Team Directory */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left 2 Cols: Pending Shift Change Requests */}
        <Card className="lg:col-span-2 shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Recent Shift Edit Requests</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Agents requesting shift or date adjustments for specific days
              </CardDescription>
            </div>
            <Link href="/supervisor/requests">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-700 hover:text-purple-800">
                View all ({pendingRequests.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-700">All caught up!</p>
                <p>You have no pending shift edit requests from your agents.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((req) => {
                  const original = bookingsMap.get(req.bookingId);
                  const changes = req.requestedChanges as any;
                  const agent = agents.find((a) => a.staffNumber === req.staffNumber);
                  const origShift = original?.shift || 'N/A';
                  const newShift = changes?.shift || origShift;

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border bg-card hover:border-purple-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {agent?.name || changes?.name || req.staffNumber}
                          </span>
                          <span className="text-xs font-mono font-bold text-primary">
                            {agent?.bmsNumber ? `BMS: ${agent.bmsNumber}` : req.staffNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Target Date:</span>
                          <span className="font-medium text-slate-800">
                            {original?.date ? format(new Date(original.date), 'EEE, MMM dd, yyyy') : 'Specific Day'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Shift:</span>
                          <span className="line-through text-red-500/80">{origShift}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {newShift}
                          </span>
                        </div>

                        {req.reason && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded mt-1 border">
                            &quot;{req.reason}&quot;
                          </p>
                        )}
                      </div>

                      <Link href="/supervisor/requests" className="self-end sm:self-center">
                        <Button size="sm" variant="outline" className="text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50">
                          Review Request
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right 1 Col: Quick Team Roster Preview */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">My Team</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {agents.length} Agents reporting to you
              </CardDescription>
            </div>
            <Link href="/supervisor/agents">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-700 hover:text-purple-800">
                Edit Transport &rarr;
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-2.5 rounded-lg border bg-slate-50/60 dark:bg-slate-900/40 text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      BMS: {agent.bmsNumber || agent.staffNumber} &bull; {agent.route || 'Route pending'}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {agent.location || 'Westend'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
