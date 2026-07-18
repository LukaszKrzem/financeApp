import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { CurrencySelect } from './ui/currency-select';

export function AddTransactionDialog({ trigger }) {
  const { post } = useApi();
  const {
    accounts = [],
    categories = [],
    currencies = [],
    refreshData,
  } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [transactionFrequency, setTransactionFrequency] =
    useState('not_scheduled');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    run(async () => {
      if (!categoryId) throw new Error('Please select a category');

      const payload = {
        amount: parseFloat(amount),
        type,
        description,
        Account_id_account: parseInt(accountId),
        Category_id_category: parseInt(categoryId),
        Currency_id_currency: parseInt(currencyId),
      };

      const isScheduled = transactionFrequency !== 'not_scheduled';
      const endpoint = isScheduled
        ? '/scheduled-transactions/'
        : '/transactions/';

      if (isScheduled) {
        payload.frequency = transactionFrequency;
      }

      await post(endpoint, payload);

      setAmount('');
      setDescription('');
      setOpen(false);
      refreshData();
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Add New Transaction"
      trigger={trigger || <Button>+ Add Transaction</Button>}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="transaction-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="e.g. 100.00"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2 w-[100px]">
            <Label htmlFor="currency">Currency</Label>
            <CurrencySelect
              id="budget-currency"
              value={currencyId}
              onChange={setCurrencyId}
              currencies={currencies}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            placeholder="e.g. Grocery shopping"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            disabled={isSubmitting}
          >
            <SelectTrigger id="category">
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

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="account">Account</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              required
              disabled={isSubmitting}
            >
              <SelectTrigger id="account">
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
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={transactionFrequency}
              onValueChange={setTransactionFrequency}
              disabled={isSubmitting}
            >
              <SelectTrigger id="frequency">
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
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
