"use client"

/**
 * F-25 — the listing's sort control.
 *
 * The server route already sorted by `?sort=asc|desc`, but nothing in the UI
 * ever exposed it: the dictionary keys sat unused and visitors got one fixed
 * order. This control is a plain GET form so it works with JavaScript
 * disabled (select + Apply button submits the query string), and enhances
 * itself when JS is available (changing the select submits immediately).
 * The hidden inputs carry the active filters/search so sorting never drops
 * the user's current view — losing a filter on sort is exactly the kind of
 * small trap that reads as "the site is broken".
 */
export function SortControl({
  action,
  sort,
  label,
  applyLabel,
  options,
  preserve,
}: {
  action: string
  sort: string
  label: string
  applyLabel: string
  options: { value: string; label: string }[]
  /** [name, value] pairs of the other active query params to carry over. */
  preserve: [string, string][]
}) {
  return (
    <form method="GET" action={action} className="flex items-center gap-2">
      {preserve.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label
        htmlFor="product-sort"
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <select
        id="product-sort"
        name="sort"
        defaultValue={sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-11 rounded-full border border-border bg-card px-4 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-9"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* The no-JS path: with scripting off, requestSubmit never runs, so the
          change is applied by this button instead. Hidden from the JS path
          visually? No — kept visible and honest: it also confirms intent. */}
      <button
        type="submit"
        /* `scripting` media query: with JS on, the select auto-submits and a
           second Apply button is just noise; with JS off, this button IS the
           control. So it only renders for the no-JS case. */
        className="h-11 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [@media(scripting:enabled)]:hidden lg:h-9"
      >
        {applyLabel}
      </button>
    </form>
  )
}
