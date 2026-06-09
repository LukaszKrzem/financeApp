import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMemo } from "react";

const chartConfig = {
  spending: {
    label: "Spending",
    color: "var(--chart-4)",
  },
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
};
const formatCompactMoney = (value) => {
  if (value <= 1) return "0 PLN";

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};
export function ChartAreaInteractive({ transactions }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("5m");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("3m");
    }
  }, [isMobile]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const chartData = React.useMemo(() => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    let monthsToSubtract = 5;
    if (timeRange === "3m") monthsToSubtract = 3;
    if (timeRange === "1m") monthsToSubtract = 1;
    startDate.setMonth(startDate.getMonth() - monthsToSubtract);
    startDate.setHours(0, 0, 0, 0);

    const grouped = {};
    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        const rawDate = tx.transaction_date || tx.date;
        if (!rawDate) return;

        const txDate = new Date(rawDate);
        if (txDate >= startDate && txDate <= endDate) {
          const dateStr = getLocalDateString(txDate);

          if (!grouped[dateStr]) {
            //grouped[dateStr] = { date: dateStr, spending: 0, income: 0 };
            grouped[dateStr] = { date: dateStr, spending: 1, income: 1 };
          }

          const amount = parseFloat(tx.amount) || 0;
          const exchangeRate = parseFloat(tx.exchange_rate) || 1;

          if (
            tx.type === "INCOME" ||
            tx.is_income === "T" ||
            tx.is_income === "Y"
          ) {
            grouped[dateStr].income += amount * exchangeRate;
          } else {
            grouped[dateStr].spending += amount * exchangeRate;
          }
        }
      });
    }

    const filledData = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = getLocalDateString(currentDate);
      if (grouped[dateStr]) {
        filledData.push(grouped[dateStr]);
      } else {
        filledData.push({ date: dateStr, spending: 1, income: 1 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledData;
  }, [transactions]);

  const startDate = new Date();
  let monthsToSubtract = 5;
  if (timeRange === "3m") monthsToSubtract = 3;
  if (timeRange === "1m") monthsToSubtract = 1;
  startDate.setMonth(startDate.getMonth() - monthsToSubtract);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    return date >= startDate;
  });

  return (
    <Card className="@container/card border-border/50">
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Comparing income vs spending over time
          </span>
          <span className="@[540px]/card:hidden">Income vs Spending</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="5m">5 months</ToggleGroupItem>
            <ToggleGroupItem value="3m">3 months</ToggleGroupItem>
            <ToggleGroupItem value="1m">1 month</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="5 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="5m" className="rounded-lg">
                5 months
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                3 months
              </SelectItem>
              <SelectItem value="1m" className="rounded-lg">
                1 month
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
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
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <YAxis
              scale="log"
              domain={[1, "auto"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCompactMoney(value)}
              width={85}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{name}</span>
                      <span className="font-medium">
                        {value <= 1 ? 0 : Number(value).toLocaleString("pl-PL")}{" "}
                        zł
                      </span>
                    </div>
                  )}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="income"
              type="monotone"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              strokeWidth={2}
            />
            <Area
              dataKey="spending"
              type="monotone"
              fill="url(#fillSpending)"
              stroke="var(--color-spending)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
