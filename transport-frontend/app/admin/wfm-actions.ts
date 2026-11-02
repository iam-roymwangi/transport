'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { extractCoordinates, buildGoogleMapsUrl } from '@/lib/googleMaps';
import { DEFAULT_ROLE_SHIFTS, STAFF_ROLES, StaffRole } from '@/lib/booking-options';

async function checkAdminAuth() {
  const authCookie = (await cookies()).get('admin_token')?.value;
  if (!authCookie || authCookie !== 'authenticated') {
    throw new Error('Unauthorized');
  }
}

// ── 1. Shift Configuration Actions ───────────────────────────────────────────

export async function getRoleShiftsAction(roleFilter?: string) {
  await checkAdminAuth();

  // Check if any ShiftConfig records exist; if not, seed defaults
  const count = await prisma.shiftConfig.count();
  if (count === 0) {
    const seedData: any[] = [];
    for (const [role, shifts] of Object.entries(DEFAULT_ROLE_SHIFTS)) {
      for (const s of shifts) {
        const parts = s.shift.split('-').map((p) => p.trim());
        seedData.push({
          role,
          name: s.name,
          startTime: parts[0] || '17:00',
          endTime: parts[1] || '02:00',
          shiftLabel: s.shift,
          isOvernight: !!s.isOvernight,
          isActive: true,
        });
      }
    }
    await prisma.shiftConfig.createMany({ data: seedData });
  }

  const whereClause: any = {};
  if (roleFilter && roleFilter !== 'ALL') {
    whereClause.role = roleFilter;
  }

  return prisma.shiftConfig.findMany({
    where: whereClause,
    orderBy: [{ role: 'asc' }, { startTime: 'asc' }],
  });
}

export async function saveShiftConfigAction(data: {
  id?: string;
  role: string;
  name: string;
  startTime: string;
  endTime: string;
  shiftLabel?: string;
  isOvernight: boolean;
  isActive?: boolean;
}) {
  await checkAdminAuth();

  const label =
    data.shiftLabel ||
    `${data.startTime} - ${data.endTime}${data.isOvernight ? ' (Overnight)' : ''}`;

  if (data.id) {
    const updated = await prisma.shiftConfig.update({
      where: { id: data.id },
      data: {
        role: data.role,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        shiftLabel: label,
        isOvernight: data.isOvernight,
        isActive: data.isActive ?? true,
      },
    });
    revalidatePath('/admin/wfm');
    return { success: true, shift: updated };
  } else {
    const created = await prisma.shiftConfig.create({
      data: {
        role: data.role,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        shiftLabel: label,
        isOvernight: data.isOvernight,
        isActive: data.isActive ?? true,
      },
    });
    revalidatePath('/admin/wfm');
    return { success: true, shift: created };
  }
}

export async function deleteShiftConfigAction(id: string) {
  await checkAdminAuth();
  await prisma.shiftConfig.delete({
    where: { id },
  });
  revalidatePath('/admin/wfm');
  return { success: true };
}

// ── 2. Staff Role and Transport Updates ──────────────────────────────────────

