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

import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function AddBudgetDialog() {
  const { post } = useApi();
  const { categories = [], currencies = [], refreshData } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currencyId, setCurrencyId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!amount || !category || !currencyId) return;

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];

    run(async () => {
      await post('/budgets/', {
        limit: parseFloat(amount),
        start_date: today,
        end: endDate,
        Categories_id_category: parseInt(category),
        Currency_id_currency: parseInt(currencyId),
      });

      setAmount('');
      setCategory('');
      setCurrencyId('');
      setOpen(false);
      refreshData();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconPlus className="size-4" />
          Add Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="budget-category">Category</Label>
            <Select
              onValueChange={setCategory}
              value={category}
              disabled={isSubmitting}
            >
              <SelectTrigger id="budget-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(categories || []).length === 0 ? (
                  <p className="p-2 text-xs text-muted-foreground text-center">
                    Loading categories...
                  </p>
                ) : (
                  categories.map((cat) => {
                    const catId =
                      cat.id_category !== undefined ? cat.id_category : cat.id;
                    return (
                      <SelectItem key={catId} value={String(catId)}>
                        {cat.name}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="budget-limit">Limit</Label>
              <Input
                id="budget-limit"
                type="number"
                step="0.01"
                min="0.00"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2 w-[100px]">
              <Label htmlFor="budget-currency">Currency</Label>
              <Select
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="budget-currency">
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
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Confirm Budget'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
