import { Progress } from '@/components/ui/progress';
import { AddBudgetDialog } from '@/components/AddBudgetDialog';
import { useData } from '@/context/DataContext';
import { formatMoney } from '@/lib/formatMoney';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { IconTargetArrow } from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function BudgetsPage() {
  const { budgets = [], loading } = useData();

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
        <AddBudgetDialog />
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (budgets || []).length === 0 ? (
        <EmptyState
          icon={IconTargetArrow}
          title="No budgets yet"
          description="Set spending limits for your categories to keep your finances on track."
          action={<AddBudgetDialog />}
        />
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
              budget.category_name || `Category #${budget.category_id}`;

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
                    {formatMoney(spent, budget.currency_code, false, false)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatMoney(limit, budget.currency_code, false, false)}
                  </span>
                </div>

                <Progress value={percentage} className="h-2" />

                <p className="text-[11px] text-muted-foreground mt-1">
                  {limit - spent >= 0
                    ? `You have ${formatMoney(limit - spent, budget.currency_code, false, false)} left`
                    : `You have exceeded the limit by ${formatMoney(limit - spent, budget.currency_code, false, false)}!`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
