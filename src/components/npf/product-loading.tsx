import { Skeleton } from "@/components/ui/skeleton"

/**
 * F-22 — streaming placeholder for the product detail page.
 *
 * Originally a segment-level `loading.tsx`; moved here deliberately. A
 * segment loading boundary force-flushes the shell BEFORE the page resolves,
 * which locks in HTTP 200 for every request — turning a notFound() miss into
 * a soft-404 (status 200 + error shell inline), the exact defect class F-54
 * flags. The skeleton now renders as the Suspense fallback AROUND the slow
 * below-the-fold data (category + related products), inside the page body:
 * the existence check resolves first (real 404 pre-flush), then the product
 * shell paints and the slow sections stream in behind this skeleton.
 * `aria-busy` tells assistive tech the region is still loading.
 */
export function ProductLoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Media column */}
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-[5/4] w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-4/5 max-w-full" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          {/* Buy box */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border p-5">
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>

      {/* Details/accordion band */}
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-16 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}
