import { classNames } from '../../utils/format';

export function Skeleton({ className }) {
  return <div className={classNames('dnd-skeleton rounded-xl', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
