import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getLoggedInSupervisor } from '../../actions';
import { SupervisorAgentsClient } from './agents-client';

export const revalidate = 0;

export default async function SupervisorAgentsPage() {
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
    orderBy: { name: 'asc' },
  });

  return (
    <SupervisorAgentsClient
      initialAgents={agents}
      supervisorName={supervisor.name}
    />
  );
}
