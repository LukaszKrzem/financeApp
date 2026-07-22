import { useState } from 'react';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { AccountCard } from '@/components/AccountCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SelectBankDialog } from '@/components/SelectBankDialog';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { RenameAccountDialog } from '@/components/RenameAccountDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { IconWallet } from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';

import { useApi } from '@/hooks/useApi';

export default function Accounts() {
  const { accounts, loading, refreshData } = useData();

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
    } finally {
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
      refreshData();
    } catch (error) {
      console.error('Error syncing bank transactions:', error);
      toast.error('Sync failed', { description: error.message });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleRename = () => {
    if (!renamingAccount) return;
    runRename(async () => {
      await patch(`/accounts/${renamingAccount.id_account}`, {
        name: renamingAccount.name,
      });
      setRenamingAccount(null);
      refreshData();
    });
  };

  const handleDelete = () => {
    if (!deletingAccount) return;
    runDelete(async () => {
      await del(`/accounts/${deletingAccount.id_account}`);
      setDeletingAccount(null);
      refreshData();
    });
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Your Financial Accounts
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor and manage your available wallets and balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectBankOpen(true)}
            disabled={connecting}
            className="flex items-center gap-2"
          >
            {connecting ? 'Connecting...' : 'Connect bank'}
          </Button>
          <AddAccountDialog />
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (accounts || []).length === 0 ? (
        <EmptyState
          icon={IconWallet}
          title="No accounts yet"
          description="Add your first account to start tracking your balances and transactions."
          action={<AddAccountDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id_account}
              account={account}
              isSyncing={syncingAccountId === account.id_account}
              onRename={(acc) => setRenamingAccount(acc)}
              onDelete={(acc) => setDeletingAccount(acc)}
              onSync={handleSyncAccount}
            />
          ))}
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
            refreshData();
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
            refreshData();
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
