import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getIconForCategory, DEFAULT_ICON } from "@/lib/categoryIcons";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

const isExpenseTransaction = (transaction) =>
  transaction.type === "EXPENSE" ||
  transaction.is_income === "F" ||
  transaction.is_income === "N";

const formatMoney = (value) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border-border border rounded-lg p-3 shadow-lg z-50">
        <p className="text-sm font-medium text-foreground mb-1">
          {payload[0].name}
        </p>
        <p className="text-sm font-bold text-primary">
          {formatMoney(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpendingCategories({ transactions = [] }) {
  const categoryData = useMemo(() => {
    const categories = transactions
      .filter(isExpenseTransaction)
      .reduce((summary, transaction) => {
        const categoryName = transaction.category_name || "Other";
        const exchangeRate = parseFloat(transaction.exchange_rate) || 1;
        const amount = Number(transaction.amount) || 0;

        summary[categoryName] =
          (summary[categoryName] || 0) + amount * exchangeRate;
        return summary;
      }, {});

    return Object.entries(categories)
      .map(([name, value], index) => ({
        name,
        value,
        color: chartColors[index % chartColors.length],
        icon: getIconForCategory(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = useMemo(
    () => categoryData.reduce((acc, cat) => acc + cat.value, 0),
    [categoryData],
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>This month&apos;s breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No expenses to display yet.
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="mx-auto h-[180px] w-[180px] lg:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {categoryData.map((category) => {
                const Icon = category.icon;
                const percentage = ((category.value / total) * 100).toFixed(1);
                return (
                  <div key={category.name} className="flex items-center gap-3">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${category.color} 20%, transparent)`,
                      }}
                    >
                      <Icon
                        className="size-4"
                        style={{ color: category.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {category.name}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {percentage}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums w-16 text-right">
                      {formatMoney(category.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
