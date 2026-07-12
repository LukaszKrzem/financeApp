import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus } from '@tabler/icons-react';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export function AddAccountDialog() {
  const { token, apiUrl, onLogout } = useAuth();
  const { currencies = [], setRefreshing } = useData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !balance || !currencyId) return;

    try {
      await apiFetch(
        `${apiUrl}/accounts/`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: name,
            current_balance: parseFloat(balance),
            Currency_id_currency: parseInt(currencyId),
          }),
        },
        onLogout
      );

      setName('');
      setBalance('');
      setCurrencyId('');
      setOpen(false);
      setRefreshing((prev) => prev + 1);
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconPlus className="size-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>
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
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-balance">Initial Balance</Label>
            <Input
              id="account-balance"
              type="number"
              step="0.01"
              min="0.00"
              placeholder="e.g. 100.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-currency">Currency</Label>
            <Select value={currencyId} onValueChange={setCurrencyId} required>
              <SelectTrigger className="w-full" id="account-currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem
                    key={currency.id_currency}
                    value={currency.id_currency.toString()}
                  >
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full mt-2">
            Confirm Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
