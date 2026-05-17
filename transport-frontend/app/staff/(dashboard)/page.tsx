import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarRange } from 'lucide-react';
import { StaffDashboardClient } from './client-table';

import { StaffAddBookingButton } from './add-booking-button';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {staff?.name || 'Staff Member'}</h1>
          <p className="text-muted-foreground mt-1">Manage your transport bookings.</p>
        </div>
        <div>
          <StaffAddBookingButton 
            initialData={{ 
              name: staff?.name || '', 
              staffNumber: staff?.staffNumber || '', 
              phoneNumber: staff?.phoneNumber || '' 
            }} 
          />
        </div>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            View your bookings and request edits if needed. Edits require admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffDashboardClient 
            initialBookings={myBookings} 
            pendingRequests={myPendingRequests}
          />
        </CardContent>
      </Card>
    </div>
  );
}
