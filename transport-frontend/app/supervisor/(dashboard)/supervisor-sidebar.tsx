'use client';

import {
  Bus,
  LayoutDashboard,
  FileCheck2,
  Users,
  Compass,
  MapPin,
  CalendarDays,
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
    url: '/supervisor',
    icon: LayoutDashboard,
  },
  {
    title: 'Shift Edit Requests',
    url: '/supervisor/requests',
    icon: FileCheck2,
  },
  {
    title: 'My Agents & Transport',
    url: '/supervisor/agents',
    icon: Users,
  },
];

export function SupervisorSidebar() {
  const pathname = usePathname();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    setPendingUrl(null);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-3 group-data-[collapsible=icon]:px-0">
        <div className="flex w-full items-center gap-2 font-bold text-lg text-purple-700 dark:text-purple-400 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <Bus className="h-6 w-6 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Supervisor Portal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== '/supervisor' && pathname.startsWith(item.url));
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
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 shrink-0 ml-auto group-data-[collapsible=icon]:hidden" />
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
        © 2026 Transport Supervisor
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
