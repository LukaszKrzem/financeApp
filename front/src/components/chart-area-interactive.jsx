import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/context/DataContext';

const chartConfig = {
  spending: { label: 'Spending', color: 'var(--foreground)' },
  income: { label: 'Income', color: 'var(--muted-foreground)' },
};

const formatCompactMoney = (value, currency = 'PLN') => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const MONTHS_MAP = { '5m': 5, '3m': 3, '1m': 1 };

export function ChartAreaInteractive() {
  const { transactions = [], accounts = [] } = useData();

  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('5m');
  const [accountId, setAccountId] = React.useState('ALL');
  const [seriesFilter, setSeriesFilter] = React.useState('BOTH');

  React.useEffect(() => {
    if (isMobile) setTimeRange('3m');
  }, [isMobile]);

  const selectedAccount = accounts.find(
    (a) => String(a.id_account) === accountId
  );
  const currency = selectedAccount?.currency_code || 'PLN';

  const chartData = React.useMemo(() => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_MAP[timeRange] ?? 5));
    startDate.setHours(0, 0, 0, 0);

    const grouped = {};
    transactions?.forEach((tx) => {
      if (accountId !== 'ALL' && String(tx.Account_id_account) !== accountId)
        return;

      const txDate = new Date(tx.transaction_date || tx.date);
      if (txDate < startDate || txDate > endDate) return;

      const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthStr])
        grouped[monthStr] = { date: monthStr, spending: 0, income: 0 };

      const amount = parseFloat(tx.amount) || 0;
      const exchangeRate = parseFloat(tx.exchange_rate) || 1;
      const isIncome =
        tx.type === 'INCOME' || tx.is_income === 'T' || tx.is_income === 'Y';

      if (isIncome) grouped[monthStr].income += amount * exchangeRate;
      else grouped[monthStr].spending += amount * exchangeRate;
    });

    const filledData = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      filledData.push(
        grouped[monthStr] ?? { date: monthStr, spending: 0, income: 0 }
      );
      current.setMonth(current.getMonth() + 1);
    }

    return filledData;
  }, [transactions, timeRange, accountId]);

  return (
    <Card className="@container/card border-border/50">
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>
          Comparing income vs spending over time
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2 pt-2">
          <Label htmlFor="account-select" className="sr-only">
            Account:
          </Label>
          <Select value={accountId} onValueChange={(val) => setAccountId(val)}>
            <SelectTrigger className="w-36 h-8 text-xs" id="account-select">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem
                  key={String(acc.id_account)}
                  value={String(acc.id_account)}
                >
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {['BOTH', 'INCOME', 'SPENDING'].map((filter) => (
              <Button
                key={filter}
                variant={seriesFilter === filter ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-3 text-xs w-[72px]"
                onClick={() => setSeriesFilter(filter)}
              >
                {filter === 'BOTH'
                  ? 'All'
                  : filter === 'INCOME'
                    ? 'Income'
                    : 'Spending'}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillSpending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-spending)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-spending)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => {
                const [year, month] = v.split('-');
                return new Date(year, month - 1).toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit',
                });
              }}
            />
            <YAxis
              type="number"
              domain={[0, 'auto']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => formatCompactMoney(val, currency)}
              width={65}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return new Date(year, month - 1).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        year: 'numeric',
                      }
                    );
                  }}
                  formatter={(val, name) => [
                    formatCompactMoney(Number(val), currency),
                    <span key={name} className="ml-2">
                      {name}
                    </span>,
                  ]}
                />
              }
            />
            {(seriesFilter === 'BOTH' || seriesFilter === 'INCOME') && (
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
            {(seriesFilter === 'BOTH' || seriesFilter === 'SPENDING') && (
              <Area
                dataKey="spending"
                type="monotone"
                fill="url(#fillSpending)"
                stroke="var(--color-spending)"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
