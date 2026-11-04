'use client';

import {
  Bus,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  DollarSign,
  CalendarClock,
  Navigation,
  Layers,
  Loader2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
  {
    title: 'Dashboard Overview',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'WFM & Schedules',
    url: '/admin/wfm',
    icon: CalendarClock,
  },
  {
    title: 'Campaign Management',
    url: '/admin/campaigns',
    icon: Layers,
  },
  {
    title: 'Trip Tracking & Carpool',
    url: '/admin/trips',
    icon: Navigation,
  },
  {
    title: 'Edit Requests',
    url: '/admin/requests',
    icon: FileText,
  },
  {
    title: 'Staff Directory',
    url: '/admin/staff',
    icon: Users,
  },
  {
    title: 'Expenses',
    url: '/admin/expenses',
    icon: DollarSign,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    setPendingUrl(null);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-3 group-data-[collapsible=icon]:px-0">
        <div className="flex w-full items-center gap-2 font-bold text-lg text-primary overflow-hidden group-data-[collapsible=icon]:justify-center">
          <Bus className="h-6 w-6 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Transport Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== '/admin' && pathname.startsWith(item.url));
                const isNavigating = pendingUrl === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.url}
                        onClick={() => {
                          if (pathname !== item.url) {
                            setPendingUrl(item.url);
                          }
                        }}
                        className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </div>
                        {isNavigating && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0 ml-auto group-data-[collapsible=icon]:hidden" />
                        )}
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
