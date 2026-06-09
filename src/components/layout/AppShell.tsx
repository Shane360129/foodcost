import { useState, type ReactNode } from "react";
import {
  Carrot,
  ClipboardList,
  Home,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Receipt,
  Settings as SettingsIcon,
  Sun,
  Truck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS, type View } from "@/lib/nav";
import { useSettings, type Theme } from "@/lib/settings";
import { cn } from "@/lib/utils";

const ICONS: Record<View, typeof Home> = {
  home: Home,
  ingredients: Carrot,
  suppliers: Truck,
  operations: Receipt,
  menus: UtensilsCrossed,
  overview: ClipboardList,
  settings: SettingsIcon,
};

function NavLinks({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  const { t } = useSettings();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.view];
        const active = view === item.view;
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2}
            />
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  const { t } = useSettings();
  return (
    <div className="flex h-full flex-col gap-6 border-r border-border bg-card/40 px-4 py-5">
      <button
        onClick={() => onNavigate("home")}
        className="px-1 text-left"
        aria-label="Home"
      >
        <Logo />
      </button>
      <NavLinks view={view} onNavigate={onNavigate} />
      <div className="mt-auto rounded-lg border border-border/70 bg-background/40 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t("nav.madeBy")}
          </span>
          <br />
          {t("app.tagline")}
        </p>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, t } = useSettings();
  const Icon = theme === "light" ? Sun : theme === "system" ? Monitor : Moon;
  const options: { value: Theme; labelKey: Parameters<typeof t>[0]; icon: typeof Sun }[] =
    [
      { value: "dark", labelKey: "set.theme.dark", icon: Moon },
      { value: "light", labelKey: "set.theme.light", icon: Sun },
      { value: "system", labelKey: "set.theme.system", icon: Monitor },
    ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("set.theme")}>
          <Icon className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(theme === opt.value && "text-primary")}
          >
            <opt.icon className="h-4 w-4" />
            {t(opt.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LangToggle() {
  const { lang, setLang } = useSettings();
  return (
    <div className="flex items-center rounded-md border border-border bg-background p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLang("zh")}
        className={cn(
          "rounded px-2 py-1 transition-colors",
          lang === "zh"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        中
      </button>
      <button
        onClick={() => setLang("en")}
        className={cn(
          "rounded px-2 py-1 transition-colors",
          lang === "en"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
    </div>
  );
}

export function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: View;
  onNavigate: (v: View) => void;
  children: ReactNode;
}) {
  const { t } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (v: View) => {
    onNavigate(v);
    setMobileOpen(false);
  };

  const currentLabel =
    NAV_ITEMS.find((n) => n.view === view)?.labelKey ?? "nav.home";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarInner view={view} onNavigate={navigate} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] animate-in slide-in-from-left duration-200">
            <div className="relative h-full">
              <SidebarInner view={view} onNavigate={navigate} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-3"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <h1 className="hidden text-sm font-semibold text-foreground lg:block">
            {t(currentLabel)}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="app-aurora min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto w-full max-w-6xl animate-fade-in px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
