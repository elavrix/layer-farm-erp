"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Bird, Plus, X, Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Farm {
  name: string;
}

interface Shed {
  id: string;
  name: string;
  capacity: number;
  farms: Farm | null;
}

interface Flock {
  id: string;
  shed_id: string;
  batch_code: string;
  breed: string | null;
  birds_count: number;
  placement_date: string;
  status: string;
  created_at: string;
  sheds: Shed | null;
}

interface ShedOption {
  id: string;
  name: string;
  farm_name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ageInWeeks(placementDate: string): number {
  const placed = new Date(placementDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.max(0, Math.floor((now.getTime() - placed.getTime()) / msPerWeek));
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const statusOptions = ["active", "retiring", "retired"] as const;
type FlockStatus = (typeof statusOptions)[number];

function statusBadgeClass(status: string) {
  if (status === "active")
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
  if (status === "retiring")
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400";
}

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "retiring") return "Retiring";
  return "Retired";
}

// ── Default form state ────────────────────────────────────────────────────────

const defaultForm = {
  batch_code: "",
  breed: "",
  shed_id: "",
  birds_count: "",
  placement_date: "",
  status: "active" as FlockStatus,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FlocksPage() {
  const [flocks, setFlocks]     = useState<Flock[]>([]);
  const [sheds, setSheds]       = useState<ShedOption[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ ...defaultForm });

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchFlocks() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("flocks")
      .select("*, sheds(id, name, capacity, farms(name))")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setFlocks((data ?? []) as Flock[]);
    }
    setLoading(false);
  }

  async function fetchSheds() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sheds")
      .select("id, name, farms(name)")
      .order("name", { ascending: true });

    if (!error && data) {
      const mapped: ShedOption[] = data.map((s: { id: string; name: string; farms: { name: string }[] | { name: string } | null }) => ({
        id: s.id,
        name: s.name,
        farm_name: Array.isArray(s.farms) ? (s.farms[0]?.name ?? "") : (s.farms?.name ?? ""),
      }));
      setSheds(mapped);
    }
  }

  useEffect(() => {
    fetchFlocks();
    fetchSheds();
  }, []);

  // ── Add ──────────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (!form.batch_code.trim() || !form.shed_id || !form.placement_date) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("flocks").insert({
      batch_code:     form.batch_code.trim(),
      breed:          form.breed.trim() || null,
      shed_id:        form.shed_id,
      birds_count:    parseInt(form.birds_count, 10) || 0,
      placement_date: form.placement_date,
      status:         form.status,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setForm({ ...defaultForm });
    setShowAdd(false);
    setSaving(false);
    await fetchFlocks();
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string, batchCode: string) {
    if (!confirm(`Delete flock "${batchCode}"? This cannot be undone.`)) return;
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("flocks").delete().eq("id", id);
    if (error) setError(error.message);
    setDeleting(null);
    await fetchFlocks();
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const activeFlocks  = flocks.filter((f) => f.status === "active").length;
  const totalBirds    = flocks.reduce((s, f) => s + (f.birds_count ?? 0), 0);
  const avgAgeWeeks   = flocks.length
    ? Math.round(flocks.reduce((s, f) => s + ageInWeeks(f.placement_date), 0) / flocks.length)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Header title="Flocks" />
      <main className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button className="ml-4 text-xs underline" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Active Flocks",   value: loading ? "—" : activeFlocks.toString() },
            { label: "Total Birds",     value: loading ? "—" : totalBirds.toLocaleString() },
            { label: "Avg Age (weeks)", value: loading ? "—" : avgAgeWeeks.toString() },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-20" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Flock Batches</h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "Add Flock"}
          </button>
        </div>

        {/* Add Flock form */}
        {showAdd && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bird className="h-4 w-4" /> New Flock
              </CardTitle>
              <button onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

              {/* Batch code */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Batch Code *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. FL-2025-01"
                  value={form.batch_code}
                  onChange={(e) => setForm((p) => ({ ...p, batch_code: e.target.value }))}
                />
              </div>

              {/* Breed */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Breed</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Hy-Line Brown, Lohmann LSL, Babcock B-380"
                  value={form.breed}
                  onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                />
              </div>

              {/* Shed */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Shed *</label>
                <select
                  className={inputCls}
                  value={form.shed_id}
                  onChange={(e) => setForm((p) => ({ ...p, shed_id: e.target.value }))}
                >
                  <option value="">Select a shed…</option>
                  {sheds.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.farm_name ? `${s.farm_name} — ` : ""}{s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bird count */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bird Count *</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  placeholder="e.g. 12000"
                  value={form.birds_count}
                  onChange={(e) => setForm((p) => ({ ...p, birds_count: e.target.value }))}
                />
              </div>

              {/* Placement date */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Placement Date *</label>
                <input
                  className={inputCls}
                  type="date"
                  value={form.placement_date}
                  onChange={(e) => setForm((p) => ({ ...p, placement_date: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as FlockStatus }))
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowAdd(false); setForm({ ...defaultForm }); }}
                  className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !form.batch_code.trim() || !form.shed_id || !form.placement_date}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save Flock"}
                </button>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bird className="h-4 w-4 text-primary" />
              Flock Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">

            {/* Loading skeleton */}
            {loading && (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && flocks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Bird className="h-10 w-10 opacity-30" />
                <p className="text-sm">No flock batches yet.</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-xs text-primary underline"
                >
                  Add your first flock
                </button>
              </div>
            )}

            {/* Data table */}
            {!loading && flocks.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Placement Date</TableHead>
                    <TableHead className="text-right">Age (wks)</TableHead>
                    <TableHead className="text-right">Bird Count</TableHead>
                    <TableHead>Shed</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead className="text-right">Prod %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flocks.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs font-semibold">{f.batch_code}</TableCell>
                      <TableCell className="text-xs">{f.breed ?? "—"}</TableCell>
                      <TableCell className="text-xs">{f.placement_date}</TableCell>
                      <TableCell className="text-right text-xs">{ageInWeeks(f.placement_date)}</TableCell>
                      <TableCell className="text-right text-xs">{(f.birds_count ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{f.sheds?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{f.sheds?.farms?.name ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(f.status)}>
                          {statusLabel(f.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleDelete(f.id, f.batch_code)}
                          disabled={deleting === f.id}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Delete flock"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deleting === f.id ? "…" : "Delete"}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

          </CardContent>
        </Card>

      </main>
    </>
  );
}
