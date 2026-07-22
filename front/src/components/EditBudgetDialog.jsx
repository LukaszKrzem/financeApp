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
import { toast } from 'sonner';

export function EditBudgetDialog({ budget, open, onOpenChange, onSuccess }) {
  const { patch } = useApi();
  const { categories = [], currencies = [], refreshData } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currencyId, setCurrencyId] = useState('');

  useEffect(() => {
    if (budget) {
      setAmount(budget.limit !== undefined ? String(budget.limit) : '');
      setCategory(budget.category_id !== undefined ? String(budget.category_id) : '');
      setCurrencyId(budget.currency_id !== undefined ? String(budget.currency_id) : '');
    }
  }, [budget]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!budget || isSubmitting) return;
    if (!amount || !category || !currencyId) return;

    run(async () => {
      await patch(`/budgets/${budget.id_budget}`, {
        limit: parseFloat(amount),
        category_id: parseInt(category),
        currency_id: parseInt(currencyId),
      });

      toast.success('Budget updated successfully');
      onOpenChange(false);
      await refreshData();
      if (onSuccess) onSuccess();
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Budget"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-budget-category">Category</Label>
          <Select
            onValueChange={setCategory}
            value={category}
            disabled={isSubmitting}
          >
            <SelectTrigger id="edit-budget-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => {
                const catId =
                  cat.id_category !== undefined ? cat.id_category : cat.id;
                return (
                  <SelectItem key={catId} value={String(catId)}>
                    {cat.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="edit-budget-limit">Limit</Label>
            <Input
              id="edit-budget-limit"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2 w-[100px]">
            <Label htmlFor="edit-budget-currency">Currency</Label>
            <CurrencySelect
              id="edit-budget-currency"
              value={currencyId}
              onChange={setCurrencyId}
              currencies={currencies}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
