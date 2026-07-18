import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { getIconForCategory } from '@/lib/categoryIcons';
import {
  categoryColorMapLight,
  categoryColorMapDark,
  DEFAULT_CATEGORY_COLOR,
} from '@/lib/categories';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/components/theme-provider';
import { isExpense } from '@/lib/transactionHelpers';
import { formatMoney } from '@/lib/formatMoney';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { IconChartPie } from '@tabler/icons-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

function SpendingCategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <Skeleton className="mx-auto size-[180px] rounded-full lg:mx-0 shrink-0" />
      <div className="flex-1 space-y-3 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpendingCategories() {
  const { transactions = [], loading } = useData();
  const { theme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === 'dark';

  const categoryData = useMemo(() => {
    const colorMap = isDark ? categoryColorMapDark : categoryColorMapLight;
    const categories = transactions
      .filter(isExpense)
      .reduce((summary, transaction) => {
        const categoryName = transaction.category_name || 'Other';
        const exchangeRate = parseFloat(transaction.exchange_rate) || 1;

        const amount = Math.abs(Number(transaction.amount)) || 0;

        summary[categoryName] =
          (summary[categoryName] || 0) + amount * exchangeRate;
        return summary;
      }, {});

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        color: colorMap[name] ?? DEFAULT_CATEGORY_COLOR,
        icon: getIconForCategory(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, isDark]);

  const total = useMemo(
    () => categoryData.reduce((acc, cat) => acc + cat.value, 0),
    [categoryData]
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Where your money goes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SpendingCategoriesSkeleton />
        ) : categoryData.length === 0 ? (
          <EmptyState
            icon={IconChartPie}
            title="No expenses yet"
            description="Your spending breakdown will appear here once you add some transactions."
          />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="mx-auto h-[180px] w-[180px] lg:mx-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
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
                const percentage =
                  total > 0
                    ? ((category.value / total) * 100).toFixed(1)
                    : '0.0';
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
