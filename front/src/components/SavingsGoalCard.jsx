import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import { formatMoney } from '@/lib/formatMoney';

export function SavingsGoalCard({
  goal,
  contribution,
  onContributionChange,
  onAddContribution,
  onEdit,
  onDelete,
  isAdding,
  isDeleting,
}) {
  if (!goal) return null;

  const percent = Math.min(Number(goal.percent_complete) || 0, 100);
  const left = Number(goal.target) - Number(goal.current_amount);

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1 pr-1">
          <h3
            className="font-semibold text-base sm:text-lg truncate"
            title={goal.name}
          >
            {goal.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {goal.time_limit
              ? `Deadline: ${format(parseISO(goal.time_limit), 'PPP')}`
              : 'No deadline'}
          </p>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 -mr-2 -mt-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <IconPencil className="size-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(goal.id_saving_goal)}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>
            {formatMoney(goal.current_amount, goal.currency_code, false, false)}
          </span>
          <span className="text-muted-foreground">
            {formatMoney(goal.target, goal.currency_code, false, false)}
          </span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>

      <p className="text-xs text-muted-foreground truncate">
        {left > 0
          ? `${formatMoney(left, goal.currency_code, false, false)} left to save`
          : 'Goal completed'}
      </p>

      <div className="flex gap-2">
        <Label
          htmlFor={`contribution-${goal.id_saving_goal}`}
          className="sr-only"
        >
          Contribution amount
        </Label>
        <Input
          id={`contribution-${goal.id_saving_goal}`}
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount to add"
          value={contribution || ''}
          disabled={isAdding}
          onChange={(e) =>
            onContributionChange(goal.id_saving_goal, e.target.value)
          }
        />
        <Button
          type="button"
          size="sm"
          onClick={() => onAddContribution(goal.id_saving_goal)}
          disabled={isAdding}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
