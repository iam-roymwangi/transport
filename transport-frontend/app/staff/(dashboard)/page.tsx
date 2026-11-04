import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarRange, MapPin, Compass, Navigation, CalendarClock } from 'lucide-react';
import { StaffDashboardClient } from './client-table';
import { StaffAddBookingButton } from './add-booking-button';
import { ROLE_INFO, StaffRole } from '@/lib/booking-options';

export const revalidate = 0;

export default async function StaffDashboardPage() {
  const staffNumber = (await cookies()).get('staff_token')?.value;

  if (!staffNumber) {
    redirect('/staff/login');
  }

  // Fetch the staff details to welcome them
  const staff = await prisma.staff.findUnique({
    where: { staffNumber },
  });

  // Fetch only their bookings
  const myBookings = await prisma.booking.findMany({
    where: { staffNumber },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch their pending edit requests to show status
  const myPendingRequests = await prisma.bookingEditRequest.findMany({
    where: { staffNumber, status: 'PENDING' },
  });

  // Fetch active schedule count
  const mySchedules = await prisma.schedule.findMany({
    where: { staffNumber, status: 'ACTIVE' },
  });

  const role = (staff?.role as StaffRole) || 'Agent';
  const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {staff?.name || 'Staff Member'}</h1>
            <Badge variant="outline" className={roleMeta.badgeColor}>
              {role}
            </Badge>
            {staff?.supervisorName && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Supervisor: {staff.supervisorName}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            BMS Number: <span className="font-semibold text-primary font-mono text-base">{staff?.bmsNumber || 'N/A'}</span> &bull; ID: <span className="font-semibold text-slate-700">{staff?.staffNumber}</span> &bull; {roleMeta.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/staff/profile">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              Transport Details
            </Button>
          </Link>
          <StaffAddBookingButton 
            initialData={{ 
              name: staff?.name || '', 
              bmsNumber: staff?.bmsNumber || '',
              staffNumber: staff?.staffNumber || '', 
              phoneNumber: staff?.phoneNumber || '',
              role: staff?.role || 'Agent',
              location: staff?.location || '',
              route: staff?.route || '',
              address: staff?.address || '',
              pinLocation: staff?.pinLocation || '',
              latitude: staff?.latitude,
              longitude: staff?.longitude,
              googleMapsUrl: staff?.googleMapsUrl || '',
              currentShift: staff?.currentShift || '17:00 - 02:00',
            }} 
          />
        </div>
      </div>

      {/* Transport Details Banner */}
      <div className="p-4 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-slate-900">
              Assigned Hub: {staff?.location || 'Not selected'} &bull; Route: {staff?.route || 'Not assigned'}
            </div>
            <div className="text-xs text-muted-foreground">
              {staff?.latitude && staff?.longitude ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1 inline-flex">
                  <Navigation className="w-3 h-3" /> Pin Coords: {staff.latitude}, {staff.longitude}
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1 inline-flex">
                  <Compass className="w-3 h-3" /> Exact Google Maps pin not set yet
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href="/staff/profile" className="text-xs text-primary font-medium hover:underline self-start sm:self-auto">
          Update Transport Details &rarr;
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Total Bookings</CardTitle>
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned WFM Schedules</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mySchedules.length}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/staff/schedule" className="hover:underline">
                View monthly schedule &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            View your bookings and request edits if needed. Overnight shifts (e.g. 5pm to 2am) and destinations are linked with Google Maps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffDashboardClient 
            initialBookings={myBookings} 
            pendingRequests={myPendingRequests}
            staff={staff}
          />
        </CardContent>
      </Card>
    </div>
  );
}
