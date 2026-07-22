import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPlus } from '@tabler/icons-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useApi } from '@/hooks/useApi';
import { CurrencySelect } from './ui/currency-select';

export function AddAccountDialog() {
  const { post } = useApi();
  const { currencies = [], refreshData } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currencyId, setCurrencyId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name || !balance || !currencyId) return;

    run(async () => {
      await post('/accounts/', {
        name: name,
        current_balance: parseFloat(balance),
        currency_id: parseInt(currencyId),
      });

      setName('');
      setBalance('');
      setCurrencyId('');
      setOpen(false);
      refreshData();
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Create New Account"
      trigger={
        <Button className="gap-2" size="sm">
          <IconPlus className="size-4" />
          Add Account
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-name">Account Name</Label>
          <Input
            id="account-name"
            type="text"
            placeholder="e.g. Main Wallet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-balance">Initial Balance</Label>
          <Input
            id="account-balance"
            type="number"
            step="0.01"
            min="0.00"
            inputMode="decimal"
            placeholder="e.g. 100.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-currency">Currency</Label>
          <CurrencySelect
            id="budget-currency"
            value={currencyId}
            onChange={setCurrencyId}
            currencies={currencies}
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Confirm Account'}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
