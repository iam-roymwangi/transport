import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '../actions';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { getSystemStatus } from '../settings-actions';
import { BookingStatusToggle } from './booking-status-toggle';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isBookingsOpen = await getSystemStatus();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-px h-4 bg-border mx-2" />
          <BookingStatusToggle initialStatus={isBookingsOpen} />
          
          <div className="ml-auto flex items-center gap-2">
            <form action={logoutAction}>
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
