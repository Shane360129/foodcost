import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { CostHealth } from "@/lib/calc";
import type { TranslationKey } from "@/i18n/translations";
import { useSettings } from "@/lib/settings";

const VARIANT: Record<CostHealth, BadgeProps["variant"]> = {
  good: "success",
  warning: "warning",
  bad: "destructive",
  unknown: "muted",
};

export function HealthBadge({ health }: { health: CostHealth }) {
  const { t } = useSettings();
  return (
    <Badge variant={VARIANT[health]}>
      {t(`metric.health.${health}` as TranslationKey)}
    </Badge>
  );
}
