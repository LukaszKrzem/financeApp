import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AddAccountDialog } from "@/components/AddAccountDialog";

export default function Accounts({ user, onLogout, token }) {
    const [accounts, setAccounts] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!token) return;
            try {
                const response = await fetch("http://localhost:8000/accounts/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAccounts(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Error fetching accounts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [token, refreshTrigger]);

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            }}
        >
            <AppSidebar variant="inset" onLogout={onLogout} user={user} />
            <SidebarInset>
                <SiteHeader user={user} token={token} setRefreshing={setRefreshTrigger} />

                <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">Your Financial Accounts</h2>
                            <p className="text-sm text-muted-foreground">Monitor and manage your available wallets and balances</p>
                        </div>
                        <AddAccountDialog token={token} onAccountAdded={() => setRefreshTrigger(p => p + 1)} />
                    </div>

                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Loading accounts...</p>
                    ) : (accounts || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                            You haven't created any financial accounts yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {accounts.map((account) => {
                                if (!account) return null;

                                const balance = Number(account.current_balance) || 0;
                                const currencyCode = account.currency_code || "$";

                                return (
                                    <div key={account.id_account} className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-2 duration-200 hover:shadow-md">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-lg text-foreground">
                                                {account.name}
                                            </span>
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                {currencyCode}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-sm text-muted-foreground block">Current Balance</span>
                                            <span className="text-3xl font-bold tracking-tight text-primary">
                                                {currencyCode} {balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}