import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { CurrencySelect } from './ui/currency-select';
import { toast } from 'sonner';

export function EditSavingGoalDialog({ goal, open, onOpenChange, onSuccess }) {
  const { patch } = useApi();
  const { currencies = [], refreshData } = useData();
  const { loading: isSubmitting, run } = useAsyncAction();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [currencyId, setCurrencyId] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setTarget(goal.target !== undefined ? String(goal.target) : '');
      setCurrentAmount(goal.current_amount !== undefined ? String(goal.current_amount) : '');
      setTimeLimit(goal.time_limit ? String(goal.time_limit).split('T')[0] : '');
      setCurrencyId(goal.currency_id !== undefined ? String(goal.currency_id) : '');
    }
  }, [goal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goal || isSubmitting) return;
    if (!name || !target || !currencyId) return;

    run(async () => {
      await patch(`/savings-goals/${goal.id_saving_goal}`, {
        name,
        target: parseFloat(target),
        current_amount: parseFloat(currentAmount) || 0,
        time_limit: timeLimit || null,
        currency_id: parseInt(currencyId),
      });

      toast.success('Savings goal updated successfully');
      onOpenChange(false);
      await refreshData();
      if (onSuccess) onSuccess();
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Savings Goal"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-goal-name">Goal name</Label>
          <Input
            id="edit-goal-name"
            type="text"
            placeholder="e.g. New laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="edit-goal-target">Target amount</Label>
            <Input
              id="edit-goal-target"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 5000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="flex flex-col gap-2 w-[100px]">
            <Label htmlFor="edit-goal-currency">Currency</Label>
            <CurrencySelect
              id="edit-goal-currency"
              value={currencyId}
              onChange={setCurrencyId}
              currencies={currencies}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-goal-current">Current amount</Label>
          <Input
            id="edit-goal-current"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 1000"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-goal-deadline">Deadline</Label>
          <Input
            id="edit-goal-deadline"
            type="date"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            disabled={isSubmitting}
          />
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
