import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { StaffClientTable } from './client-table';

// Use a global prisma instance or create a new one for this component

// Revalidate this page dynamically or every few seconds if needed
export const revalidate = 0;

export default async function StaffDirectoryPage() {
  const staffMembers = await prisma.staff.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active employees in the system
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>
            Manage all staff members, their locations, routes, and processes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffClientTable initialStaff={staffMembers} />
        </CardContent>
      </Card>
    </div>
  );
}
