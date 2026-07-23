import * as React from 'react';
import { useState } from 'react';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { CategoryBadge } from '@/lib/categoryBadge';
import { formatMoney } from '@/lib/formatMoney';
import { useData } from '@/context/DataContext';
import { useApi } from '@/hooks/useApi';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { DatePicker } from '@/components/ui/date-picker';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { isExpense, getSignedAmount } from '@/lib/transactionHelpers';
import { formatDate } from '@/lib/formatDate';
import { RowSkeleton } from '@/components/ui/row-skeleton';
import {
  IconReceipt,
  IconFilterOff,
  IconPencil,
  IconTrash,
  IconDotsVertical,
} from '@tabler/icons-react';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PageHeader } from '@/components/PageHeader';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Spending' },
];

export default function Transactions() {
  const { transactions = [], loading, refreshData } = useData();
  const { del } = useApi();
  const { loading: isDeleting, run: runDelete } = useAsyncAction();

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const isMobile = useIsMobile();

  const hasActiveFilters = typeFilter !== 'ALL' || dateFrom || dateTo;

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      const txDate = new Date(t.date);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo]);

  const handleDelete = () => {
    runDelete(async () => {
      await del(`/transactions/${deletingTransaction.id_transaction}`);
      setDeletingTransaction(null);
      refreshData();
    });
  };

  const columns = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.getValue('date')),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => (
        <CategoryBadge category={row.getValue('category_name')} />
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorFn: (row) => getSignedAmount(row),
      cell: ({ row }) => {
        const expense = isExpense(row.original);
        const amount = row.getValue('amount');
        const formatted = formatMoney(
          amount,
          row.original.currency_code,
          false,
          false
        );

        return (
          <div
            className={`font-semibold ${expense ? 'text-red-500' : 'text-emerald-500'}`}
          >
            {expense ? '-' : '+'}
            {formatted}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setEditingTransaction(row.original)}
            >
              <IconPencil className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeletingTransaction(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <PageHeader
        title="Transaction history"
        description="Review all your expenses and income."
      />

      <div className="bg-card border-border/50 border rounded-xl p-4">
        {(loading || transactions.length > 0) && (
          <div
            className={`flex flex-col md:flex-row gap-4 mb-6 md:items-center ${
              loading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <div className="flex gap-2">
              <SegmentedControl
                options={FILTER_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 md:ml-auto w-full md:w-auto">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <DatePicker
                    date={dateFrom}
                    setDate={setDateFrom}
                    placeholder="From"
                  />
                </div>
                <span className="text-muted-foreground text-sm flex-shrink-0">
                  —
                </span>
                <div className="flex-1 min-w-0">
                  <DatePicker
                    date={dateTo}
                    setDate={setDateTo}
                    placeholder="To"
                  />
                </div>
              </div>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                  onClick={() => {
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <RowSkeleton count={6} />
        ) : filteredTransactions.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={IconFilterOff}
              title="No matching transactions"
              description="Try adjusting your filters to see more results."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTypeFilter('ALL');
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={IconReceipt}
              title="No transactions yet"
              description="Add your first transaction to start tracking your spending."
              action={<AddTransactionDialog />}
            />
          )
        ) : isMobile ? (
          <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
            {filteredTransactions.map((t) => {
              const expense = isExpense(t);
              const formattedAmount = formatMoney(
                t.amount,
                t.currency_code,
                false,
                false
              );

              return (
                <div
                  key={t.id_transaction}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-1 h-9 rounded-full flex-shrink-0 ${
                        expense ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {t.description}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <CategoryBadge
                          category={t.category_name}
                          className="text-[10px] px-1.5 py-0 sm:text-xs"
                        />
                        <span className="text-muted-foreground/50 hidden sm:inline">
                          •
                        </span>
                        <span className="whitespace-nowrap">
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ml-2 ${
                        expense ? 'text-red-500' : 'text-emerald-500'
                      }`}
                    >
                      {expense ? '-' : '+'}
                      {formattedAmount}
                    </span>

                    <DropdownMenu
                      open={openDropdownId === t.id_transaction}
                      onOpenChange={(isOpen) =>
                        setOpenDropdownId(isOpen ? t.id_transaction : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <div className="inline-block">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onPointerDown={(e) => {
                              if (e.pointerType === 'touch') {
                                e.stopPropagation();
                              }
                            }}
                            onClick={() => {
                              setOpenDropdownId(
                                openDropdownId === t.id_transaction
                                  ? null
                                  : t.id_transaction
                              );
                            }}
                          >
                            <IconDotsVertical className="size-4" />
                          </Button>
                        </div>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingTransaction(t)}
                        >
                          <IconPencil className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingTransaction(t)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <SimpleDataTable columns={columns} data={filteredTransactions} />
        )}
      </div>

      <AddTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(o) => !o && setEditingTransaction(null)}
        trigger={<div className="hidden"></div>}
      />

      <ConfirmDeleteDialog
        open={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        isDeleting={isDeleting}
        title="Delete transaction?"
        description={`This will permanently delete "${deletingTransaction?.description || 'this transaction'}" and update your account balance. This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
