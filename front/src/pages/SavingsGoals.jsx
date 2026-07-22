import { useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { AddSavingGoalDialog } from '@/components/AddSavingGoalDialog';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { useApi } from '@/hooks/useApi';
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
          {savingsGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id_saving_goal}
              goal={goal}
              contribution={contributions[goal.id_saving_goal]}
              onContributionChange={(goalId, val) =>
                setContributions((prev) => ({ ...prev, [goalId]: val }))
              }
              onAddContribution={handleAddContribution}
              onDelete={handleDeleteGoal}
              isAdding={isAdding}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
