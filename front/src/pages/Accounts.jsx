import { useState } from 'react';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconRefresh,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/formatMoney';
import { SelectBankDialog } from '@/components/SelectBankDialog';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { RenameAccountDialog } from '@/components/RenameAccountDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

import { useApi } from '@/hooks/useApi';

export default function Accounts() {
  const { accounts, loading, currencies, setRefreshing } = useData();

  const { post, patch, del } = useApi();

  const { loading: savingName, run: runRename } = useAsyncAction();
  const { loading: deleting, run: runDelete } = useAsyncAction();

  const [connecting, setConnecting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);

  const [renamingAccount, setRenamingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [selectBankOpen, setSelectBankOpen] = useState(false);

  const handleSelectBank = async (bank) => {
    setSelectBankOpen(false);
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/bank-callback`;
      const data = await post('/api/banking/auth-url', {
        redirect_uri: redirectUri,
        bank_name: bank.name,
        country: bank.country || 'PL',
      });
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error starting bank connection:', error);
      toast.error('Connection failed', { description: error.message });
      setConnecting(false);
    }
  };

  const handleSyncAccount = async (accountId) => {
    setSyncingAccountId(accountId);
    try {
      const data = await post('/api/banking/sync', { account_id: accountId });
      toast.success('Sync successful', {
        description: `Imported: ${data.imported}, Skipped: ${data.skipped}.`,
      });
      setRefreshing((prev) => prev + 1);
    } catch (error) {
      console.error('Error syncing bank transactions:', error);
      toast.error('Sync failed', { description: error.message });
    } finally {
      setSyncingAccountId(null);
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
            onClick={() => setSelectBankOpen(true)}
            disabled={connecting}
            className="flex items-center gap-2"
          >
            {connecting ? 'Connecting...' : 'Connect bank'}
          </Button>
          <AddAccountDialog
            onAccountAdded={() => setRefreshing((prev) => prev + 1)}
            currencies={currencies}
          />
        </div>
      </div>

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
            const compactNumber = formatMoney(
              account.current_balance,
              account.currency_code,
              true
            );
            const isSyncing = syncingAccountId === account.id_account;

            return (
              <div
                key={account.id_account}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-2 duration-200 hover:shadow-md"
              >
                <div className="flex justify-between items-center gap-2">
                  <span
                    className="font-semibold text-lg text-foreground truncate"
                    title={account.name}
                  >
                    {account.name}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSyncing && (
                      <IconRefresh className="size-4 animate-spin text-muted-foreground" />
                    )}

                    {account.bank_account_uid && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Connected
                      </span>
                    )}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {account.currency_code}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {account.bank_account_uid && (
                          <DropdownMenuItem
                            disabled={isSyncing}
                            onClick={() =>
                              handleSyncAccount(account.id_account)
                            }
                          >
                            <IconRefresh
                              className={`size-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
                            />
                            {isSyncing ? 'Syncing...' : 'Sync now'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setRenamingAccount(account)}
                        >
                          <IconPencil className="size-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingAccount(account)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      <RenameAccountDialog
        account={renamingAccount}
        onClose={() => setRenamingAccount(null)}
        isSaving={savingName}
        onSave={(name) =>
          runRename(async () => {
            await patch(`/accounts/${renamingAccount.id_account}`, { name });
            setRenamingAccount(null);
            setRefreshing((prev) => prev + 1);
          })
        }
      />

      <ConfirmDeleteDialog
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        isDeleting={deleting}
        title={`Delete "${deletingAccount?.name}"?`}
        description="This will permanently delete this account and all of its transactions. This cannot be undone."
        onConfirm={() =>
          runDelete(async () => {
            await del(`/accounts/${deletingAccount.id_account}`);
            setDeletingAccount(null);
            setRefreshing((prev) => prev + 1);
          })
        }
      />

      <SelectBankDialog
        open={selectBankOpen}
        onOpenChange={setSelectBankOpen}
        onSelectBank={handleSelectBank}
      />
    </div>
  );
}
