import { ReactNode } from 'react';
import { LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supervisorLogoutAction, getLoggedInSupervisor } from '../actions';
import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SupervisorSidebar } from './supervisor-sidebar';
import { AdminPageLoader } from '@/components/admin-page-loader';

export default async function SupervisorLayout({ children }: { children: ReactNode }) {
  const supervisor = await getLoggedInSupervisor();

  if (!supervisor || supervisor.role !== 'Supervisor') {
    redirect('/supervisor/login');
  }

  return (
    <SidebarProvider>
      <AdminPageLoader />
      <SupervisorSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-px h-4 bg-border mx-2" />
          
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm hidden sm:inline text-slate-800 dark:text-slate-200">
              Supervisor Workspace
            </span>
            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-xs gap-1.5 py-0.5">
              <UserCheck className="w-3 h-3 text-purple-600" />
              {supervisor.name} ({supervisor.bmsNumber ? `BMS: ${supervisor.bmsNumber}` : supervisor.staffNumber})
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <form action={supervisorLogoutAction}>
              <Button variant="ghost" size="sm" type="submit" title="Logout" className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/20">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
