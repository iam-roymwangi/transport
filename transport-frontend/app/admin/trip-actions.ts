'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { calculateDistanceToHub, calculateHaversineDistance, HUB_LOCATIONS } from '@/lib/googleMaps';

async function checkAdminAuth() {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }
}

// ── 1. Vehicles & Fleet Actions ──────────────────────────────────────────────

export async function getVehiclesAction() {
  await checkAdminAuth();
  return prisma.vehicle.findMany({
    orderBy: [{ capacity: 'asc' }, { plateNumber: 'asc' }],
  });
}

export async function saveVehicleAction(data: {
  id?: string;
  plateNumber: string;
  model: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  status?: string;
}) {
  await checkAdminAuth();

  if (data.id) {
    const updated = await prisma.vehicle.update({
      where: { id: data.id },
      data: {
        plateNumber: data.plateNumber.toUpperCase(),
        model: data.model,
        capacity: data.capacity,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        status: data.status || 'AVAILABLE',
      },
    });
    revalidatePath('/admin/trips');
    return { success: true, vehicle: updated };
  } else {
    const created = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber.toUpperCase(),
        model: data.model,
        capacity: data.capacity,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        status: data.status || 'AVAILABLE',
      },
    });
    revalidatePath('/admin/trips');
    return { success: true, vehicle: created };
  }
}

export async function deleteVehicleAction(id: string) {
  await checkAdminAuth();
  await prisma.vehicle.delete({ where: { id } });
  revalidatePath('/admin/trips');
  return { success: true };
}

// ── 2. Trip Tracking & Carpool Dispatch Engine ────────────────────────────────

export async function getTripsAction(params?: {
  dateStr?: string;
  shift?: string;
  route?: string;
  type?: string;
}) {
  await checkAdminAuth();

  const whereClause: any = {};

  if (params?.dateStr) {
    const start = new Date(params.dateStr);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.dateStr);
    end.setUTCHours(23, 59, 59, 999);
    whereClause.date = { gte: start, lte: end };
  }

  if (params?.shift && params.shift !== 'ALL') {
    whereClause.shift = params.shift;
  }

  if (params?.route && params.route !== 'ALL') {
    whereClause.route = params.route;
  }

  if (params?.type && params.type !== 'ALL') {
    whereClause.type = params.type;
  }

  return prisma.trip.findMany({
    where: whereClause,
    include: {
      vehicle: true,
      passengers: {
        orderBy: { stopSequence: 'asc' },
      },
    },
    orderBy: [{ date: 'desc' }, { shift: 'asc' }, { tripNumber: 'asc' }],
  });
}

/**
 * Auto-generate carpooling trips from bookings on the same route.
 * Rule 1: Staff on the same route carpool together.
 * Rule 2 (Drop-offs): Closest is dropped first, farthest dropped last.
 * Rule 3 (Pickups): Farthest is picked up first, closest picked up last.
 * Rule 4: Match passenger clusters with appropriate vehicles (5-seater to 14-seater).
 */
