import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus } from '@tabler/icons-react';
import { apiFetch } from '@/lib/apiFetch';

export function AddBudgetDialog({
  token,
  onBudgetAdded,
  categories = [],
  setRefreshing,
  apiUrl,
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];

    try {
      await apiFetch(`${apiUrl}/budgets/`, token, {
        method: 'POST',
        body: JSON.stringify({
          limit: parseFloat(amount),
          start_date: today,
          end: endDate,
          Categories_id_category: parseInt(category),
          Currency_id_currency: 1,
        }),
      });

      setAmount('');
      setCategory('');
      setOpen(false);
      if (onBudgetAdded) onBudgetAdded();

      setRefreshing((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating budget:', error);
    }
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
            <label className="text-sm font-medium">Category</label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">Limit</label>
            <Input
              type="number"
              step="0.01"
              min="0.00"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Confirm Budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
