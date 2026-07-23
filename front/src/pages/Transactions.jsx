import * as React from 'react';
import { useState } from 'react';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
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
  IconSearch,
  IconFilter,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const isMobile = useIsMobile();

  const hasActiveFilters =
    typeFilter !== 'ALL' || dateFrom || dateTo || searchQuery.trim() !== '';

  const activeFilterCount =
    (typeFilter !== 'ALL' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleClearFilters = () => {
    setTypeFilter('ALL');
    setDateFrom(null);
    setDateTo(null);
    setSearchQuery('');
  };

  const filteredTransactions = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      const txDate = new Date(t.date);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      if (query) {
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchCat = (t.category_name || '').toLowerCase().includes(query);
        const matchAmt = String(t.amount || '').includes(query);
        if (!matchDesc && !matchCat && !matchAmt) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo, searchQuery]);

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
            <Button variant="ghost" size="icon" className="size-8">
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
          isMobile ? (
            <div
              className={`flex items-center gap-2 mb-4 ${
                loading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-background text-base sm:text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => setFilterDrawerOpen(true)}
                className="h-10 px-3 flex items-center gap-1.5 shrink-0"
              >
                <IconFilter className="size-4" />
                <span className="text-xs font-medium">Filter</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-0.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          ) : (
            <div
              className={`flex flex-col md:flex-row gap-4 mb-6 md:items-center justify-between ${
                loading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <div className="relative w-full md:w-72">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SegmentedControl
                  options={FILTER_OPTIONS}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />

                <div className="flex items-center gap-2">
                  <DatePicker
                    date={dateFrom}
                    setDate={setDateFrom}
                    placeholder="From"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <DatePicker
                    date={dateTo}
                    setDate={setDateTo}
                    placeholder="To"
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )
        )}

        {loading ? (
          <RowSkeleton count={6} />
        ) : filteredTransactions.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={IconFilterOff}
              title="No matching transactions"
              description="Try adjusting your filters or search query to see more results."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
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
                            className="size-8"
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
          <SimpleDataTable
            columns={columns}
            data={filteredTransactions}
            showSearch={false}
          />
        )}
      </div>

      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Filter Transactions</DrawerTitle>
            <DrawerDescription>
              Filter your transactions by category type or date range.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-5 p-4 pb-8 max-h-[75vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transaction Type
              </label>
              <SegmentedControl
                options={FILTER_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date Range
              </label>
              <div className="flex flex-col gap-2">
                <DatePicker
                  date={dateFrom}
                  setDate={setDateFrom}
                  placeholder="From Date"
                />
                <DatePicker
                  date={dateTo}
                  setDate={setDateTo}
                  placeholder="To Date"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClearFilters}
                >
                  Reset
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
