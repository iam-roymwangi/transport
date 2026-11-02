import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from './profile-client';

export const revalidate = 0;

export default async function StaffProfilePage() {
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

  return (
    <div className="space-y-6">
      <ProfileClient staff={staff} />
    </div>
  );
}
