import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
      ))}
    </div>
  );
}
