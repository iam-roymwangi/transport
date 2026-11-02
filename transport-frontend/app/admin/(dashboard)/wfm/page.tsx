import { prisma } from '@/lib/prisma';
import { WfmDashboard } from './wfm-dashboard';
import { getRoleShiftsAction, getAgentMonthlyRosterAction } from '../../wfm-actions';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function WfmPage() {
  const currentMonth = format(new Date(), 'yyyy-MM');

  // 1. Fetch all active schedules with staff details
  const schedules = await prisma.schedule.findMany({
    where: { status: 'ACTIVE' },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          bmsNumber: true,
          staffNumber: true,
          role: true,
          location: true,
          route: true,
          address: true,
          pinLocation: true,
          latitude: true,
          longitude: true,
          googleMapsUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch role shifts (ensures seeded defaults exist)
  const shifts = await getRoleShiftsAction();

  // 3. Fetch all active staff
  const staff = await prisma.staff.findMany({
    select: {
      id: true,
      name: true,
      bmsNumber: true,
      staffNumber: true,
      role: true,
      phoneNumber: true,
      location: true,
      route: true,
      address: true,
      pinLocation: true,
      latitude: true,
      longitude: true,
      googleMapsUrl: true,
      currentShift: true,
      process: true,
    },
    orderBy: { name: 'asc' },
  });

  // 4. Fetch campaign rest day configs
  const campaigns = await prisma.campaignConfig.findMany({
    orderBy: { name: 'asc' },
  });

  // 5. Fetch initial Agent monthly roster for current month
  let initialRosterData = null;
  try {
    initialRosterData = await getAgentMonthlyRosterAction(currentMonth);
  } catch (err) {
    console.error('Error fetching initial agent roster:', err);
  }

  return (
    <WfmDashboard
      initialSchedules={schedules}
      initialShifts={shifts}
      initialStaff={staff}
      initialCampaigns={campaigns}
      initialRosterData={initialRosterData}
    />
  );
}
