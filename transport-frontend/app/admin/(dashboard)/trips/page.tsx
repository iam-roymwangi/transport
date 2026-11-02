import { prisma } from '@/lib/prisma';
import { TripsDashboard } from './trips-dashboard';

export const revalidate = 0;

export default async function TripsPage() {
  const todayStr = new Date().toISOString().substring(0, 10);

  // 1. Fetch fleet vehicles
  const vehicles = await prisma.vehicle.findMany({
    orderBy: [{ capacity: 'asc' }, { plateNumber: 'asc' }],
  });

  // 2. Fetch existing trips with passengers and vehicles
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      passengers: {
        orderBy: { stopSequence: 'asc' },
      },
    },
    orderBy: [{ date: 'desc' }, { shift: 'asc' }, { tripNumber: 'asc' }],
  });

  return (
    <TripsDashboard
      initialTrips={trips}
      initialVehicles={vehicles}
      initialDate={todayStr}
    />
  );
}
