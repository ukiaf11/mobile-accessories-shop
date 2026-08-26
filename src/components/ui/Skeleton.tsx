import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} />;
}

/** Placeholder shown while a filtered product grid recomputes. */
export function ProductCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden p-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2 px-1 pt-3.5 pb-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
