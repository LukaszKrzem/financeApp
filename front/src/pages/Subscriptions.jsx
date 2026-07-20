import { useState, useMemo, useCallback } from 'react';
import {
  format,
  differenceInDays,
  isToday,
  isTomorrow,
  parseISO,
  compareAsc,
} from 'date-fns';
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
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconTrendingDown,
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { CategoryBadge } from '@/lib/categoryBadge';
import { formatMoney } from '@/lib/formatMoney';
import { EmptyState } from '@/components/ui/empty-state';

function SubscriptionCard({
  sub,
  categoryName,
  accountName,
  currencyCode,
  onEdit,
  onDelete,
}) {
  const nextDate = parseISO(sub.next_date);
  const daysDiff = differenceInDays(nextDate, new Date());

  let daysLeftText = `In ${daysDiff} days`;
  if (isToday(nextDate)) daysLeftText = 'Today!';
  else if (isTomorrow(nextDate)) daysLeftText = 'Tomorrow';
  else if (daysDiff < 0) daysLeftText = 'Overdue';

  const isUrgent = daysDiff <= 1;

  return (
    <Card className="bg-card border-border/50 flex flex-col relative overflow-hidden group transition-all hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate pr-2">
              {sub.description || categoryName}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <IconCalendarEvent className="mr-1.5 size-3.5" />
              {format(nextDate, 'PPP')}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 -mr-2 -mt-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(sub)}>
                  <IconPencil className="size-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(sub)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge
              variant={isUrgent ? 'destructive' : 'secondary'}
              className="whitespace-nowrap"
            >
              {daysLeftText}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
              {sub.frequency?.toLowerCase()}
              <span className="text-muted-foreground/30">•</span>
              {accountName}
            </span>
            <CategoryBadge category={categoryName} className="mt-1" />
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            {formatMoney(Math.abs(sub.amount), currencyCode, false, false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const { del } = useApi();
  const {
    scheduledTransactions = [],
    loading,
    currencies = [],
    accounts = [],
    categories = [],
    refreshData,
  } = useData();

  const { loading: isDeleting, run: runDelete } = useAsyncAction();

  const [deletingSubscription, setDeletingSubscription] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);

  const currencyMap = useMemo(
    () => Object.fromEntries(currencies.map((c) => [c.id_currency, c])),
    [currencies]
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id_category, c])),
    [categories]
  );
  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id_account, a])),
    [accounts]
  );

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

      if (sub.amount > 0) return;

      const curr = currencyMap[sub.Currency_id_currency];
      const rate = curr ? Number(curr.exchange_rate) : 1;
      const amountInBase = Math.abs(sub.amount) * rate;

      switch (sub.frequency?.toUpperCase()) {
        case 'DAILY':
          monthlyBurn += amountInBase * 30.44;
          break;
        case 'WEEKLY':
          monthlyBurn += amountInBase * 4.33;
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
  }, [scheduledTransactions, currencyMap]);

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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fixed Costs</h1>
          <p className="text-muted-foreground">
            Manage recurring payments and subscriptions.
          </p>
        </div>

        <AddTransactionDialog
          defaultFrequency="MONTHLY"
          trigger={
            <Button className="w-full md:w-auto">
              <IconPlus className="mr-2 size-4" /> Add Subscription
            </Button>
          }
        />
      </header>

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
                categoryName={
                  categoryMap[sub.Category_id_category]?.name || 'Subscription'
                }
                currencyCode={
                  currencyMap[sub.Currency_id_currency]?.code || 'PLN'
                }
                accountName={
                  accountMap[sub.Account_id_account]?.name || 'Unknown'
                }
                onDelete={setDeletingSubscription}
                onEdit={(sub) => {
                  setEditingSubscription({
                    ...sub,
                    type: sub.amount < 0 ? 'EXPENSE' : 'INCOME',
                    amount: Math.abs(sub.amount),
                    date: sub.next_date,
                    account_id: sub.Account_id_account,
                  });
                }}
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
        description={`This will permanently remove the recurring payment for "${deletingSubscription?.description || 'this subscription'}".`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
