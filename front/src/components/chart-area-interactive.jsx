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
const chartData = [
  { date: "2026-01-01", spending: 3200, income: 6800 },
  { date: "2026-01-15", spending: 2100, income: 0 },
  { date: "2026-02-01", spending: 2850, income: 6900 },
  { date: "2026-02-15", spending: 1950, income: 0 },
  { date: "2026-03-01", spending: 4100, income: 7100 },
  { date: "2026-03-15", spending: 2300, income: 0 },
  { date: "2026-04-01", spending: 4520, income: 6440 },
  { date: "2026-04-15", spending: 2800, income: 0 },
  { date: "2026-05-01", spending: 3200, income: 7250 },
  { date: "2026-05-15", spending: 1692, income: 0 },
];

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

export function ChartAreaInteractive({ transactions }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("5m");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("3m");
    }
  }, [isMobile]);
  const processedData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const grouped = {};
    transactions.forEach((transaction) => {
      const rawDate = transaction.date;
      if (!rawDate) return;
      const dateObj = new Date(rawDate);
      const dateStr = dateObj.toISOString().split("T")[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, spending: 0, income: 0 };
      }
      if (transaction.is_income) {
        grouped[dateStr].income += transaction.amount;
      } else {
        grouped[dateStr].spending += transaction.amount;
      }
    });
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [transactions]);

  const filteredData = processedData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2026-05-25");
    let monthsToSubtract = 5;
    if (timeRange === "3m") {
      monthsToSubtract = 3;
    } else if (timeRange === "1m") {
      monthsToSubtract = 1;
    }
    const startDate = new Date(referenceDate);
    startDate.setMonth(startDate.getMonth() - monthsToSubtract);
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
                  month: "short",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={45}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{name}</span>
                      <span className="font-medium">
                        ${Number(value).toLocaleString()}
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
