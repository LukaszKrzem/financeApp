import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconRefresh,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { formatMoney } from '@/lib/formatMoney';

export function AccountCard({
  account,
  isSyncing,
  onRename,
  onDelete,
  onSync,
}) {
  if (!account) return null;

  const compactNumber = formatMoney(
    account.current_balance,
    account.currency_code,
    true
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground p-4 sm:p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative">
      <div className="flex justify-between items-start sm:items-center gap-2 min-w-0">
        <span
          className="font-semibold text-base sm:text-lg text-foreground truncate min-w-0 flex-1 pr-1"
          title={account.name}
        >
          {account.name}
        </span>

        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
          {isSyncing && (
            <IconRefresh className="size-4 animate-spin text-muted-foreground" />
          )}

          {account.bank_account_uid && (
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 whitespace-nowrap">
              Connected
            </span>
          )}
          <span className="text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {account.currency_code}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 -mr-1 -mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {account.bank_account_uid && (
                <DropdownMenuItem
                  disabled={isSyncing}
                  onClick={() => onSync(account.id_account)}
                >
                  <IconRefresh className="size-4 mr-2" /> Sync bank
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRename(account)}>
                <IconPencil className="size-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(account)}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="size-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {compactNumber}
        </div>
      </div>
    </div>
  );
}
