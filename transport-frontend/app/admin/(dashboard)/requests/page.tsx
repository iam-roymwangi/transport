import { PrismaClient } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileEdit } from 'lucide-react';
import { RequestsClientTable } from './client-table';

const prisma = new PrismaClient();
export const revalidate = 0;

export default async function EditRequestsPage() {
  const pendingRequests = await prisma.bookingEditRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch the original bookings for these requests to show side-by-side comparison
  const bookingIds = pendingRequests.map(r => r.bookingId);
  const originalBookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } }
  });

  const bookingsMap = new Map(originalBookings.map(b => [b.id, b]));

  const requestsWithContext = pendingRequests.map(req => ({
    ...req,
    originalBooking: bookingsMap.get(req.bookingId)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Requests</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting admin approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Edit Requests</CardTitle>
          <CardDescription>
            Review the changes requested by staff members before approving them into the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestsClientTable requests={requestsWithContext as any} />
        </CardContent>
      </Card>
    </div>
  );
}
