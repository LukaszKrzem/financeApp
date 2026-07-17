import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div
      className={cn(
        'flex gap-1 w-full sm:w-auto bg-muted/50 p-1 rounded-lg border border-border/50',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 text-[11px] sm:text-xs flex-1 sm:flex-initial sm:min-w-[72px] transition-all duration-200',
              isActive
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
