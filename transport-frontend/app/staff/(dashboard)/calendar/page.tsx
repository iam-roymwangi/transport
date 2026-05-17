import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StaffCalendarClient } from './calendar-client';

export const revalidate = 0;

export default async function StaffCalendarPage() {
  const staffNumber = (await cookies()).get('staff_token')?.value;
  if (!staffNumber) redirect('/staff/login');

  const bookings = await prisma.booking.findMany({
    where: { staffNumber },
    select: { date: true, shift: true, id: true },
  });

  // Build a map of date → booking count
  const bookedDates: Record<string, number> = {};
  for (const b of bookings) {
    const key = new Date(b.date).toISOString().split('T')[0];
    bookedDates[key] = (bookedDates[key] ?? 0) + 1;
  }

  return <StaffCalendarClient bookedDates={bookedDates} />;
}
