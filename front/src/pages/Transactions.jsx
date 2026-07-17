import * as React from 'react';
import { useState } from 'react';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { CategoryBadge } from '@/lib/categoryBadge';
import { formatMoney } from '@/lib/formatMoney';
import { useData } from '@/context/DataContext';
import { DatePicker } from '@/components/ui/date-picker';

const columns = [
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
      const formatted = formatMoney(amount, row.original.currency_code);

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
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const isMobile = useIsMobile();

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
              const formattedAmount = formatMoney(t.amount, t.currency_code);

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
