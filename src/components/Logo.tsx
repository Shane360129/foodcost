import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

/** App wordmark + glyph. `compact` shows just the glyph. */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm ring-1 ring-white/10">
        <ChefHat className="h-5 w-5" strokeWidth={2.25} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">FoodCost</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Menu Costing
          </div>
        </div>
      )}
    </div>
  );
}
