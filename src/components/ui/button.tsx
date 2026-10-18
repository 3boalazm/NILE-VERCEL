import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_60%)] text-primary-foreground shadow-[0_10px_24px_-12px_rgba(0,66,110,0.6)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_30px_-14px_rgba(0,66,110,0.65)]",
        outline:
          "border-[color:var(--input)] bg-card text-foreground backdrop-blur-sm hover:bg-card/90 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        xs: "h-7 gap-1 px-3 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-4 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-7 text-base has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        // `max-lg:size-11` on the three icon sizes actually used as standalone
        // tap targets (header cart/menu/theme-toggle, sheet/dialog close) grows
        // them to a touch-friendly 44px below the desktop breakpoint, without
        // changing mouse-oriented desktop density. `icon-xs` is left alone —
        // unused today, meant for dense contexts if one shows up.
        icon: "size-11",
        "icon-xs":
          "size-7 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 in-data-[slot=button-group]:rounded-lg max-lg:size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const ctaButtonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        onLight: "bg-primary text-primary-foreground hover:bg-primary/90",
        onDark: "bg-anti-flash-white text-anti-flash-navy hover:bg-anti-flash-white/85",
        outline: "border border-foreground/20 text-foreground hover:bg-foreground/5",
      },
    },
    defaultVariants: {
      variant: "onLight",
    },
  }
)

export { Button, buttonVariants, ctaButtonVariants }
