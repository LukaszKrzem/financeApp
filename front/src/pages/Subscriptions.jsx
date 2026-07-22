import { useState, useMemo, useCallback } from 'react';
import { differenceInDays, parseISO, compareAsc } from 'date-fns';
import { useApi } from '@/hooks/useApi';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import {
  IconCalendarEvent,
  IconRepeat,
  IconCreditCard,
  IconPlus,
  IconTrendingDown,
} from '@tabler/icons-react';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { formatMoney } from '@/lib/formatMoney';
import { isExpense } from '@/lib/transactionHelpers';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/PageHeader';

export default function SubscriptionsPage() {
  const { del } = useApi();
  const {
    scheduledTransactions = [],
    loading,
    currencies = [],
    refreshData,
  } = useData();

  const { loading: isDeleting, run: runDelete } = useAsyncAction();

  const [deletingSubscription, setDeletingSubscription] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);

  const baseCurrency = useMemo(
    () =>
      currencies.find((c) => Number(c.exchange_rate) === 1) || { code: 'PLN' },
    [currencies]
  );

  const stats = useMemo(() => {
    let monthlyBurn = 0;
    let upcomingWeek = 0;

    scheduledTransactions.forEach((sub) => {
      const days = differenceInDays(parseISO(sub.next_date), new Date());
      if (days >= 0 && days <= 7) upcomingWeek++;

      if (!isExpense(sub)) return;

      const curr = currencies.find((c) => c.id_currency === sub.currency_id);
      const rate = curr ? Number(curr.exchange_rate) : 1;
      const amountInBase = Number(sub.amount) * rate;

      switch (sub.frequency?.toUpperCase()) {
        case 'DAILY':
          monthlyBurn += amountInBase * 30;
          break;
        case 'WEEKLY':
          monthlyBurn += amountInBase * 4;
          break;
        case 'YEARLY':
          monthlyBurn += amountInBase / 12;
          break;
        default:
          monthlyBurn += amountInBase;
          break;
      }
    });

    return {
      monthlyBurn,
      activeCount: scheduledTransactions.length,
      upcomingWeek,
    };
  }, [scheduledTransactions, currencies]);

  const sortedSubscriptions = useMemo(
    () =>
      [...scheduledTransactions].sort((a, b) =>
        compareAsc(parseISO(a.next_date), parseISO(b.next_date))
      ),
    [scheduledTransactions]
  );

  const handleDelete = useCallback(() => {
    if (!deletingSubscription) return;
    runDelete(async () => {
      await del(
        `/scheduled-transactions/${deletingSubscription.id_schedule_transaction}`
      );
      setDeletingSubscription(null);
      refreshData();
    });
  }, [deletingSubscription, del, runDelete, refreshData]);

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Fixed Costs"
        description="Manage recurring payments and subscriptions."
      >
        <AddTransactionDialog
          defaultFrequency="MONTHLY"
          trigger={
            <Button className="w-full md:w-auto">
              <IconPlus className="mr-2 size-4" /> Add Subscription
            </Button>
          }
        />
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Burn Rate
            </CardTitle>
            <IconTrendingDown className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 tabular-nums">
              {formatMoney(stats.monthlyBurn, baseCurrency.code, false, false)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Est. fixed expenses per month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <IconRepeat className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due soon</CardTitle>
            <IconCalendarEvent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payments in next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Upcoming Payments
          <Badge variant="outline" className="font-mono">
            {sortedSubscriptions.length}
          </Badge>
        </h2>

        {loading ? (
          <CardSkeleton count={3} />
        ) : sortedSubscriptions.length === 0 ? (
          <EmptyState
            icon={IconCreditCard}
            title="No subscriptions found"
            description="Add recurring bills to track your monthly costs automatically."
            action={<AddTransactionDialog defaultFrequency="MONTHLY" />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedSubscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id_schedule_transaction}
                sub={sub}
                categoryName={sub.category_name || 'Subscription'}
                currencyCode={sub.currency_code || 'PLN'}
                accountName={sub.account_name || 'Unknown'}
                onDelete={setDeletingSubscription}
                onEdit={setEditingSubscription}
              />
            ))}
          </div>
        )}
      </section>

      <AddTransactionDialog
        open={!!editingSubscription}
        onOpenChange={(open) => !open && setEditingSubscription(null)}
        transaction={editingSubscription}
        trigger={<div className="hidden"></div>}
      />

      <ConfirmDeleteDialog
        open={!!deletingSubscription}
        onClose={() => setDeletingSubscription(null)}
        isDeleting={isDeleting}
        title="Delete subscription?"
        description={`This will permanently remove the recurring payment for "${
          deletingSubscription?.description || 'this subscription'
        }".`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
