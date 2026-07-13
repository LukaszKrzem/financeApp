import { useEffect, useState, useCallback } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
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
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

const formatMoney = (value, currencyCode = 'PLN') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(value) || 0);

export default function SavingsGoals() {
  const { token, apiUrl, onLogout } = useAuth();

  const [goals, setGoals] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [contributions, setContributions] = useState({});
  const {
    loading: isCreating,
    error: createError,
    run: runCreate,
  } = useAsyncAction();
  const { loading: isAdding, run: runAdd } = useAsyncAction();
  const { loading: isDeleting, run: runDelete } = useAsyncAction();

  const fetchGoals = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch(
        `${apiUrl}/savings-goals/`,
        token,
        {},
        onLogout
      );
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
    } finally {
      setIsFetching(false);
    }
  }, [apiUrl, token, onLogout]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = (event) => {
    event.preventDefault();
    if (isCreating) return;

    runCreate(async () => {
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
            Currency_id_currency: 1, // TODO: Make this dynamic based on user preference or account currency
          }),
        },
        onLogout
      );

      setName('');
      setTarget('');
      setCurrentAmount('');
      setTimeLimit('');
      setOpen(false);
      await fetchGoals();
    });
  };

  const handleAddContribution = (goalId) => {
    const amount = Number(contributions[goalId]) || 0;
    if (amount <= 0 || isAdding) return;

    runAdd(async () => {
      await apiFetch(
        `${apiUrl}/savings-goals/${goalId}/add`,
        token,
        { method: 'PATCH', body: JSON.stringify({ amount }) },
        onLogout
      );

      setContributions((prev) => ({ ...prev, [goalId]: '' }));
      await fetchGoals();
    });
  };

  const handleDeleteGoal = (goalId) => {
    if (isDeleting) return;

    runDelete(async () => {
      await apiFetch(
        `${apiUrl}/savings-goals/${goalId}`,
        token,
        { method: 'DELETE' },
        onLogout
      );

      setGoals((currentGoals) =>
        currentGoals.filter((goal) => goal.id_saving_goal !== goalId)
      );
    });
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Savings Goals
          </h2>
          <p className="text-sm text-muted-foreground">
            Track progress towards your planned savings.
          </p>
        </div>

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
            <form
              onSubmit={handleCreateGoal}
              className="flex flex-col gap-4 py-4"
            >
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

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Confirm Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isFetching ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading savings goals...
        </p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          You haven't created any savings goals yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min(Number(goal.percent_complete) || 0, 100);
            const left = Number(goal.target) - Number(goal.current_amount);

            return (
              <div
                key={goal.id_saving_goal}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {goal.time_limit
                        ? `Deadline: ${new Date(goal.time_limit).toLocaleDateString()}`
                        : 'No deadline'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGoal(goal.id_saving_goal)}
                    disabled={isDeleting}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      {formatMoney(goal.current_amount, goal.currency_code)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatMoney(goal.target, goal.currency_code)}
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>

                <p className="text-xs text-muted-foreground">
                  {left > 0
                    ? `${formatMoney(left, goal.currency_code)} left to save`
                    : 'Goal completed'}
                </p>

                <div className="flex gap-2">
                  <Label
                    htmlFor={`contribution-${goal.id_saving_goal}`}
                    className="sr-only"
                  >
                    Contribution amount
                  </Label>
                  <Input
                    id={`contribution-${goal.id_saving_goal}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount to add"
                    value={contributions[goal.id_saving_goal] || ''}
                    disabled={isAdding}
                    onChange={(event) =>
                      setContributions((currentValues) => ({
                        ...currentValues,
                        [goal.id_saving_goal]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddContribution(goal.id_saving_goal)}
                    disabled={isAdding}
                  >
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
