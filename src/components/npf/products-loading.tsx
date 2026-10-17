import { Skeleton } from "@/components/ui/skeleton"

/**
 * F-22 — streaming placeholder for the product listing.
 *
 * Originally a segment-level `loading.tsx` at `[locale]/products/`; moved here
 * deliberately. That boundary also wrapped the child `[slug]` route, flushing
 * the shell (HTTP 200) before the PDP's existence check could resolve — which
 * degraded its notFound() into a soft-404 (F-54 defect class). The skeleton now
 * renders as the Suspense fallback INSIDE the listing page body, so /products
 * keeps its no-empty-shell streaming UX without leaking a premature 200 to the
 * product detail route. `aria-busy` tells assistive tech the region is loading.
 */
export function ProductsLoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      {/* Hero band */}
      <div className="bg-anti-flash-white dark:bg-card">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      {/* Filter/summary row */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      {/* Grid — matches NPFProductGrid's breakpoints exactly */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-4 lg:px-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border">
            <Skeleton className="aspect-[5/4] w-full rounded-none" />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
