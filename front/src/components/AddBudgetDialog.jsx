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
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function AddBudgetDialog() {
  const { token, apiUrl, onLogout } = useAuth();
  const { categories = [], setRefreshing } = useData();

  const { loading: isSubmitting, error, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!amount || !category) return;

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];

    run(async () => {
      await apiFetch(
        `${apiUrl}/budgets/`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            limit: parseFloat(amount),
            start_date: today,
            end: endDate,
            Categories_id_category: parseInt(category),
            Currency_id_currency: 1, //TODO: Make this dynamic based on user preference or account currency
          }),
        },
        onLogout
      );

      setAmount('');
      setCategory('');
      setOpen(false);
      setRefreshing((prev) => prev + 1);
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

          <div className="flex flex-col gap-2">
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Confirm Budget'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
