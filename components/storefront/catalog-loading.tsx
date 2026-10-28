import { Skeleton } from "@/components/ui/skeleton";

export function CatalogLoading() {
  return (
    <main
      aria-label="Loading Shringaar collection"
      aria-busy="true"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-10 w-64 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="space-y-3" key={index}>
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
