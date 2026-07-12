import { useState } from 'react';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  IconRefresh,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatTransactionAmount } from '@/lib/formatMoney';
import { Input } from '@/components/ui/input';
import { SelectBankDialog } from '@/components/SelectBankDialog';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';

export default function Accounts({
  accounts,
  setRefreshing,
  loading,
  currencies,
}) {
  const { token, apiUrl, onLogout } = useAuth();

  const [connecting, setConnecting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [renamingAccount, setRenamingAccount] = useState(null);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectBankOpen, setSelectBankOpen] = useState(false);

  const handleSelectBank = async (bank) => {
    setSelectBankOpen(false);
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/bank-callback`;
      const data = await apiFetch(
        `${apiUrl}/api/banking/auth-url`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            redirect_uri: redirectUri,
            bank_name: bank.name,
            country: bank.country || 'PL',
          }),
        },
        onLogout
      );
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
      const data = await apiFetch(
        `${apiUrl}/api/banking/sync`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ account_id: accountId }),
        },
        onLogout
      );
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

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setDeleting(true);
    try {
      await apiFetch(
        `${apiUrl}/accounts/${deletingAccount.id_account}`,
        token,
        { method: 'DELETE' },
        onLogout
      );
      toast.success('Account deleted');
      setDeletingAccount(null);
      setRefreshing((prev) => prev + 1);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Delete failed', { description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  const openRenameDialog = (account) => {
    setRenamingAccount(account);
    setNewName(account.name);
  };

  const handleSaveName = async () => {
    if (!renamingAccount || !newName.trim()) return;
    setSavingName(true);
    try {
      await apiFetch(
        `${apiUrl}/accounts/${renamingAccount.id_account}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: newName.trim() }),
        },
        onLogout
      );
      toast.success('Account renamed');
      setRenamingAccount(null);
      setRefreshing((prev) => prev + 1);
    } catch (error) {
      console.error('Error renaming account:', error);
      toast.error('Rename failed', { description: error.message });
    } finally {
      setSavingName(false);
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
            onAccountAdded={() => {
              setRefreshing((prev) => prev + 1);
            }}
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
            const compactNumber = formatTransactionAmount(
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
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-foreground">
                    {account.name}
                  </span>
                  <div className="flex items-center gap-1">
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
                          <span className="sr-only">Account options</span>
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
                          onClick={() => openRenameDialog(account)}
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

      <Dialog
        open={!!renamingAccount}
        onOpenChange={(open) => !open && setRenamingAccount(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename account</DialogTitle>
            <DialogDescription>
              Choose a new name for this account.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="account-rename">New account name</Label>
          <Input
            id="account-rename"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            autoFocus
          />
          <Button
            onClick={handleSaveName}
            disabled={savingName || !newName.trim()}
            className="w-full mt-2"
          >
            {savingName ? 'Saving...' : 'Save'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingAccount}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
      >
        <DialogContent
          className="sm:max-w-[400px]"
          onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
        >
          <DialogHeader>
            <DialogTitle>Delete "{deletingAccount?.name}"?</DialogTitle>
            <DialogDescription>
              This will permanently delete this account and{' '}
              <strong>all of its transactions</strong>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingAccount(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SelectBankDialog
        open={selectBankOpen}
        onOpenChange={setSelectBankOpen}
        onSelectBank={handleSelectBank}
      />
    </div>
  );
}
