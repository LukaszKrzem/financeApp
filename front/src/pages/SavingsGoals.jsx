import { useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { AddSavingGoalDialog } from '@/components/AddSavingGoalDialog';
import { useApi } from '@/hooks/useApi';
import { formatMoney } from '@/lib/formatMoney';
import { useData } from '@/context/DataContext';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { IconPigMoney } from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function SavingsGoals() {
  const { patch, del } = useApi();

  const [contributions, setContributions] = useState({});
  const { loading: isAdding, run: runAdd } = useAsyncAction();
  const { loading: isDeleting, run: runDelete } = useAsyncAction();

  const { savingsGoals = [], loading: isFetching, refreshData } = useData();

  const handleAddContribution = (goalId) => {
    const amount = Number(contributions[goalId]) || 0;
    if (amount <= 0 || isAdding) return;

    runAdd(async () => {
      await patch(`/savings-goals/${goalId}/add`, { amount });

      setContributions((prev) => ({ ...prev, [goalId]: '' }));
      await refreshData();
    });
  };

  const handleDeleteGoal = (goalId) => {
    if (isDeleting) return;

    runDelete(async () => {
      await del(`/savings-goals/${goalId}`);
      await refreshData();
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

        <AddSavingGoalDialog onGoalAdded={refreshData} />
      </div>

      {isFetching ? (
        <CardSkeleton count={3} />
      ) : savingsGoals.length === 0 ? (
        <EmptyState
          icon={IconPigMoney}
          title="No savings goals yet"
          description="Create a goal to start putting money aside for what matters to you."
          action={<AddSavingGoalDialog onGoalAdded={refreshData} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
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
