import { useState } from "react";
import { Toaster } from "sonner";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/features/home/HomePage";
import { IngredientsPage } from "@/features/ingredients/IngredientsPage";
import { MenusPage } from "@/features/menus/MenusPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import type { View } from "@/lib/nav";

function ThemedToaster() {
  const { theme } = useSettings();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ className: "tnum" }}
    />
  );
}

function Shell() {
  const [view, setView] = useState<View>("home");
  return (
    <>
      <AppShell view={view} onNavigate={setView}>
        {view === "home" && <HomePage onNavigate={setView} />}
        {view === "ingredients" && <IngredientsPage />}
        {view === "menus" && <MenusPage />}
        {view === "overview" && <OverviewPage />}
        {view === "settings" && <SettingsPage />}
      </AppShell>
      <ThemedToaster />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
