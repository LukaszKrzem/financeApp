import { Badge } from '@/components/ui/badge';
import { categoryColors } from '@/lib/categories';

export function CategoryBadge({ category, className = '' }) {
  const name = category || 'Uncategorized';
  const colorClass =
    categoryColors[name] ||
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800';

  return (
    <Badge
      variant="outline"
      className={`font-normal rounded-md px-2.5 py-0.5 ${colorClass} ${className}`}
    >
      {name}
    </Badge>
  );
}