export async function updateStaffRoleAndTransportAction(
  staffId: string,
  data: {
    role?: string;
    supervisorName?: string;
    phoneNumber?: string;
    location?: string;
    route?: string;
    currentShift?: string;
    process?: string;
    address?: string;
    pinLocation?: string;
    googleMapsUrl?: string;
    latitude?: number | null;
    longitude?: number | null;
  }
) {
  await checkAdminAuth();

  let lat = data.latitude;
  let lng = data.longitude;
  let pinLocation = data.pinLocation?.trim() || null;
  let googleMapsUrl = data.googleMapsUrl?.trim() || null;

  // Auto-extract lat/lng from URL or pin if not provided
  if ((lat === undefined || lat === null) && googleMapsUrl) {
    const extracted = extractCoordinates(googleMapsUrl);
    if (extracted) {
      lat = extracted.latitude;
      lng = extracted.longitude;
    }
  }

  if ((lat === undefined || lat === null) && pinLocation) {
    const extracted = extractCoordinates(pinLocation);
    if (extracted) {
      lat = extracted.latitude;
      lng = extracted.longitude;
    }
  }

  // Auto-generate standard link and pin string
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    if (!googleMapsUrl) {
      googleMapsUrl = buildGoogleMapsUrl(lat, lng);
    }
    if (!pinLocation) {
      pinLocation = `${lat}, ${lng}`;
    }
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: {
      ...(data.role ? { role: data.role } : {}),
      ...(data.supervisorName !== undefined ? { supervisorName: data.supervisorName } : {}),
      ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.route !== undefined ? { route: data.route } : {}),
      ...(data.currentShift !== undefined ? { currentShift: data.currentShift } : {}),
      ...(data.process !== undefined ? { process: data.process } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      pinLocation,
      googleMapsUrl,
      latitude: lat ?? null,
      longitude: lng ?? null,
    },
  });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/wfm');
  revalidatePath('/staff');

  return { success: true, staff: updated };
}

// ── 3. Schedule Management Actions ───────────────────────────────────────────

