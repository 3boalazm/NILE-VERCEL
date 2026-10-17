import { cn } from "@/lib/utils"

/**
 * backdrop-blur can't itself be gradiented, so this stacks 4 layers of
 * increasing blur strength, each mask-image'd to fade out at a different
 * height — near the bottom all 4 overlap (heaviest), near the top only the
 * lightest survives before fading to fully sharp. Used behind the text
 * overlay on category tiles and product cards instead of one flat
 * backdrop-blur-xl, which reads as a hard seam where sharp image meets
 * fully-blurred glass.
 */
export function ProgressiveBlur({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0", className)}>
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 backdrop-blur-[5px]"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 50%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 backdrop-blur-[10px]"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 32%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 32%)",
        }}
      />
      <div
        className="absolute inset-0 backdrop-blur-[18px]"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 16%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 16%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-transparent" />
    </div>
  )
}
