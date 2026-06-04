import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SimpleDataTable } from "@/components/simple-data-table";

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
        <div className={`font-medium ${isExpense ? "text-red-500" : "text-emerald-500"}`}>
          {isExpense ? "-" : "+"}{formatted}
        </div>
      );
    },
  },
];

export default function Transactions({ user, token, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/transactions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token, refreshing]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" onLogout={onLogout} user={user} />
      <SidebarInset>
        <SiteHeader user={user} token={token} setRefreshing={setRefreshing} />
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transaction history</h1>
            <p className="text-muted-foreground">
              Review all your expenses and income.
            </p>
          </div>

          <div className="bg-card border-border/50 border rounded-xl p-4">
            {loading ? (
              <div className="text-center py-10">Loading transactions...</div>
            ) : (
              <SimpleDataTable columns={columns} data={transactions} />
            )}
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}