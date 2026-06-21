import { useState } from 'react';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

const formatTransactionAmount = (amount, currencyCode) => {
  const value = new Intl.NumberFormat('pl-PL', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(parseFloat(amount)).toFixed(2));
  const code = (currencyCode || 'PLN').toUpperCase();
  switch (code) {
    case 'USD':
      return `$${value}`;
    case 'EUR':
      return `${value} €`;
    case 'GBP':
      return `£${value}`;
    case 'PLN':
      return `${value} zł`;
    default:
      return `${value} ${code}`;
  }
};

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
          className={`font-medium ${isExpense ? 'text-red-500' : 'text-emerald-500'}`}
        >
          {isExpense ? '-' : '+'}
          {formatted}
        </div>
      );
    },
  },
];

export default function Transactions({ transactions, loading }) {
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
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 md:w-36 h-8 text-sm"
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Input
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
          <div className="text-center py-10">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No transactions found.
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3">
            {filteredTransactions.map((t) => {
              const isExpense = t.type === 'EXPENSE';
              const formattedAmount = formatTransactionAmount(
                t.amount,
                t.currency_code
              );

              return (
                <div
                  key={t.id_transaction || Math.random()}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${isExpense ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}
                    >
                      {isExpense ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-sm leading-none mb-1">
                        {t.description}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {t.category_name || 'Uncategorized'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`font-bold ${isExpense ? 'text-red-500' : 'text-emerald-500'}`}
                    >
                      {isExpense ? '-' : '+'}
                      {formattedAmount}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
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
