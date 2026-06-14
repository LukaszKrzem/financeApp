import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SpendingCategories } from "@/components/spending-categories";
import { RecentTransactions } from "@/components/recent-transactions";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

export default function Dashboard({
  user,
  onLogout,
  token,
  refreshing,
  setRefreshing,
  accounts,
  categories,
  budgets,
  transactions,
  loading,
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards transactions={transactions} budgets={budgets} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive transactions={transactions} />
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
            <SpendingCategories transactions={transactions} />
            <RecentTransactions transactions={transactions} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
