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

  const getIconForCategory = (categoryName) => {
    const name = (categoryName || "").toLowerCase();

    if (name.includes("transport")) return IconCar;
    if (name.includes("food")) return IconCoffee;
    if (name.includes("shopping")) return IconShoppingCart;
    if (name.includes("entertainment")) return IconDeviceGamepad2;
    if (name.includes("utilities")) return IconPlug;
    if (name.includes("salary")) return IconArrowUp;

    return IconBuildingStore;
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
                  const typeLower = transaction.type.toLowerCase();
                  const isIncome = typeLower === "income";
                  const parsedAmount = parseFloat(transaction.amount);

                  const catName = transaction.category_name || "Inne";
                  const Icon = getIconForCategory(catName, typeLower);

                  const displayName = transaction.description || catName;
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
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{catName}</span>
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
                          {Math.abs(parsedAmount).toFixed(2)}
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