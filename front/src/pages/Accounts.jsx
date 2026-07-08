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

export default function Accounts({
  token,
  accounts,
  setRefreshing,
  loading,
  currencies,
  apiUrl,
}) {
  const [connecting, setConnecting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [renamingAccount, setRenamingAccount] = useState(null);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConnectBank = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/bank-callback`;
      const response = await fetch(`${apiUrl}/api/banking/auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          redirect_uri: redirectUri, // TODO: Let user choose bank from a list
          bank_name: 'Bank Millennium',
          country: 'PL',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : data.detail || 'Could not start bank connection';
        throw new Error(message);
      }

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
      const response = await fetch(`${apiUrl}/api/banking/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_id: accountId }),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : data.detail || 'Sync failed';
        throw new Error(message);
      }

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
      const response = await fetch(
        `${apiUrl}/accounts/${deletingAccount.id_account}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : data.detail || 'Delete failed';
        throw new Error(message);
      }

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
      const response = await fetch(
        `${apiUrl}/accounts/${renamingAccount.id_account}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newName.trim() }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : data.detail || 'Rename failed';
        throw new Error(message);
      }

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
            onClick={handleConnectBank}
            disabled={connecting}
            className="flex items-center gap-2"
          >
            {connecting ? 'Connecting...' : 'Connect bank'}
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
          <Input
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
        <DialogContent className="sm:max-w-[400px]">
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
    </div>
  );
}
