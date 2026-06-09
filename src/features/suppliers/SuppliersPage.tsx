import { useMemo, useState } from "react";
import { Pencil, Phone, Plus, Search, Trash2, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SupplierForm } from "./SupplierForm";
import { useIngredients, usePurchases, useSuppliers } from "@/hooks/useData";
import { deleteSupplier } from "@/lib/db";
import { loadSeedData } from "@/lib/seed";
import { useSettings } from "@/lib/settings";
import type { Supplier } from "@/types";

export function SuppliersPage() {
  const { t, lang } = useSettings();
  const suppliers = useSuppliers();
  const ingredients = useIngredients();
  const purchases = usePurchases();

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  const counts = useMemo(() => {
    const ing = new Map<number, number>();
    const pur = new Map<number, number>();
    for (const i of ingredients ?? []) {
      if (i.supplierId != null)
        ing.set(i.supplierId, (ing.get(i.supplierId) ?? 0) + 1);
    }
    for (const p of purchases ?? []) {
      if (p.supplierId != null)
        pur.set(p.supplierId, (pur.get(p.supplierId) ?? 0) + 1);
    }
    return { ing, pur };
  }, [ingredients, purchases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (suppliers ?? [])
      .filter((s) =>
        q
          ? s.name.toLowerCase().includes(q) ||
            (s.contact ?? "").toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, lang === "zh" ? "zh-Hant" : "en"),
      );
  }, [suppliers, query, lang]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSeed = async () => {
    const res = await loadSeedData("suppliers");
    toast.success(
      res.suppliersAdded > 0
        ? t("sup.seedLoaded", { n: res.suppliersAdded })
        : t("ing.seedNone"),
    );
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    await deleteSupplier(toDelete.id);
    toast.success(t("toast.deleted"));
  };

  const isLoading = suppliers === undefined;
  const isEmpty = !isLoading && (suppliers?.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title={t("sup.title")}
        subtitle={t("sup.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={handleSeed}>
              <Truck className="h-4 w-4" />
              {t("sup.loadSeed")}
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              {t("sup.add")}
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Truck}
          title={t("sup.empty")}
          description={t("sup.emptyDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleSeed}>
                <Truck className="h-4 w-4" />
                {t("sup.loadSeed")}
              </Button>
              <Button variant="outline" onClick={openAdd}>
                <Plus className="h-4 w-4" />
                {t("sup.add")}
              </Button>
            </div>
          }
        />
      ) : (
        <Card>
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("sup.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <span className="hidden whitespace-nowrap text-sm text-muted-foreground sm:inline">
              {t("sup.count", { n: filtered.length })}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.contact")}</TableHead>
                <TableHead>{t("common.note")}</TableHead>
                <TableHead>{t("nav.ingredients")}</TableHead>
                <TableHead className="w-[88px] text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{s.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm text-muted-foreground">
                      {s.contact && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {s.contact}
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {s.phone}
                        </div>
                      )}
                      {!s.contact && !s.phone && "—"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                    {s.note || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">
                        {t("sup.linkedItems", { n: counts.ing.get(s.id!) ?? 0 })}
                      </Badge>
                      <Badge variant="muted">
                        {t("sup.purchaseCount", {
                          n: counts.pur.get(s.id!) ?? 0,
                        })}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(s)}
                        aria-label={t("common.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(s)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <SupplierForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("common.delete")}
        description={`${t("common.deleteConfirm", { name: toDelete?.name ?? "" })} ${t("sup.deleteWarn")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
