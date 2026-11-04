'use client';

import { Bus, LayoutDashboard, CalendarDays, CalendarClock, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const items = [
  { title: 'My Bookings', url: '/staff', icon: LayoutDashboard },
  { title: 'My Schedule', url: '/staff/schedule', icon: CalendarClock },
  { title: 'Transport Details', url: '/staff/profile', icon: MapPin },
  { title: 'My Calendar', url: '/staff/calendar', icon: CalendarDays },
];

export function StaffSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-3 group-data-[collapsible=icon]:px-0">
        <div className="flex w-full items-center gap-2 font-bold text-lg text-primary overflow-hidden group-data-[collapsible=icon]:justify-center">
          <Bus className="h-6 w-6 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Staff Portal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || (item.url !== '/staff' && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
        © 2026 Transport
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
