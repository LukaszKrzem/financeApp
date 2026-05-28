import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  IconShoppingCart,
  IconCar,
  IconHome,
  IconToolsKitchen2,
  IconMovie,
  IconHeartbeat,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const categories = [
  {
    name: "Shopping",
    value: 1250,
    color: "var(--chart-1)",
    icon: IconShoppingCart,
  },
  { name: "Transport", value: 480, color: "var(--chart-2)", icon: IconCar },
  { name: "Housing", value: 1800, color: "var(--chart-3)", icon: IconHome },
  {
    name: "Food & Dining",
    value: 720,
    color: "var(--chart-4)",
    icon: IconToolsKitchen2,
  },
  {
    name: "Entertainment",
    value: 340,
    color: "var(--chart-5)",
    icon: IconMovie,
  },
  {
    name: "Healthcare",
    value: 302,
    color: "var(--primary)",
    icon: IconHeartbeat,
  },
];

const total = categories.reduce((acc, cat) => acc + cat.value, 0);

export function SpendingCategories() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>This month&apos;s breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="mx-auto h-[180px] w-[180px] lg:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {categories.map((category) => {
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
                    ${category.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
