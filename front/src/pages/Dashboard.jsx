import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SpendingCategories } from "@/components/spending-categories";
import { RecentTransactions } from "@/components/recent-transactions";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Dashboard({ user, onLogout, token }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" onLogout={onLogout} user={user} />
      <SidebarInset>
        <SiteHeader user={user} token={token} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
                <SpendingCategories />
                <RecentTransactions />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
