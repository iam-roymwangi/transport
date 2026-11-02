import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StaffScheduleClient } from './schedule-client';

export const revalidate = 0;

export default async function StaffSchedulePage() {
  const staffNumber = (await cookies()).get('staff_token')?.value;

  if (!staffNumber) {
    redirect('/staff/login');
  }

  const staff = await prisma.staff.findUnique({
    where: { staffNumber },
  });

  if (!staff) {
    redirect('/staff/login');
  }

  const schedules = await prisma.schedule.findMany({
    where: { staffNumber, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
  });

  return (
    <div className="space-y-6">
      <StaffScheduleClient staff={staff} schedules={schedules} />
    </div>
  );
}