export async function createScheduleAction(data: {
  staffNumbers: string[];
  role: string;
  shift: string;
  startDate: string;
  endDate: string;
  workingDays: number[];
  notes?: string;
  autoGenerateBookings?: boolean;
}) {
  await checkAdminAuth();

  const start = new Date(data.startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(data.endDate);
  end.setUTCHours(23, 59, 59, 999);

  const createdSchedules: any[] = [];
  let totalAutomatedBookings = 0;

  for (const staffNumber of data.staffNumbers) {
    const staff = await prisma.staff.findUnique({
      where: { staffNumber },
    });
    if (!staff) continue;

    const schedule = await prisma.schedule.create({
      data: {
        staffNumber,
        role: data.role || staff.role || 'Agent',
        shift: data.shift,
        startDate: start,
        endDate: end,
        workingDays: data.workingDays,
        notes: data.notes || null,
        status: 'ACTIVE',
      },
    });

    createdSchedules.push(schedule);

    if (data.autoGenerateBookings) {
      const result = await generateBookingsForSchedule(schedule.id);
      totalAutomatedBookings += result.createdCount;
    }
  }

  revalidatePath('/admin/wfm');
  revalidatePath('/admin');
  revalidatePath('/staff');

  return {
    success: true,
    schedulesCount: createdSchedules.length,
    automatedBookingsCount: totalAutomatedBookings,
  };
}

export async function generateBookingsForScheduleAction(scheduleId: string) {
  await checkAdminAuth();
  const res = await generateBookingsForSchedule(scheduleId);
  revalidatePath('/admin/wfm');
  revalidatePath('/admin');
  revalidatePath('/staff');
  return res;
}

async function generateBookingsForSchedule(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { staff: true },
  });

  if (!schedule || !schedule.staff) {
    return { success: false, error: 'Schedule or associated Staff not found', createdCount: 0, skippedCount: 0 };
  }

  const staff = schedule.staff;
  const workingDaysSet = new Set(schedule.workingDays);

  let currentDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);

  let createdCount = 0;
  let skippedCount = 0;

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay();

    if (workingDaysSet.has(dayOfWeek)) {
      const dateForBooking = new Date(currentDate);
      dateForBooking.setUTCHours(0, 0, 0, 0);

      // Check if duplicate already exists
      const existing = await prisma.booking.findUnique({
        where: {
          staffNumber_date_shift: {
            staffNumber: staff.staffNumber,
            date: dateForBooking,
            shift: schedule.shift,
          },
        },
      });

      if (!existing) {
        await prisma.booking.create({
          data: {
            name: staff.name,
            bmsNumber: staff.bmsNumber,
            staffNumber: staff.staffNumber,
            phoneNumber: staff.phoneNumber,
            role: schedule.role || staff.role || 'Agent',
            location: staff.location,
            route: staff.route,
            shift: schedule.shift,
            date: dateForBooking,
            address: staff.address,
            process: staff.process,
            pinLocation: staff.pinLocation,
            latitude: staff.latitude,
            longitude: staff.longitude,
            googleMapsUrl: staff.googleMapsUrl,
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    success: true,
    createdCount,
    skippedCount,
    message: `Automated transport bookings: ${createdCount} created, ${skippedCount} existing/skipped.`,
  };
}

export async function deleteScheduleAction(scheduleId: string) {
  await checkAdminAuth();
  await prisma.schedule.delete({
    where: { id: scheduleId },
  });
  revalidatePath('/admin/wfm');
  return { success: true };
}

export async function batchAutomateMonthBookingsAction(roleFilter?: string) {
  await checkAdminAuth();

  const whereClause: any = { status: 'ACTIVE' };
  if (roleFilter && roleFilter !== 'ALL') {
    whereClause.role = roleFilter;
  }

  const activeSchedules = await prisma.schedule.findMany({
    where: whereClause,
  });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const sched of activeSchedules) {
    const res = await generateBookingsForSchedule(sched.id);
    totalCreated += res.createdCount;
    totalSkipped += res.skippedCount;
  }

  revalidatePath('/admin/wfm');
  revalidatePath('/admin');
  revalidatePath('/staff');

  return {
    success: true,
    totalCreated,
    totalSkipped,
    schedulesProcessed: activeSchedules.length,
  };
}

// ── 4. Large Agent Roster Grid Actions (First to Last Day of Month) ──────────

const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getAgentMonthlyRosterAction(monthStr: string = '2026-11') {
  await checkAdminAuth();

  const targetMonth = monthStr || '2026-11';
  const [yearStr, monthNumStr] = targetMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthNumStr); // 1-indexed

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const daysInMonth = new Date(year, month, 0).getDate();
  const endOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

  // 1. Days array
  const monthDays = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat
    monthDays.push({
      dayNum: day,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      dayOfWeek,
      dayName: DAY_SHORT_NAMES[dayOfWeek],
    });
  }

  // 2. Fetch all Agents
  const agents = await prisma.staff.findMany({
    where: { role: 'Agent' },
    select: {
      id: true,
      name: true,
      bmsNumber: true,
      staffNumber: true,
      supervisorName: true,
      supervisorId: true,
      phoneNumber: true,
      location: true,
      route: true,
      address: true,
      currentShift: true,
      process: true,
    },
    orderBy: [{ supervisorName: 'asc' }, { name: 'asc' }],
  });

  // 3. Fetch all Supervisors for quick reassignment
  const supervisors = await prisma.staff.findMany({
    where: { role: 'Supervisor' },
    select: { id: true, name: true, bmsNumber: true },
    orderBy: { name: 'asc' },
  });

  // 4. Fetch all bookings for these agents in this month
  const agentStaffNumbers = agents.map((a) => a.staffNumber);
  const bookings = await prisma.booking.findMany({
    where: {
      staffNumber: { in: agentStaffNumbers },
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: {
      id: true,
      staffNumber: true,
      bmsNumber: true,
      shift: true,
      date: true,
    },
  });

  // Map: { [staffNumber]: { [dayNum]: { shift, bookingId } } }
  const bookingsMap: Record<string, Record<number, { shift: string; bookingId: string }>> = {};
  for (const b of bookings) {
    const day = new Date(b.date).getUTCDate();
    if (!bookingsMap[b.staffNumber]) {
      bookingsMap[b.staffNumber] = {};
    }
    bookingsMap[b.staffNumber][day] = {
      shift: b.shift,
      bookingId: b.id,
    };
  }

  return {
    monthStr,
    monthDays,
    agents,
    supervisors,
    bookingsMap,
  };
}

/**
 * Update or toggle a specific agent's shift on a single day.
 * If shift === 'OFF', deletes the booking.
 * Otherwise, updates or creates the transport booking.
 */
export async function updateAgentDayShiftAction(data: {
  staffNumber: string;
  dateStr: string; // YYYY-MM-DD
  shift: string;
}) {
  await checkAdminAuth();

  const bookingDate = new Date(`${data.dateStr}T00:00:00Z`);

  if (data.shift === 'OFF' || !data.shift.trim()) {
    // Delete existing booking for this staff member on this date
    await prisma.booking.deleteMany({
      where: {
        staffNumber: data.staffNumber,
        date: bookingDate,
      },
    });
    return { success: true, shift: 'OFF' };
  }

  // Find staff record for details
  const staff = await prisma.staff.findUnique({
    where: { staffNumber: data.staffNumber },
  });

  if (!staff) {
    throw new Error('Staff member not found');
  }

  // Check if booking exists
  const existing = await prisma.booking.findFirst({
    where: {
      staffNumber: staff.staffNumber,
      date: bookingDate,
    },
  });

  if (existing) {
    const updated = await prisma.booking.update({
      where: { id: existing.id },
      data: {
        shift: data.shift,
        bmsNumber: staff.bmsNumber,
      },
    });
    return { success: true, booking: updated };
  } else {
    const created = await prisma.booking.create({
      data: {
        name: staff.name,
        bmsNumber: staff.bmsNumber,
        staffNumber: staff.staffNumber,
        phoneNumber: staff.phoneNumber,
        role: 'Agent',
        location: staff.location,
        route: staff.route,
        shift: data.shift,
        date: bookingDate,
        address: staff.address,
        process: staff.process,
        pinLocation: staff.pinLocation,
        latitude: staff.latitude,
        longitude: staff.longitude,
        googleMapsUrl: staff.googleMapsUrl,
      },
    });
    return { success: true, booking: created };
  }
}

/**
 * Batch apply a shift pattern (e.g. 5 days working, 2 days OFF) across an entire month for an agent
 */
export async function batchApplyAgentPatternAction(data: {
  staffNumber: string;
  monthStr: string; // YYYY-MM
  shift: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}) {
  await checkAdminAuth();

  const [yearStr, monthNumStr] = data.monthStr.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthNumStr);
  const daysInMonth = new Date(year, month, 0).getDate();

  const staff = await prisma.staff.findUnique({
    where: { staffNumber: data.staffNumber },
  });

  if (!staff) {
    throw new Error('Staff member not found');
  }

  const workingDaysSet = new Set(data.workingDays);
  let updatedCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay();
    const dateForBooking = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    if (workingDaysSet.has(dayOfWeek)) {
      // Upsert booking
      const existing = await prisma.booking.findFirst({
        where: {
          staffNumber: staff.staffNumber,
          date: dateForBooking,
        },
      });

      if (existing) {
        await prisma.booking.update({
          where: { id: existing.id },
          data: {
            shift: data.shift,
            bmsNumber: staff.bmsNumber,
          },
        });
      } else {
        await prisma.booking.create({
          data: {
            name: staff.name,
            bmsNumber: staff.bmsNumber,
            staffNumber: staff.staffNumber,
            phoneNumber: staff.phoneNumber,
            role: 'Agent',
            location: staff.location,
            route: staff.route,
            shift: data.shift,
            date: dateForBooking,
            address: staff.address,
            process: staff.process,
            latitude: staff.latitude,
            longitude: staff.longitude,
            googleMapsUrl: staff.googleMapsUrl,
          },
        });
      }
      updatedCount++;
    } else {
      // Rest day -> delete existing booking
      await prisma.booking.deleteMany({
        where: {
          staffNumber: staff.staffNumber,
          date: dateForBooking,
        },
      });
    }
  }

  return { success: true, updatedCount };
}

/**
 * Reassign supervisor for an agent
 */
export async function updateAgentSupervisorAction(data: {
  staffNumber: string;
  supervisorName: string;
}) {
  await checkAdminAuth();

  const updated = await prisma.staff.update({
    where: { staffNumber: data.staffNumber },
    data: { supervisorName: data.supervisorName },
  });

  revalidatePath('/admin/wfm');
  return { success: true, staff: updated };
}
