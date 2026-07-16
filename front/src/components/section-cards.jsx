import {
  IconArrowDown,
  IconArrowUp,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { formatMoney } from '@/lib/formatMoney';

const isIncomeTransaction = (transaction) => transaction.type === 'INCOME';

const pctChange = (curr, prev) => {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 100);
};

function TrendBadge({ percent, goodDirection = 'up' }) {
  const isUp = percent >= 0;
  const isGood = goodDirection === 'up' ? isUp : !isUp;
  const Icon = isUp ? IconTrendingUp : IconTrendingDown;
  return (
    <Badge
      variant="outline"
      className={
        isGood
          ? 'text-primary border-primary/30'
          : 'text-destructive border-destructive/30'
      }
    >
      <Icon className="size-3" />
      {isUp ? '+' : ''}
      {percent}%
    </Badge>
  );
}

function ProgressBar({ percent, colorClass }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  action,
  footer,
}) {
  return (
    <Card className="@container/card border-border/50 bg-card gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-1 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="flex items-center gap-1.5 text-xs">
            <span
              className={`flex size-5 items-center justify-center rounded-md ${iconBg}`}
            >
              <Icon className={`size-3 ${iconColor}`} />
            </span>
            {label}
          </CardDescription>
          {action}
        </div>
        <CardTitle className="text-lg font-semibold tabular-nums break-words">
          {value}
        </CardTitle>
        {footer && <div className="flex flex-col gap-1 text-xs">{footer}</div>}
      </CardHeader>
    </Card>
  );
}

export function SectionCards() {
  const {
    transactions = [],
    budgets = [],
    accounts = [],
    currencies = [],
  } = useData();

  const baseAccount = accounts[0];
  const baseCurrency = baseAccount?.currency_code || 'PLN';
  const baseRate = useMemo(() => {
    if (!baseAccount) return 1;
    const targetCurrency = currencies.find(
      (c) => c.id_currency === baseAccount.Currency_id_currency
    );
    return parseFloat(targetCurrency?.exchange_rate) || 1;
  }, [baseAccount, currencies]);

  const { current, previous } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);

    const buckets = {
      current: { income: 0, spent: 0 },
      previous: { income: 0, spent: 0 },
    };

    transactions.forEach((t) => {
      const date = new Date(t.transaction_date || t.date);
      const txRate = parseFloat(t.exchange_rate) || 1;
      const amount = (Number(t.amount) || 0) * (txRate / baseRate);

      const bucketKey = isIncomeTransaction(t) ? 'income' : 'spent';

      if (
        date.getFullYear() === currentYear &&
        date.getMonth() === currentMonth
      ) {
        buckets.current[bucketKey] += amount;
      } else if (
        date.getFullYear() === prevMonthDate.getFullYear() &&
        date.getMonth() === prevMonthDate.getMonth()
      ) {
        buckets.previous[bucketKey] += amount;
      }
    });

    return buckets;
  }, [transactions, baseRate]);

  const spentTrend = pctChange(current.spent, previous.spent);
  const incomeTrend = pctChange(current.income, previous.income);

  const savings = current.income - current.spent;
  const savingsPercent =
    current.income > 0 ? Math.round((savings / current.income) * 100) : 0;

  const budgetLeft = useMemo(() => {
    return budgets.reduce((sum, budget) => {
      const limit = Number(budget.limit) || 0;
      const spent = Number(budget.current_spent) || 0;
      const budgetRate =
        parseFloat(
          currencies.find((c) => c.id_currency === budget.Currency_id_currency)
            ?.exchange_rate
        ) || 1;
      return sum + (limit - spent) * (budgetRate / baseRate);
    }, 0);
  }, [budgets, currencies, baseRate]);

  const averageBudgetUsage =
    budgets.length > 0
      ? Math.round(
          budgets.reduce(
            (sum, budget) => sum + (Number(budget.percent_used) || 0),
            0
          ) / budgets.length
        )
      : 0;

  const budgetColor =
    averageBudgetUsage > 100
      ? 'bg-destructive'
      : averageBudgetUsage >= 80
        ? 'bg-amber-500'
        : 'bg-chart-3';

  return (
    <div className="grid grid-cols-2 gap-3 px-4 @5xl/main:grid-cols-4 lg:px-6">
      <StatCard
        icon={IconArrowDown}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        label="This Month's Spending"
        value={formatMoney(current.spent, baseCurrency)}
        action={<TrendBadge percent={spentTrend} goodDirection="down" />}
        footer={
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            vs. last month
          </div>
        }
      />

      <StatCard
        icon={IconArrowUp}
        iconBg="bg-chart-2/10"
        iconColor="text-chart-2"
        label="This Month's Income"
        value={formatMoney(current.income, baseCurrency)}
        action={<TrendBadge percent={incomeTrend} goodDirection="up" />}
        footer={
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            vs. last month
          </div>
        }
      />

      <StatCard
        icon={IconTrendingUp}
        iconBg="bg-chart-3/10"
        iconColor="text-chart-3"
        label="Monthly Savings"
        value={formatMoney(savings, baseCurrency)}
        footer={
          <>
            <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
              {savings >= 0
                ? `${savingsPercent}% of income saved`
                : 'Spending exceeded income'}
            </div>
            <ProgressBar
              percent={savings < 0 ? 100 : savingsPercent}
              colorClass={savings >= 0 ? 'bg-primary' : 'bg-destructive'}
            />
          </>
        }
      />

      <StatCard
        icon={IconTrendingDown}
        iconBg="bg-chart-4/10"
        iconColor="text-chart-4"
        label="Budget Left"
        value={formatMoney(budgetLeft, baseCurrency)}
        footer={
          budgets.length > 0 ? (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
                {averageBudgetUsage}% of budget used
              </div>
              <ProgressBar
                percent={averageBudgetUsage}
                colorClass={budgetColor}
              />
            </>
          ) : (
            <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
              No budgets defined yet
            </div>
          )
        }
      />
    </div>
  );
}
