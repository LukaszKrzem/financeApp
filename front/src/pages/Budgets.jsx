import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { AddBudgetDialog } from "@/components/AddBudgetDialog";

const formatBudgetAmount = (amount, currencyCode) => {
  const value = new Intl.NumberFormat("pl-PL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(parseFloat(amount)).toFixed(2));
  const code = (currencyCode || "PLN").toUpperCase();
  switch (code) {
    case "USD":
      return `$${value}`;
    case "EUR":
      return `${value} €`;
    case "GBP":
      return `£${value}`;
    case "PLN":
      return `${value} zł`;
    default:
      return `${value} ${code}`;
  }
};
export default function BudgetsPage({
  token,
  categories,
  budgets,
  setRefreshing,
  loading,
}) {
  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Budgets
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your spending limits for each month
          </p>
        </div>
        <AddBudgetDialog
          token={token}
          onBudgetAdded={() => {
            setRefreshing((prev) => prev + 1);
          }}
          categories={categories}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading data...
        </p>
      ) : (budgets || []).length === 0 ? (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
          You haven't defined any budget limits yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            if (!budget) return null;

            const spent = Number(budget.current_spent) || 0;
            const limit = Number(budget.limit) || 1;
            const percentage =
              budget.percent_used !== undefined
                ? budget.percent_used
                : Math.min((spent / limit) * 100, 100);
            const categoryName =
              budget.category_name ||
              `Category #${budget.categories_id_category}`;

            return (
              <div
                key={budget.id_budget}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-muted-foreground">
                    {categoryName}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {formatBudgetAmount(spent.toFixed(2), budget.currency_code)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{" "}
                    {formatBudgetAmount(limit.toFixed(2), budget.currency_code)}
                  </span>
                </div>

                <Progress value={percentage} className="h-2" />

                <p className="text-[11px] text-muted-foreground mt-1">
                  {limit - spent >= 0
                    ? `You have ${formatBudgetAmount((limit - spent).toFixed(2), budget.currency_code)} left`
                    : `You have exceeded the limit by ${formatBudgetAmount(Math.abs(limit - spent).toFixed(2), budget.currency_code)}!`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
