import { useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { AddSavingGoalDialog } from '@/components/AddSavingGoalDialog';
import { EditSavingGoalDialog } from '@/components/EditSavingGoalDialog';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { IconPigMoney } from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';

import { PageHeader } from '@/components/PageHeader';

export default function SavingsGoals() {
  const { patch, del } = useApi();

  const [contributions, setContributions] = useState({});
  const [editingGoal, setEditingGoal] = useState(null);
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
      <PageHeader
        title="Savings Goals"
        description="Track progress towards your planned savings."
      >
        <AddSavingGoalDialog onGoalAdded={refreshData} />
      </PageHeader>

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
              onEdit={(g) => setEditingGoal(g)}
              onDelete={handleDeleteGoal}
              isAdding={isAdding}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      <EditSavingGoalDialog
        goal={editingGoal}
        open={!!editingGoal}
        onOpenChange={(open) => {
          if (!open) setEditingGoal(null);
        }}
        onSuccess={() => setEditingGoal(null)}
      />
    </div>
  );
}
