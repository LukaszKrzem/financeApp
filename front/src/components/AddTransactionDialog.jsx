import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

export function AddTransactionDialog({
  token,
  setRefreshing,
  accounts = [],
  categories = [],
  currencies = [],
  apiUrl,
  trigger,
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [transactionFrequency, setTransactionFrequency] =
    useState('not_scheduled');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  const filteredCategories = categories.filter((cat) => cat.type === type);
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id_account.toString());
    }
    const selectedAccount = accounts.find(
      (acc) => acc.id_account.toString() === accountId
    );
    if (selectedAccount) {
      setCurrencyId(selectedAccount.Currency_id_currency.toString());
    }
  }, [accountId, accounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      amount: parseFloat(amount),
      type: type,
      description: description,
      Account_id_account: parseInt(accountId),
      Category_id_category: categoryId ? parseInt(categoryId) : null,
      Currency_id_currency: parseInt(currencyId),
    };

    const isScheduled = transactionFrequency !== 'not_scheduled';
    const endpoint = isScheduled
      ? '/scheduled-transactions/'
      : '/transactions/';

    if (isScheduled) {
      payload.frequency = transactionFrequency;
      payload.next_date = new Date('2317-10-10').toISOString();
    }

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error adding transaction');
      }

      setAmount('');
      setDescription('');
      setOpen(false);
      setRefreshing((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TransactionForm = (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger>
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EXPENSE">Expense</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Input
          placeholder="Amount"
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1"
          required
        />
        <Select value={currencyId} onValueChange={setCurrencyId} required>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((cur) => (
              <SelectItem
                key={cur.id_currency}
                value={cur.id_currency.toString()}
              >
                {cur.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <div className="grid gap-2">
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem
                key={cat.id_category}
                value={cat.id_category.toString()}
              >
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between gap-2">
        <Select value={accountId} onValueChange={setAccountId} required>
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem
                key={acc.id_account}
                value={acc.id_account.toString()}
              >
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={transactionFrequency}
          onValueChange={setTransactionFrequency}
          required
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_scheduled">Not scheduled</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Save
      </Button>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button>+ Add Transaction</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          {TransactionForm}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || <Button>+ Add Transaction</Button>}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Add New Transaction</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">{TransactionForm}</div>
      </DrawerContent>
    </Drawer>
  );
}
