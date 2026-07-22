import { useState } from 'react';
import { AddBudgetDialog } from '@/components/AddBudgetDialog';
import { EditBudgetDialog } from '@/components/EditBudgetDialog';
import { BudgetCard } from '@/components/BudgetCard';
import { useData } from '@/context/DataContext';
import { useApi } from '@/hooks/useApi';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { IconTargetArrow } from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export default function BudgetsPage() {
  const { budgets = [], loading, refreshData } = useData();
  const { del } = useApi();
  const { loading: isDeleting, run: runDelete } = useAsyncAction();
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  const handleDeleteBudget = () => {
    if (!deletingBudget) return;
    runDelete(async () => {
      await del(`/budgets/${deletingBudget.id_budget}`);
      setDeletingBudget(null);
      await refreshData();
    });
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Budgets
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your spending limits for each month
          </p>
        </div>
        <AddBudgetDialog />
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (budgets || []).length === 0 ? (
        <EmptyState
          icon={IconTargetArrow}
          title="No budgets yet"
          description="Set spending limits for your categories to keep your finances on track."
          action={<AddBudgetDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id_budget}
              budget={budget}
              onEdit={(b) => setEditingBudget(b)}
              onDelete={(b) => setDeletingBudget(b)}
            />
          ))}
        </div>
      )}

      <EditBudgetDialog
        budget={editingBudget}
        open={!!editingBudget}
        onOpenChange={(open) => {
          if (!open) setEditingBudget(null);
        }}
        onSuccess={() => setEditingBudget(null)}
      />

      <ConfirmDeleteDialog
        open={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        isDeleting={isDeleting}
        title="Delete budget?"
        description={`This will permanently remove the budget limit for "${deletingBudget?.category_name || 'this category'}".`}
        onConfirm={handleDeleteBudget}
      />
    </div>
  );
}
