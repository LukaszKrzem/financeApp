import {
  IconCreditCard,
  IconCurrencyDollar,
  IconLayoutDashboard,
  IconReceipt,
  IconSettings,
  IconTags,
  IconTarget,
  IconWallet,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    { title: 'Overview', url: '/dashboard', icon: IconLayoutDashboard },
    { title: 'Transactions', url: '/transactions', icon: IconReceipt },
    { title: 'Budgets', url: '/budgets', icon: IconTarget },
    { title: 'Savings Goals', url: '/savings-goals', icon: IconWallet },
    { title: 'Accounts', url: '/accounts', icon: IconCreditCard },
    { title: 'Subscriptions', url: '/subscriptions', icon: IconCalendarEvent },
  ],
  navSecondary: [{ title: 'Settings', url: '/settings', icon: IconSettings }],
  documents: [
    { name: 'Categories', url: '#', icon: IconTags },
    { name: 'Wallets', url: '#', icon: IconWallet },
    { name: 'Subscriptions', url: '#', icon: IconCurrencyDollar },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard">
                <IconWallet className="size-5! text-primary" />
                <span className="text-base font-semibold">SmartBudget</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full w-full">
          <NavMain items={data.navMain} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
