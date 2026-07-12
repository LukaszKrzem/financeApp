import { useState } from 'react';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { CategoryBadge } from '@/lib/categoryBadge';
import { formatTransactionAmount } from '@/lib/formatMoney';
import { useData } from '@/context/DataContext';

export const columns = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return date.toLocaleDateString('pl-PL');
    },
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
    accessorFn: (row) => {
      const val = parseFloat(row.amount);
      return row.type === 'EXPENSE' ? -val : val;
    },
    cell: ({ row }) => {
      const amount = row.getValue('amount');
      const isExpense = amount < 0;
      const formatted = formatTransactionAmount(
        amount,
        row.original.currency_code
      );

      return (
        <div
          className={`font-semibold ${isExpense ? 'text-red-500' : 'text-emerald-500'}`}
        >
          {isExpense ? '-' : '+'}
          {formatted}
        </div>
      );
    },
  },
];

export default function Transactions() {
  const { transactions = [], loading } = useData();

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isMobile = useIsMobile();

  const filteredTransactions = transactions
    .filter((t) => typeFilter === 'ALL' || t.type === typeFilter)
    .filter((t) => !dateFrom || new Date(t.date) >= new Date(dateFrom))
    .filter(
      (t) => !dateTo || new Date(t.date) <= new Date(dateTo + 'T23:59:59')
    );

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Transaction history
        </h1>
        <p className="text-muted-foreground">
          Review all your expenses and income.
        </p>
      </div>

      <div className="bg-card border-border/50 border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center">
          <div className="flex gap-2">
            {['ALL', 'EXPENSE', 'INCOME'].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setTypeFilter(type)}
              >
                {type === 'ALL'
                  ? 'All'
                  : type === 'EXPENSE'
                    ? 'Expenses'
                    : 'Income'}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:ml-auto w-full md:w-auto">
            <Label htmlFor="date-from">Date range:</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 md:w-36 h-8 text-sm"
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Label htmlFor="date-to" className="sr-only">
              Date to
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 md:w-36 h-8 text-sm"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No transactions found.
          </div>
        ) : isMobile ? (
          <div className="flex flex-col rounded-lg border border-border/50 overflow-hidden">
            {filteredTransactions.map((t) => {
              const isExpense = t.type === 'EXPENSE';
              const formattedAmount = formatTransactionAmount(
                t.amount,
                t.currency_code
              );

              return (
                <div
                  key={t.id_transaction}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-1 h-9 rounded-full flex-shrink-0 ${
                        isExpense ? 'bg-red-500' : 'bg-emerald-500'
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
                          {new Date(t.date).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-semibold flex-shrink-0 ml-4 whitespace-nowrap ${
                      isExpense ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {formattedAmount}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <SimpleDataTable columns={columns} data={filteredTransactions} />
        )}
      </div>
    </div>
  );
}
