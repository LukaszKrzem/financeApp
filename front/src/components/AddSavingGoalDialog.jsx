import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function AddSavingGoalDialog({ onGoalAdded }) {
  const { token, apiUrl, onLogout } = useAuth();
  const { loading: isCreating, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');

  const handleCreateGoal = (event) => {
    event.preventDefault();
    if (isCreating) return;

    run(async () => {
      await apiFetch(
        `${apiUrl}/savings-goals/`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            target: Number(target),
            current_amount: Number(currentAmount) || 0,
            time_limit: timeLimit || null,
            Currency_id_currency: 1, // TODO: Make dynamic
          }),
        },
        onLogout
      );

      setName('');
      setTarget('');
      setCurrentAmount('');
      setTimeLimit('');
      setOpen(false);

      if (onGoalAdded) {
        onGoalAdded();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconPlus className="size-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Savings Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              type="text"
              placeholder="e.g. New laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-target">Target amount</Label>
            <Input
              id="goal-target"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 5000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isCreating}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-current">Current amount</Label>
            <Input
              id="goal-current"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1000"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-deadline">Deadline</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              disabled={isCreating}
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Confirm Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
