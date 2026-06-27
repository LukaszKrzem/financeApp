import { getIconForCategory } from '@/lib/categoryIcons';
import { CategoryBadge } from '@/lib/categoryBadge';
import { Link } from 'react-router-dom';
import { formatTransactionAmount } from '@/lib/formatMoney';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function RecentTransactions({ transactions, loading }) {
  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading transactions...
      </div>
    );
  }

  return (
    <Card className="border-border/50 flex flex-col h-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="space-y-1 px-6 pb-6">
          {transactions.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No transactions to display.
            </div>
          ) : (
            transactions.slice(0, 7).map((transaction) => {
              const typeLower = transaction.type.toLowerCase();
              const isIncome = typeLower === 'income';
              const catName = transaction.category_name || 'Other';
              const Icon = getIconForCategory(catName, typeLower);
              const displayName = transaction.description || catName;
              const displayDate = new Date(
                transaction.date
              ).toLocaleDateString();

              return (
                <div
                  key={transaction.id_transaction}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(--primary) 15%, transparent)`,
                    }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CategoryBadge category={catName} />
                      <span>•</span>
                      <span>{displayDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold tabular-nums ${
                        isIncome ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatTransactionAmount(
                        transaction.amount,
                        transaction.currency_code
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-6 pb-4">
          <Link
            to="/transactions"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all transactions →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
