import {
  IconArrowDown,
  IconArrowUp,
  IconTrendingDown,
  IconTrendingUp,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
      className={`h-5 px-1.5 text-[12px] font-bold gap-0.5 border-none bg-transparent ${
        isGood ? 'text-emerald-500' : 'text-destructive'
      }`}
    >
      <Icon className="size-5 shrink-0" />
      {isUp ? '+' : ''}
      {percent}%
    </Badge>
  );
}

function StatusBadge({ label, tone = 'neutral' }) {
  const toneClass =
    tone === 'warning'
      ? 'text-amber-500'
      : tone === 'danger'
        ? 'text-destructive'
        : 'text-muted-foreground';
  const Icon = tone === 'danger' ? IconAlertTriangle : null;
  return (
    <Badge
      variant="outline"
      className={`h-5 px-1.5 text-[10px] font-bold gap-0.5 border-none bg-transparent ${toneClass}`}
    >
      {Icon && <Icon className="size-3 shrink-0" />}
      {label}
    </Badge>
  );
}

function ProgressBar({ percent, colorClass }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10 shrink-0">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
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
    <Card className="@container/card border-border/50 bg-card overflow-hidden shadow-none transition-colors hover:border-border">
      <div className="px-3 flex flex-col h-full gap-2">
        <div className="flex items-center justify-between min-w-0 min-h-5 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-md ${iconBg}`}
            >
              <Icon className={`size-3 ${iconColor}`} />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider">
              {label}
            </span>
          </div>
          <div className="shrink-0">{action}</div>
        </div>

        <div>
          <h3 className="text-base @[160px]:text-lg font-bold tabular-nums tracking-tight leading-none text-foreground truncate">
            {value}
          </h3>
        </div>

        {footer && (
          <div className="mt-auto flex flex-col gap-1.5">{footer}</div>
        )}
      </div>
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

  const budgetTone =
    averageBudgetUsage > 100
      ? 'danger'
      : averageBudgetUsage >= 80
        ? 'warning'
        : null;

  return (
    <div className="grid grid-cols-2 gap-2 px-3 @4xl/main:grid-cols-4 lg:px-6">
      <StatCard
        icon={IconArrowDown}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        label="Spending"
        value={formatMoney(current.spent, baseCurrency)}
        action={<TrendBadge percent={spentTrend} goodDirection="down" />}
        footer={
          <>
            <span className="text-[11px] text-muted-foreground font-medium">
              vs. last month
            </span>
            <div className="h-1.5 w-full shrink-0 invisible" />
          </>
        }
      />

      <StatCard
        icon={IconArrowUp}
        iconBg="bg-chart-2/10"
        iconColor="text-chart-2"
        label="Income"
        value={formatMoney(current.income, baseCurrency)}
        action={<TrendBadge percent={incomeTrend} goodDirection="up" />}
        footer={
          <>
            <span className="text-[11px] text-muted-foreground font-medium">
              vs. last month
            </span>
            <div className="h-1.5 w-full shrink-0 invisible" />
          </>
        }
      />

      <StatCard
        icon={savings >= 0 ? IconTrendingUp : IconTrendingDown}
        iconBg={savings >= 0 ? 'bg-chart-3/10' : 'bg-destructive/10'}
        iconColor={savings >= 0 ? 'text-chart-3' : 'text-destructive'}
        label="Savings"
        value={formatMoney(savings, baseCurrency)}
        action={
          savings < 0 ? <StatusBadge label="Deficit" tone="danger" /> : null
        }
        footer={
          <>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              {savings >= 0
                ? `${savingsPercent}% saved`
                : 'Spending exceeded income'}
            </span>
            <ProgressBar
              percent={savings < 0 ? 100 : savingsPercent}
              colorClass={savings >= 0 ? 'bg-emerald-500' : 'bg-destructive'}
            />
          </>
        }
      />

      <StatCard
        icon={IconTrendingDown}
        iconBg="bg-chart-4/10"
        iconColor="text-chart-4"
        label="Budget"
        value={formatMoney(budgetLeft, baseCurrency)}
        action={
          budgetTone ? (
            <StatusBadge
              label={budgetTone === 'danger' ? 'Over' : 'Near limit'}
              tone={budgetTone}
            />
          ) : null
        }
        footer={
          budgets.length > 0 ? (
            <>
              <span className="text-[10px] text-muted-foreground font-medium truncate">
                {averageBudgetUsage}% used
              </span>
              <ProgressBar
                percent={averageBudgetUsage}
                colorClass={budgetColor}
              />
            </>
          ) : (
            <>
              <span className="text-[10px] text-muted-foreground">
                No budgets set
              </span>
              <div className="h-1.5 w-full shrink-0 invisible" />
            </>
          )
        }
      />
    </div>
  );
}
