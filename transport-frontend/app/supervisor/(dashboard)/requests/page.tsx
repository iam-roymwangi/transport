import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getLoggedInSupervisor } from '../../actions';
import { SupervisorRequestsClient } from './requests-client';

export const revalidate = 0;

export default async function SupervisorRequestsPage() {
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
    select: {
      id: true,
      name: true,
      bmsNumber: true,
      staffNumber: true,
      phoneNumber: true,
      location: true,
      route: true,
    },
  });

  const agentStaffNumbers = agents.map((a) => a.staffNumber);

  // 2. Fetch all shift edit requests for this supervisor
  const requests = await prisma.bookingEditRequest.findMany({
    where: {
      OR: [
        { supervisorId: supervisor.id },
        { supervisorName: supervisor.name },
        { staffNumber: { in: agentStaffNumbers } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Fetch original bookings
  const bookingIds = Array.from(new Set(requests.map((r) => r.bookingId)));
  const originalBookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
  });
  const bookingsMap = new Map(originalBookings.map((b) => [b.id, b]));

  const requestsWithContext = requests.map((req) => ({
    ...req,
    originalBooking: bookingsMap.get(req.bookingId),
    agent: agents.find((a) => a.staffNumber === req.staffNumber),
  }));

  return (
    <SupervisorRequestsClient
      initialRequests={requestsWithContext}
      supervisorName={supervisor.name}
    />
  );
}
