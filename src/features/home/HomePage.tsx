import {
  ArrowRight,
  Calculator,
  Carrot,
  ChefHat,
  ClipboardList,
  Database,
  FileDown,
  Quote,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FOOD_COST_TARGET } from "@/lib/calc";
import { loadSeedData } from "@/lib/seed";
import { useSettings } from "@/lib/settings";
import type { View } from "@/lib/nav";
import type { TranslationKey } from "@/i18n/translations";

const FEATURES: {
  icon: typeof Carrot;
  title: TranslationKey;
  desc: TranslationKey;
}[] = [
  { icon: Carrot, title: "home.feature1Title", desc: "home.feature1Desc" },
  { icon: Truck, title: "home.feature8Title", desc: "home.feature8Desc" },
  { icon: Calculator, title: "home.feature2Title", desc: "home.feature2Desc" },
  { icon: Wand2, title: "home.feature3Title", desc: "home.feature3Desc" },
  { icon: Receipt, title: "home.feature7Title", desc: "home.feature7Desc" },
  { icon: ClipboardList, title: "home.feature4Title", desc: "home.feature4Desc" },
  { icon: FileDown, title: "home.feature5Title", desc: "home.feature5Desc" },
  { icon: Database, title: "home.feature6Title", desc: "home.feature6Desc" },
];

export function HomePage({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { t } = useSettings();

  const handleStart = async () => {
    await loadSeedData("all");
    toast.success(t("toast.sampleLoaded"));
    onNavigate("overview");
  };

  const marginMin = Math.round((1 - FOOD_COST_TARGET.max) * 100);
  const marginMax = Math.round((1 - FOOD_COST_TARGET.min) * 100);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/50 px-6 py-12 sm:px-10 sm:py-16">
        <div className="app-aurora pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.heroBadge")}
          </span>
          <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={handleStart}>
              <Sparkles className="h-4 w-4" />
              {t("home.ctaStart")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("ingredients")}
            >
              {t("home.ctaIngredients")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Story — from the kitchen to software */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="relative overflow-hidden p-7 sm:p-9">
          <div className="absolute right-6 top-6 text-primary/15">
            <Quote className="h-16 w-16" />
          </div>
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <ChefHat className="h-4 w-4" />
              {t("home.storyTitle")}
            </div>
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {t("home.storyP1")}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t("home.storyP2")}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t("home.storyP3")}
            </p>
            <p className="pt-2 text-sm font-semibold text-foreground/80">
              {t("home.storySign")}
            </p>
          </div>
        </Card>

        {/* Benchmarks */}
        <Card className="flex flex-col justify-center gap-6 p-7 sm:p-9">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("home.benchTitle")}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="tnum text-4xl font-extrabold text-primary">
                {Math.round(FOOD_COST_TARGET.min * 100)}–
                {Math.round(FOOD_COST_TARGET.max * 100)}%
              </span>
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {t("home.benchFoodCost")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("home.benchFoodCostNote")}
            </div>
          </div>
          <div className="h-px bg-border" />
          <div>
            <div className="tnum text-4xl font-extrabold text-foreground">
              {marginMin}–{marginMax}%
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {t("home.benchMargin")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("home.benchMarginNote")}
            </div>
          </div>
        </Card>
      </section>

      {/* Features */}
      <section>
        <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground">
          {t("home.featuresTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-5 transition-colors hover:border-primary/40">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{t(f.title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(f.desc)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section>
        <Card className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-success/12 text-success">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {t("home.privacyTitle")}
              </h3>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {t("home.privacyDesc")}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => onNavigate("menus")}>
            {t("home.ctaMenus")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </section>
    </div>
  );
}