export async function autoPlanTripsAction(data: {
  date: string; // YYYY-MM-DD
  shift: string;
  hubLocation: string; // e.g. "Westend"
  type: 'DROPOFF' | 'PICKUP';
}) {
  await checkAdminAuth();

  const start = new Date(data.date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(data.date);
  end.setUTCHours(23, 59, 59, 999);

  // 1. Fetch bookings for this date and shift
  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: start, lte: end },
      shift: data.shift,
    },
  });

  if (bookings.length === 0) {
    return {
      success: false,
      error: `No bookings found for shift "${data.shift}" on ${data.date}.`,
      tripsCreated: 0,
    };
  }

  // 2. Fetch available vehicles
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { capacity: 'desc' },
  });

  if (vehicles.length === 0) {
    return {
      success: false,
      error: 'No available vehicles found in fleet. Please add or free vehicles.',
      tripsCreated: 0,
    };
  }

  // 3. Group bookings by primary Route
  const routeGroups: Record<string, typeof bookings> = {};
  for (const b of bookings) {
    const route = b.route || 'General Route';
    // If multi-route string, take the first primary route
    const primaryRoute = route.split(',')[0].trim();
    if (!routeGroups[primaryRoute]) {
      routeGroups[primaryRoute] = [];
    }
    routeGroups[primaryRoute].push(b);
  }

  const hubCoords = HUB_LOCATIONS[data.hubLocation] || HUB_LOCATIONS['Westend'];
  const createdTrips: any[] = [];
  let vehicleIndex = 0;
  const dateFormatted = data.date.replace(/-/g, '');

  for (const [route, routeBookings] of Object.entries(routeGroups)) {
    // 4. Calculate distance to Hub for each booking
    const passengersWithDistance = routeBookings.map((b) => {
      let distanceKm = 10.0; // fallback estimated km
      if (b.latitude && b.longitude) {
        distanceKm = calculateHaversineDistance(
          { latitude: b.latitude, longitude: b.longitude },
          hubCoords
        );
      } else {
        // Estimate based on route string
        distanceKm = 8.0 + Math.random() * 10.0;
      }
      return {
        booking: b,
        distanceKm: Math.round(distanceKm * 10) / 10,
      };
    });

    // 5. Sort passengers by distance:
    // Drop-off: Closest dropped first, farthest last (ASCENDING distance)
    // Pickup: Farthest picked up first, closest picked up last (DESCENDING distance)
    if (data.type === 'DROPOFF') {
      passengersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      passengersWithDistance.sort((a, b) => b.distanceKm - a.distanceKm);
    }

    // 6. Partition passengers into vehicle clusters (5-seater to 14-seater)
    let remainingPassengers = [...passengersWithDistance];

    while (remainingPassengers.length > 0) {
      // Pick best fitting vehicle
      const count = remainingPassengers.length;
      let chosenVehicle = vehicles[vehicleIndex % vehicles.length];

      // Try finding vehicle matching count
      const optimalVehicle = vehicles.find((v) => v.capacity >= count) || vehicles[0];
      if (optimalVehicle) {
        chosenVehicle = optimalVehicle;
      }
      vehicleIndex++;

      const capacity = chosenVehicle.capacity;
      const batch = remainingPassengers.slice(0, capacity);
      remainingPassengers = remainingPassengers.slice(capacity);

      const tripNum = `TRP-${dateFormatted}-${route.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const trip = await prisma.trip.create({
        data: {
          tripNumber: tripNum,
          type: data.type,
          date: start,
          shift: data.shift,
          route,
          hubLocation: data.hubLocation,
          vehicleId: chosenVehicle.id,
          driverName: chosenVehicle.driverName,
          driverPhone: chosenVehicle.driverPhone,
          status: 'SCHEDULED',
          notes: `${data.type === 'DROPOFF' ? 'Drop-off order: Closest dropped first' : 'Pickup order: Farthest picked up first'}. Vehicle: ${chosenVehicle.model}`,
          passengers: {
            create: batch.map((p, idx) => ({
              bookingId: p.booking.id,
              staffName: p.booking.name,
              bmsNumber: p.booking.bmsNumber || p.booking.staffNumber,
              staffNumber: p.booking.staffNumber,
              phoneNumber: p.booking.phoneNumber,
              address: p.booking.address,
              latitude: p.booking.latitude,
              longitude: p.booking.longitude,
              distanceKm: p.distanceKm,
              stopSequence: idx + 1,
              status: 'BOARDED',
            })),
          },
        },
        include: {
          passengers: true,
          vehicle: true,
        },
      });

      createdTrips.push(trip);
    }
  }

  revalidatePath('/admin/trips');

  return {
    success: true,
    tripsCreated: createdTrips.length,
    totalPassengers: bookings.length,
    message: `Generated ${createdTrips.length} carpool trip(s) across ${Object.keys(routeGroups).length} route(s) for ${bookings.length} passengers.`,
  };
}

export async function updateTripStatusAction(tripId: string, status: string) {
  await checkAdminAuth();
  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status },
  });
  revalidatePath('/admin/trips');
  return { success: true, trip: updated };
}

export async function deleteTripAction(tripId: string) {
  await checkAdminAuth();
  await prisma.trip.delete({ where: { id: tripId } });
  revalidatePath('/admin/trips');
  return { success: true };
}

// ── 3. Campaign Rest Days Configuration ──────────────────────────────────────

export async function getCampaignConfigsAction() {
  await checkAdminAuth();
  return prisma.campaignConfig.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function saveCampaignConfigAction(data: {
  id?: string;
  name: string;
  defaultRestDays: number[];
  allowedRestDays: number[];
  notes?: string;
}) {
  await checkAdminAuth();

  if (data.id) {
    const updated = await prisma.campaignConfig.update({
      where: { id: data.id },
      data: {
        name: data.name,
        defaultRestDays: data.defaultRestDays,
        allowedRestDays: data.allowedRestDays,
        notes: data.notes,
      },
    });
    revalidatePath('/admin/wfm');
    return { success: true, campaign: updated };
  } else {
    const created = await prisma.campaignConfig.create({
      data: {
        name: data.name,
        defaultRestDays: data.defaultRestDays,
        allowedRestDays: data.allowedRestDays,
        notes: data.notes,
      },
    });
    revalidatePath('/admin/wfm');
    return { success: true, campaign: created };
  }
}
