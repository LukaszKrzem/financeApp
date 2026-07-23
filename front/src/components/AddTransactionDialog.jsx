import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
import { DatePicker } from '@/components/ui/date-picker';

export function AddTransactionDialog({
  trigger,
  transaction,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultFrequency = 'not_scheduled',
}) {
  const { post, put, patch } = useApi();
  const {
    accounts = [],
    categories = [],
    currencies = [],
    refreshData,
  } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const isEditing = !!transaction;
  const isEditingScheduled =
    isEditing && 'id_schedule_transaction' in transaction;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [transactionFrequency, setTransactionFrequency] =
    useState(defaultFrequency);
  const [date, setDate] = useState(new Date());

  const filteredCategories = categories.filter((cat) => cat.type === type);

  useEffect(() => {
    if (!open) return;

    if (isEditing) {
      setAmount(String(Math.abs(transaction.amount)));
      setType(transaction.type);
      setDescription(transaction.description || '');
      setAccountId(String(transaction.account_id || ''));
      setCategoryId(String(transaction.category_id || ''));
      setCurrencyId(String(transaction.currency_id || ''));
      setDate(transaction.date ? new Date(transaction.date) : new Date());

      if (transaction.frequency) {
        setTransactionFrequency(transaction.frequency);
      }
    } else {
      setAmount('');
      setType('EXPENSE');
      setDescription('');
      setCategoryId('');
      setTransactionFrequency(defaultFrequency);
      setDate(new Date());
      if (accounts.length > 0) {
        setAccountId(accounts[0].id_account.toString());
      }
    }
  }, [open, isEditing, transaction, accounts, defaultFrequency]);

  useEffect(() => {
    const categoryExists = filteredCategories.some(
      (cat) => cat.id_category.toString() === categoryId
    );
    if (!categoryExists && categoryId !== '') {
      setCategoryId('');
    }
  }, [type, filteredCategories, categoryId]);

  useEffect(() => {
    if (isEditing) return;
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id_account.toString());
    }
    const selectedAccount = accounts.find(
      (acc) => acc.id_account.toString() === accountId
    );
    if (selectedAccount) {
      setCurrencyId(selectedAccount.currency_id?.toString() || '');
    }
  }, [accountId, accounts, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    run(async () => {
      if (!categoryId) throw new Error('Please select a category');
      if (!date) throw new Error('Please select a date');

      const parsedAmount = parseFloat(String(amount).replace(',', '.'));

      const payload = {
        amount: parsedAmount,
        type,
        description,
        account_id: parseInt(accountId),
        category_id: parseInt(categoryId),
        currency_id: parseInt(currencyId),
        date: format(date, 'yyyy-MM-dd'),
      };

      if (isEditing) {
        const isScheduled = 'id_schedule_transaction' in transaction;
        if (isScheduled) {
          payload.frequency = transactionFrequency;
          await patch(
            `/scheduled-transactions/${transaction.id_schedule_transaction}`,
            payload
          );
        } else {
          await put(`/transactions/${transaction.id_transaction}`, payload);
        }
      } else {
        const isScheduled = transactionFrequency !== 'not_scheduled';
        const endpoint = isScheduled
          ? '/scheduled-transactions/'
          : '/transactions/';
        if (isScheduled) payload.frequency = transactionFrequency;

        await post(endpoint, payload);
      }

      setOpen(false);
      refreshData();
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? 'Edit Transaction' : 'Add New Transaction'}
      trigger={
        trigger || (isEditing ? undefined : <Button>+ Add Transaction</Button>)
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="transaction-type">Type</Label>
            <Select
              value={type}
              onValueChange={setType}
              disabled={isSubmitting}
            >
              <SelectTrigger id="transaction-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Label>Date</Label>
            <DatePicker date={date} setDate={setDate} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="e.g. 100.00"
              type="number"
              inputMode="decimal"
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
              id="currency"
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

          {(!isEditing || isEditingScheduled) && (
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
                  {!isEditingScheduled && (
                    <SelectItem value="not_scheduled">Not scheduled</SelectItem>
                  )}
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save'}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
