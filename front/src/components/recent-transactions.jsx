import { useState, useEffect } from "react";

import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { getIconForCategory, DEFAULT_ICON } from "@/lib/categoryIcons";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatTransactionAmount = (amount, currencyCode) => {
  const value = new Intl.NumberFormat("pl-PL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(parseFloat(amount)).toFixed(2));
  const code = (currencyCode || "PLN").toUpperCase();
  switch (code) {
    case "USD":
      return `$${value}`;
    case "EUR":
      return `${value} €`;
    case "GBP":
      return `£${value}`;
    case "PLN":
      return `${value} zł`;
    default:
      return `${value} ${code}`;
  }
};
export function RecentTransactions({ transactions, loading }) {
  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading transactions...
      </div>
    );
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
            {transactions.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No transactions to display.
              </div>
            ) : (
              transactions.map((transaction) => {
                const typeLower = transaction.type.toLowerCase();
                const isIncome = typeLower === "income";
                const catName = transaction.category_name || "Other";
                const Icon = getIconForCategory(catName, typeLower);
                const displayName = transaction.description || catName;
                const displayDate = new Date(
                  transaction.date,
                ).toLocaleDateString();

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
                      <Icon className="size-5" />
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
                        {isIncome ? "+" : "-"}
                        {formatTransactionAmount(
                          transaction.amount,
                          transaction.currency_code,
                        )}
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
