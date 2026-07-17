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

const TIME_RANGES = [
  { label: 'Last Month', value: '1m' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: 'Year to Date', value: 'ytd' },
];

const MONTHS_BACK = { '1m': 1, '3m': 3, '6m': 6, ytd: 0 };

const SERIES_FILTERS = ['BOTH', 'INCOME', 'SPENDING'];
const SERIES_FILTER_LABELS = {
  BOTH: 'All',
  INCOME: 'Income',
  SPENDING: 'Spending',
};

const parseMonthKey = (v) => {
  const [year, month] = v.split('-');
  return new Date(year, month - 1);
};

function NetTooltipValue({ value, currency }) {
  const isPositive = Number(value) >= 0;
  return (
    <span
      className={
        isPositive
          ? 'text-[var(--color-income-chart)]'
          : 'text-[var(--color-spending-chart)]'
      }
    >
      {isPositive ? '+' : ''}
      {formatMoney(Number(value), currency)}
    </span>
  );
}

export function ChartAreaInteractive() {
  const { transactions = [], accounts = [], currencies = [] } = useData();

  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('6m');
  const [accountId, setAccountId] = React.useState('ALL');
  const [seriesFilter, setSeriesFilter] = React.useState('BOTH');

  React.useEffect(() => {
    if (isMobile) setTimeRange('3m');
  }, [isMobile]);

  const selectedAccount = React.useMemo(
    () => accounts.find((a) => String(a.id_account) === accountId),
    [accounts, accountId]
  );
  const currency = selectedAccount?.currency_code || 'PLN';

  const chartData = React.useMemo(() => {
    const accountRate = selectedAccount
      ? currencies.find(
          (c) => c.id_currency === selectedAccount.Currency_id_currency
        )?.exchange_rate
      : 1;

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (MONTHS_BACK[timeRange] ?? 6));
    if (timeRange === 'ytd') {
      startDate.setMonth(0);
    }
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const grouped = {};
    transactions?.forEach((tx) => {
      if (accountId !== 'ALL' && String(tx.Account_id_account) !== accountId)
        return;

      const txDate = new Date(tx.date);
      if (txDate < startDate || txDate > endDate) return;

      const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthStr])
        grouped[monthStr] = { date: monthStr, spending: 0, income: 0 };

      const amount = parseFloat(tx.amount) || 0;
      const txRate = parseFloat(tx.exchange_rate) || 1;

      const rate = txRate / (parseFloat(accountRate) || 1);
      const isIncome = tx.type === 'INCOME';

      if (isIncome) grouped[monthStr].income += amount * rate;
      else grouped[monthStr].spending += amount * rate;
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
  }, [transactions, timeRange, accountId, selectedAccount, currencies]);

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

  const stats = [
    {
      key: 'income',
      label: 'Income',
      value: totals.income,
      color: 'var(--color-income-chart)',
    },
    {
      key: 'spending',
      label: 'Spending',
      value: totals.spending,
      color: 'var(--color-spending-chart)',
    },
    {
      key: 'net',
      label: 'Net',
      value: totals.net,
      color:
        totals.net >= 0
          ? 'var(--color-income-chart)'
          : 'var(--color-spending-chart)',
      signed: true,
    },
  ];

  const seriesConfig = [
    {
      key: 'net',
      color: 'var(--color-net-chart)',
      stopOpacity: [0.15, 0.02],
      dashed: true,
      visible: showNet,
    },
    {
      key: 'income',
      color: 'var(--color-income-chart)',
      stopOpacity: [0.2, 0.02],
      visible: showIncome,
    },
    {
      key: 'spending',
      color: 'var(--color-spending-chart)',
      stopOpacity: [0.25, 0.03],
      visible: showSpending,
    },
  ];

  return (
    <Card className="@container/card border-border/50">
      <CardHeader className="grid-cols-1 has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle>Spending Overview</CardTitle>
        <CardAction className="col-start-1 row-start-3 row-span-1 self-stretch justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-start sm:justify-self-end flex flex-col sm:flex-row gap-2 pt-2 w-full sm:w-auto">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row">
            <div>
              <Label htmlFor="account-select" className="sr-only">
                Account:
              </Label>
              <Select
                value={accountId}
                onValueChange={(val) => setAccountId(val)}
              >
                <SelectTrigger
                  className="w-full sm:w-36 h-8 text-xs"
                  id="account-select"
                >
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
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1 w-full sm:w-auto bg-muted/30 p-0.5 rounded-lg border border-border/50">
            {SERIES_FILTERS.map((filter) => (
              <Button
                key={filter}
                variant={seriesFilter === filter ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-[11px] sm:text-xs flex-1 sm:flex-initial sm:w-[72px] data-[active=true]:bg-accent shadow-none"
                data-active={seriesFilter === filter}
                onClick={() => setSeriesFilter(filter)}
              >
                {SERIES_FILTER_LABELS[filter]}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent
        className="px-2 pt-4 sm:px-6 sm:pt-6"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((s) => (
            <div
              key={s.key}
              className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2 rounded-lg border border-border/50 bg-accent/30 px-2 py-2 sm:px-3 sm:py-2.5 text-center sm:text-left"
            >
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
              <span
                className="text-xs sm:text-sm font-bold tabular-nums truncate w-full"
                style={{ color: s.color }}
              >
                {s.signed && s.value >= 0 ? '+' : ''}
                {formatMoney(s.value, currency)}
              </span>
            </div>
          ))}
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
              {seriesConfig.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`fill-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={s.color}
                    stopOpacity={s.stopOpacity[0]}
                  />
                  <stop
                    offset="95%"
                    stopColor={s.color}
                    stopOpacity={s.stopOpacity[1]}
                  />
                </linearGradient>
              ))}
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
              tickFormatter={(v) =>
                parseMonthKey(v).toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit',
                })
              }
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
                  labelFormatter={(value) =>
                    parseMonthKey(value).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  }
                  formatter={(val, name) => {
                    if (name === 'net') {
                      return [
                        <NetTooltipValue
                          key={name}
                          value={val}
                          currency={currency}
                        />,
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
              <ReferenceLine
                y={0}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            {seriesConfig.map(
              (s) =>
                s.visible && (
                  <Area
                    key={s.key}
                    dataKey={s.key}
                    type="monotone"
                    fill={`url(#fill-${s.key})`}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dashed ? '4 4' : undefined}
                    animationDuration={600}
                    activeDot={{
                      r: 4,
                      style: { fill: s.color, strokeWidth: 0 },
                    }}
                  />
                )
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
