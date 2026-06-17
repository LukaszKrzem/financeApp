import {
  IconChartPie,
  IconCreditCard,
  IconCurrencyDollar,
  IconHelp,
  IconLayoutDashboard,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconTags,
  IconTarget,
  IconWallet,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: IconReceipt,
    },
    // {
    //   title: "Analytics",
    //   url: "#",
    //   icon: IconChartPie,
    // },
    {
      title: "Budgets",
      url: "/budgets",
      icon: IconTarget,
    },
    {
      title: "Savings Goals",
      url: "/savings-goals",
      icon: IconWallet,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: IconCreditCard,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    // {
    //   title: "Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
  documents: [
    {
      name: "Categories",
      url: "#",
      icon: IconTags,
    },
    {
      name: "Wallets",
      url: "#",
      icon: IconWallet,
    },
    {
      name: "Subscriptions",
      url: "#",
      icon: IconCurrencyDollar,
    },
  ],
};

export function AppSidebar({ user, onLogout, ...props }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <IconWallet className="size-5! text-primary" />
                <span className="text-base font-semibold">SmartBudget</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full w-full">
          <NavMain items={data.navMain} />
          {/* <NavDocuments items={data.documents} />*/}
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
