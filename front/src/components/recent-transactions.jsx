import { useState, useEffect } from "react";

import {
  IconShoppingCart,
  IconCar,
  IconCoffee,
  IconBuildingStore,
  IconDeviceGamepad2,
  IconPlug,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
/*
const transactions = [
  {
    id: 1,
    name: "Amazon",
    category: "Shopping",
    amount: -89.99,
    date: "Today",
    icon: IconShoppingCart,
    color: "var(--chart-1)",
  },
  {
    id: 2,
    name: "Salary Deposit",
    category: "Income",
    amount: 7250.0,
    date: "Yesterday",
    icon: IconArrowUp,
    color: "var(--primary)",
  },
  {
    id: 3,
    name: "Uber",
    category: "Transport",
    amount: -24.5,
    date: "Yesterday",
    icon: IconCar,
    color: "var(--chart-2)",
  },
  {
    id: 4,
    name: "Starbucks",
    category: "Food & Dining",
    amount: -6.75,
    date: "May 23",
    icon: IconCoffee,
    color: "var(--chart-4)",
  },
  {
    id: 5,
    name: "Whole Foods",
    category: "Groceries",
    amount: -156.32,
    date: "May 22",
    icon: IconBuildingStore,
    color: "var(--chart-3)",
  },
  {
    id: 6,
    name: "Steam",
    category: "Entertainment",
    amount: -59.99,
    date: "May 21",
    icon: IconDeviceGamepad2,
    color: "var(--chart-5)",
  },
  {
    id: 7,
    name: "Electric Bill",
    category: "Utilities",
    amount: -142.0,
    date: "May 20",
    icon: IconPlug,
    color: "var(--muted-foreground)",
  },
  {
    id: 8,
    name: "Freelance Payment",
    category: "Income",
    amount: 850.0,
    date: "May 19",
    icon: IconArrowUp,
    color: "var(--primary)",
  },
];
*/
export function RecentTransactions() {
  const [dbTransactions, setDbTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/transactions/", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDbTransactions(data);
        } else {
          console.error("Failed to fetch transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getIconForType = (type) => {
    if (type === "expense") return IconShoppingCart;
    if (type === "income") return IconArrowUp;
    return IconShoppingCart;
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Ładowanie transakcji...</div>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          <div className="space-y-1 px-6 pb-6">
            {dbTransactions.length === 0 ? (
               <div className="text-center py-4 text-sm text-muted-foreground">Brak transakcji do wyświetlenia.</div>
            ) : (
                dbTransactions.map((transaction) => {
                  const Icon = getIconForType(transaction.type);
                  const isIncome = transaction.type === "income";
                  const displayName = transaction.description || "Transakcja bez nazwy";
                  const displayDate = new Date(transaction.date).toLocaleDateString();

                  return (
                    <div
                      key={transaction.id_transaction}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                    >
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in oklch, var(--primary) 15%, transparent)`,
                        }}
                      >
                        <Icon
                          className="size-5"
                          style={{ color: isIncome ? "var(--primary)" : "var(--destructive)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Konto: {transaction.Account_id_account}</span>
                          <span>•</span>
                          <span>{displayDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums ${
                            isIncome ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {isIncome ? "+" : "-"}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                        {isIncome ? (
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary text-xs"
                          >
                            <IconArrowDown className="size-3 rotate-180" />
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-destructive/30 text-destructive text-xs"
                          >
                            <IconArrowUp className="size-3 rotate-180" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}