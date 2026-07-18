import { getIconForCategory } from '@/lib/categoryIcons';
import { CategoryBadge } from '@/lib/categoryBadge';
import { Link } from 'react-router-dom';
import { formatMoney } from '@/lib/formatMoney';
import { useData } from '@/context/DataContext';
import { isIncome } from '@/lib/transactionHelpers';
import { RowSkeleton } from '@/components/ui/row-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { IconReceipt2 } from '@tabler/icons-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function RecentTransactions() {
  const { transactions = [], loading } = useData();

  return (
    <Card className="border-border/50 flex flex-col h-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="space-y-1 px-6 pb-6">
          {loading ? (
            <RowSkeleton count={5} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={IconReceipt2}
              title="No transactions yet"
              description="Your latest income and expenses will appear here."
              className="py-8"
            />
          ) : (
            transactions.slice(0, 7).map((transaction) => {
              const typeLower = transaction.type?.toLowerCase() ?? 'expense';
              const transactionIsIncome = isIncome(transaction);
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
                    <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
                      <CategoryBadge
                        category={catName}
                        className="text-[10px] px-1.5 py-0 sm:text-xs sm:px-2.5 sm:py-0.5"
                      />
                      <span>•</span>
                      <span className="whitespace-nowrap">{displayDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-sm sm:text-base font-semibold flex-shrink-0 ml-4 whitespace-nowrap ${
                        transactionIsIncome
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}
                    >
                      {transactionIsIncome ? '+' : '-'}
                      {formatMoney(
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
        {transactions.length > 0 && (
          <div className="px-6 pb-4">
            <Link
              to="/transactions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all transactions →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
