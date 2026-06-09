import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SimpleDataTable } from "@/components/simple-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const columns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString("pl-PL");
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "category_name",
    header: "Category",
  },
  {
    id: "amount",
    header: "Amount",
    accessorFn: (row) => {
      const val = parseFloat(row.amount);
      return row.type === "EXPENSE" ? -val : val;
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const isExpense = amount < 0;
      const formatted = new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
      }).format(Math.abs(amount));

      return (
        <div
          className={`font-medium ${isExpense ? "text-red-500" : "text-emerald-500"}`}
        >
          {isExpense ? "-" : "+"}
          {formatted}
        </div>
      );
    },
  },
];

export default function Transactions({ transactions, loading }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTransactions = transactions
    .filter((t) => typeFilter === "ALL" || t.type === typeFilter)
    .filter((t) => !dateFrom || new Date(t.date) >= new Date(dateFrom))
    .filter(
      (t) => !dateTo || new Date(t.date) <= new Date(dateTo + "T23:59:59"),
    );

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Transaction history
        </h1>
        <p className="text-muted-foreground">
          Review all your expenses and income.
        </p>
      </div>

      <div className="bg-card border-border/50 border rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {["ALL", "EXPENSE", "INCOME"].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === "ALL"
                ? "All"
                : type === "EXPENSE"
                  ? "Expenses"
                  : "Income"}
            </Button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-8 text-sm"
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-8 text-sm"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10">Loading transactions...</div>
        ) : (
          <SimpleDataTable columns={columns} data={filteredTransactions} />
        )}
      </div>
    </div>
  );
}
