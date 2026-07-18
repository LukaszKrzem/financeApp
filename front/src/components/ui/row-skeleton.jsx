import { Skeleton } from '@/components/ui/skeleton';

export function RowSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-2 animate-in fade-in duration-500">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}
