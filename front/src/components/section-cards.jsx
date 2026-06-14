import {
  IconArrowDown,
  IconArrowUp,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useMemo } from "react"; // <--- 1. IMPORTUJEMY useMemo

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formatMoney = (value) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    notation: "compact",
  }).format(value);

const isIncomeTransaction = (transaction) =>
  transaction.type === "INCOME" ||
  transaction.is_income === "T" ||
  transaction.is_income === "Y";

export function SectionCards({ transactions = [], budgets = [] }) {
  const totals = useMemo(() => {
    return transactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount) || 0;
        const exchangeRate = parseFloat(transaction.exchange_rate) || 1;

        if (isIncomeTransaction(transaction)) {
          summary.income += amount * exchangeRate;
        } else {
          summary.spent += amount * exchangeRate;
        }

        return summary;
      },
      { income: 0, spent: 0 },
    );
  }, [transactions]);

  const savings = totals.income - totals.spent;

  const savingsPercent =
    totals.income > 0 ? Math.round((savings / totals.income) * 100) : 0;

  const budgetLeft = useMemo(() => {
    return budgets.reduce((sum, budget) => {
      const limit = Number(budget.limit) || 0;
      const spent = Number(budget.current_spent) || 0;
      return sum + (limit - spent);
    }, 0);
  }, [budgets]);

  const averageBudgetUsage =
    budgets.length > 0
      ? Math.round(
          budgets.reduce(
            (sum, budget) => sum + (Number(budget.percent_used) || 0),
            0,
          ) / budgets.length,
        )
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border-border/50 bg-card overflow-hidden">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <IconArrowDown className="size-4 text-primary" />
            </span>
            Total Spent
          </CardDescription>
          {/* Zwróć uwagę: Poprawione klasy dla tytułów (bez ucinania) */}
          <CardTitle className="text-xl font-semibold tabular-nums break-words @[250px]/card:text-2xl">
            {formatMoney(totals.spent)}
          </CardTitle>
          <CardAction className="min-w-0">
            <Badge
              variant="outline"
              className="text-destructive border-destructive/30"
            >
              <IconTrendingUp className="size-3" />
              Expenses
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            From {transactions.length} transactions
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card border-border/50 bg-card overflow-hidden">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
              <IconArrowUp className="size-4 text-chart-2" />
            </span>
            Income
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums break-words @[250px]/card:text-2xl">
            {formatMoney(totals.income)}
          </CardTitle>
          <CardAction className="min-w-0">
            <Badge variant="outline" className="text-primary border-primary/30">
              <IconTrendingUp className="size-3" />
              Income
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Registered in transaction history
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card border-border/50 bg-card overflow-hidden">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
              <IconTrendingUp className="size-4 text-chart-3" />
            </span>
            Savings
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums break-words @[250px]/card:text-2xl">
            {formatMoney(savings)}
          </CardTitle>
          <CardAction className="min-w-0">
            <Badge
              variant="outline"
              className={
                savings >= 0
                  ? "text-primary border-primary/30"
                  : "text-destructive border-destructive/30"
              }
            >
              <IconTrendingUp className="size-3" />
              {savings >= 0 ? "Positive" : "Negative"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            {savingsPercent}% of income saved
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card border-border/50 bg-card overflow-hidden">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-chart-4/10">
              <IconTrendingDown className="size-4 text-chart-4" />
            </span>
            Budget Left
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums break-words @[250px]/card:text-2xl">
            {formatMoney(budgetLeft)}
          </CardTitle>
          <CardAction className="min-w-0">
            <Badge
              variant="outline"
              className={
                budgetLeft >= 0
                  ? "text-chart-3 border-chart-3/30"
                  : "text-destructive border-destructive/30"
              }
            >
              {budgetLeft >= 0 ? "On Track" : "Over Limit"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            {budgets.length > 0
              ? `${averageBudgetUsage}% of budget used`
              : "No budgets defined yet"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
