import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
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
import { formatMoney } from '@/lib/formatMoney';

const chartConfig = {
  spending: { label: 'Spending', color: 'var(--color-spending-chart)' },
  income: { label: 'Income', color: 'var(--color-income-chart)' },
  net: { label: 'net', color: 'var(--color-net-chart)' },
};

export function ChartAreaInteractive() {
  const { transactions = [], accounts = [] } = useData();

  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('6m');
  const [accountId, setAccountId] = React.useState('ALL');
  const [seriesFilter, setSeriesFilter] = React.useState('BOTH');

  const timeRanges = [
    { label: 'Last Month', value: '1m' },
    { label: '3 Months', value: '3m' },
    { label: '6 Months', value: '6m' },
    { label: 'Year to Date', value: 'ytd' },
  ];

  const MONTHS_MAP = {
    '1m': 1,
    '3m': 3,
    '6m': 6,
    ytd: new Date().getMonth() + 1,
  };

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
    startDate.setMonth(startDate.getMonth() - (MONTHS_MAP[timeRange] ?? 6));
    if (timeRange === 'ytd') {
      startDate.setMonth(0);
    }
    startDate.setDate(1);
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
      const isIncome = tx.type === 'INCOME';

      if (isIncome) grouped[monthStr].income += amount * exchangeRate;
      else grouped[monthStr].spending += amount * exchangeRate;
    });

    const filledData = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const entry = grouped[monthStr] ?? {
        date: monthStr,
        spending: 0,
        income: 0,
      };
      filledData.push({
        ...entry,
        net: entry.income - entry.spending,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return filledData;
  }, [transactions, timeRange, accountId]);

  const totals = React.useMemo(() => {
    return chartData.reduce(
      (acc, curr) => {
        acc.spending += curr.spending;
        acc.income += curr.income;
        acc.net += curr.net;
        return acc;
      },
      { spending: 0, income: 0, net: 0 }
    );
  }, [chartData]);

  const showIncome = seriesFilter === 'BOTH' || seriesFilter === 'INCOME';
  const showSpending = seriesFilter === 'BOTH' || seriesFilter === 'SPENDING';
  const showNet = seriesFilter === 'BOTH';

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
                variant={seriesFilter === filter ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs w-[72px] data-[active=true]:bg-accent"
                data-active={seriesFilter === filter}
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="flex items-baseline justify-between gap-2 rounded-lg border border-border/50 bg-accent/30 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Income
            </span>
            <span className="text-sm font-bold tabular-nums text-[var(--color-income-chart)]">
              {formatMoney(totals.income, currency)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 rounded-lg border border-border/50 bg-accent/30 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Spending
            </span>
            <span className="text-sm font-bold tabular-nums text-[var(--color-spending-chart)]">
              {formatMoney(totals.spending, currency)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 rounded-lg border border-border/50 bg-accent/30 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Net
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                totals.net >= 0
                  ? 'text-[var(--color-income-chart)]'
                  : 'text-[var(--color-spending-chart)]'
              }`}
            >
              {totals.net >= 0 ? '+' : ''}
              {formatMoney(totals.net, currency)}
            </span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full [--color-income-chart:oklch(0.627_0.194_149.214)] [--color-spending-chart:oklch(0.577_0.245_27.325)] [--color-net-chart:oklch(0.546_0.245_262.881)]"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="fillSpending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-spending-chart)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-spending-chart)"
                  stopOpacity={0.03}
                />
              </linearGradient>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income-chart)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income-chart)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-net-chart)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-net-chart)"
                  stopOpacity={0.02}
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
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => formatMoney(val, currency)}
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
                  formatter={(val, name) => {
                    if (name === 'net') {
                      const isPositive = Number(val) >= 0;
                      return [
                        <span
                          key={name}
                          className={
                            isPositive
                              ? 'text-[var(--color-income-chart)]'
                              : 'text-[var(--color-spending-chart)]'
                          }
                        >
                          {isPositive ? '+' : ''}
                          {formatMoney(Number(val), currency)}
                        </span>,
                        <span key={`${name}-label`} className="ml-2">
                          {chartConfig.net.label}
                        </span>,
                      ];
                    }
                    return [
                      formatMoney(Number(val), currency),
                      <span key={name} className="ml-2">
                        {name}
                      </span>,
                    ];
                  }}
                />
              }
            />
            {showNet && (
              <>
                <ReferenceLine
                  y={0}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Area
                  dataKey="net"
                  type="monotone"
                  fill="url(#fillNet)"
                  stroke="var(--color-net-chart)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  animationDuration={600}
                  activeDot={{
                    r: 4,
                    style: { fill: 'var(--color-net-chart)', strokeWidth: 0 },
                  }}
                />
              </>
            )}
            {showIncome && (
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke="var(--color-income-chart)"
                strokeWidth={2}
                animationDuration={600}
                activeDot={{
                  r: 4,
                  style: { fill: 'var(--color-income-chart)', strokeWidth: 0 },
                }}
              />
            )}
            {showSpending && (
              <Area
                dataKey="spending"
                type="monotone"
                fill="url(#fillSpending)"
                stroke="var(--color-spending-chart)"
                strokeWidth={2}
                animationDuration={600}
                activeDot={{
                  r: 4,
                  style: {
                    fill: 'var(--color-spending-chart)',
                    strokeWidth: 0,
                  },
                }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
