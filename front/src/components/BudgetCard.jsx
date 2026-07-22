import { Progress } from '@/components/ui/progress';
import { formatMoney } from '@/lib/formatMoney';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';

export function BudgetCard({ budget, onEdit, onDelete }) {
  if (!budget) return null;

  const spent = Number(budget.current_spent) || 0;
  const limit = Number(budget.limit) || 1;
  const percentage =
    budget.percent_used !== undefined
      ? budget.percent_used
      : Math.min((spent / limit) * 100, 100);
  const categoryName =
    budget.category_name || `Category #${budget.category_id}`;

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative">
      <div className="flex justify-between items-center min-w-0">
        <span className="font-medium text-sm text-muted-foreground truncate flex-1 pr-2">
          {categoryName}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted">
            {percentage.toFixed(0)}%
          </span>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 -mr-2 -mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(budget)}>
                    <IconPencil className="size-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(budget)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="size-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">
          {formatMoney(spent, budget.currency_code, false, false)}
        </span>
        <span className="text-sm text-muted-foreground">
          / {formatMoney(limit, budget.currency_code, false, false)}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <p className="text-[11px] text-muted-foreground mt-1 truncate">
        {limit - spent >= 0
          ? `You have ${formatMoney(limit - spent, budget.currency_code, false, false)} left`
          : `You have exceeded the limit by ${formatMoney(spent - limit, budget.currency_code, false, false)}!`}
      </p>
    </div>
  );
}
