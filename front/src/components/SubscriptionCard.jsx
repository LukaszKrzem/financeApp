import {
  differenceInDays,
  isToday,
  isTomorrow,
  parseISO,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconCalendarEvent,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { CategoryBadge } from '@/lib/categoryBadge';
import { formatMoney } from '@/lib/formatMoney';
import { formatDatePattern } from '@/lib/formatDate';

export function SubscriptionCard({
  sub,
  categoryName,
  accountName,
  currencyCode,
  onEdit,
  onDelete,
}) {
  if (!sub) return null;

  const nextDate = parseISO(sub.next_date);
  const daysDiff = differenceInDays(nextDate, new Date());

  let daysLeftText = `In ${daysDiff} days`;
  if (isToday(nextDate)) daysLeftText = 'Today!';
  else if (isTomorrow(nextDate)) daysLeftText = 'Tomorrow';
  else if (daysDiff < 0) daysLeftText = 'Overdue';

  const isUrgent = daysDiff <= 1;

  return (
    <Card className="rounded-xl border border-border/50 bg-card text-card-foreground flex flex-col relative overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0 pr-1">
            <CardTitle
              className="text-base sm:text-lg font-bold truncate"
              title={sub.description || categoryName}
            >
              {sub.description || categoryName}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center mt-1 truncate">
              <IconCalendarEvent className="mr-1.5 size-3.5 shrink-0" />
              <span className="truncate">{formatDatePattern(nextDate, 'PPP')}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 -mr-2 -mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(sub)}>
                    <IconPencil className="size-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(sub)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="size-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge
              variant={isUrgent ? 'destructive' : 'secondary'}
              className="whitespace-nowrap text-[11px] px-2 py-0.5"
            >
              {daysLeftText}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center justify-between border-t border-border/50 pt-4 gap-2 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5 truncate"
              title={`${sub.frequency?.toLowerCase()} • ${accountName}`}
            >
              <span className="shrink-0">{sub.frequency?.toLowerCase()}</span>
              <span className="text-muted-foreground/30">•</span>
              <span className="truncate">{accountName}</span>
            </span>
            <div className="mt-1 min-w-0 truncate">
              <CategoryBadge category={categoryName} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground tabular-nums shrink-0 ml-auto whitespace-nowrap">
            {formatMoney(sub.amount, currencyCode, false, false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
