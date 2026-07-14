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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function AddSavingGoalDialog({ onGoalAdded }) {
  const { post } = useApi();
  const { currencies = [] } = useData();
  const { loading: isCreating, run } = useAsyncAction();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [currencyId, setCurrencyId] = useState('');

  const handleCreateGoal = (event) => {
    event.preventDefault();
    if (isCreating) return;
    if (!currencyId) return;

    run(async () => {
      await post('/savings-goals/', {
        name,
        target: Number(target),
        current_amount: Number(currentAmount) || 0,
        time_limit: timeLimit || null,
        Currency_id_currency: parseInt(currencyId),
      });

      setName('');
      setTarget('');
      setCurrentAmount('');
      setTimeLimit('');
      setCurrencyId('');
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

          <div className="flex gap-2">
            <div className="flex flex-col gap-2 flex-1">
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
            <div className="flex flex-col gap-2 w-[100px]">
              <Label htmlFor="goal-currency">Currency</Label>
              <Select
                value={currencyId}
                onValueChange={setCurrencyId}
                disabled={isCreating}
              >
                <SelectTrigger id="goal-currency">
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
