import type { TierKey } from "@/lib/tiers";
import { isHT } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: TierKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  const ht = isHT(tier);
  const sizes = {
    sm: "h-6 min-w-10 text-[10px] px-1.5",
    md: "h-7 min-w-12 text-xs px-2",
    lg: "h-9 min-w-14 text-sm px-2.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wider border",
        ht
          ? "bg-tier-ht text-tier-ht-foreground border-tier-ht/60 shadow-[0_0_12px_-4px_var(--tier-ht)]"
          : "bg-tier-lt text-tier-lt-foreground border-tier-lt/60 shadow-[0_0_12px_-4px_var(--tier-lt)]",
        sizes[size],
        className,
      )}
      title={ht ? "High Tier" : "Low Tier"}
    >
      {tier}
    </span>
  );
}

export function EmptyTierDot({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-dashed border-border/70 text-muted-foreground/60 text-xs",
        px,
      )}
    >
      –
    </span>
  );
}
