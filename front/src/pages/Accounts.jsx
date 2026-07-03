import { useState } from 'react';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatTransactionAmount } from '@/lib/formatMoney';

export default function Accounts({
  token,
  accounts,
  setRefreshing,
  loading,
  currencies,
  apiUrl,
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const handleBankSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${apiUrl}/api/banking/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Sync failed');
      }
      toast.success('Sync successful', {
        description: `Imported: ${data.imported}, Skipped: ${data.skipped}.`,
      });
      setRefreshing((prev) => prev + 1);
    } catch (error) {
      console.error('Error syncing bank transactions:', error);
      setSyncError(error.message);
      toast.error('Sync failed', { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Financial Accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your available wallets and balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleBankSync}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <IconRefresh
              className={`size-4 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing...' : 'Sync with bank'}
          </Button>
          <AddAccountDialog
            token={token}
            onAccountAdded={() => {
              setRefreshing((prev) => prev + 1);
            }}
            currencies={currencies}
            apiUrl={apiUrl}
          />
        </div>
      </div>

      {syncError && <p className="text-sm text-destructive">{syncError}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading accounts...
        </p>
      ) : (accounts || []).length === 0 ? (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
          You haven't created any financial accounts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            if (!account) return null;
            const compactNumber = formatTransactionAmount(
              account.current_balance,
              account.currency_code,
              true
            );

            return (
              <div
                key={account.id_account}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-2 duration-200 hover:shadow-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-foreground">
                    {account.name}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {account.currency_code}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground block">
                    Current Balance
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-primary">
                    {compactNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
