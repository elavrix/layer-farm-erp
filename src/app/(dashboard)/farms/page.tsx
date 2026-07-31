"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Home, Bird, Plus, X, Check, Trash2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Farm {
  id: string;
  name: string;
  location: string | null;
  owner: string | null;
  created_at: string;
  sheds: ShedRow[];
}

interface ShedRow {
  id: string;
  name: string;
  capacity: number;
}

// A pending shed in the "Add Farm" form (not yet saved)
interface PendingShed {
  key: number;
  name: string;
  capacity: string;
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const miniInputCls = "rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring";

export default function FarmsPage() {
  const [farms, setFarms]       = useState<Farm[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", owner: "" });
  const [error, setError]       = useState("");

  // New-farm form state
  const [form, setForm]                 = useState({ name: "", location: "", owner: "" });
  const [pendingSheds, setPendingSheds] = useState<PendingShed[]>([]);
  const [nextKey, setNextKey]           = useState(0);
  const [newShed, setNewShed]           = useState({ name: "", capacity: "" });

  // Per-existing-farm shed editing
  const [addShedForm, setAddShedForm]   = useState<Record<string, { name: string; capacity: string }>>({});
  const [shedSaving, setShedSaving]     = useState<string | null>(null);
  const [shedDeleting, setShedDeleting] = useState<string | null>(null);

  async function fetchFarms() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("farms")
      .select("id, name, location, owner, created_at, sheds(id, name, capacity)")
      .order("created_at", { ascending: true });

    if (error) { setError(error.message); setLoading(false); return; }

    const mapped: Farm[] = (data ?? []).map((f) => ({
      id:         f.id,
      name:       f.name,
      location:   f.location,
      owner:      f.owner,
      created_at: f.created_at,
      sheds:      ((f.sheds ?? []) as ShedRow[]).sort((a, b) => a.name.localeCompare(b.name)),
    }));

    setFarms(mapped);
    setLoading(false);
  }

  useEffect(() => { fetchFarms(); }, []);

  // ── Add Farm (with sheds) ─────────────────────────────────────────────────

  function addPendingShed() {
    if (!newShed.name.trim()) return;
    setPendingSheds(prev => [...prev, { key: nextKey, name: newShed.name.trim(), capacity: newShed.capacity }]);
    setNextKey(k => k + 1);
    setNewShed({ name: "", capacity: "" });
  }

  function removePendingShed(key: number) {
    setPendingSheds(prev => prev.filter(s => s.key !== key));
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    // 1. Insert farm
    const { data: farmData, error: farmErr } = await supabase
      .from("farms")
      .insert({ name: form.name.trim(), location: form.location.trim() || null, owner: form.owner.trim() || null })
      .select("id")
      .single();

    if (farmErr || !farmData) { setError(farmErr?.message ?? "Failed to save farm"); setSaving(false); return; }

    // 2. Insert all pending sheds
    if (pendingSheds.length > 0) {
      const { error: shedErr } = await supabase.from("sheds").insert(
        pendingSheds.map(s => ({
          farm_id:  farmData.id,
          name:     s.name,
          capacity: parseInt(s.capacity, 10) || 0,
        }))
      );
      if (shedErr) setError(shedErr.message);
    }

    setForm({ name: "", location: "", owner: "" });
    setPendingSheds([]);
    setNewShed({ name: "", capacity: "" });
    setShowAdd(false);
    setSaving(false);
    await fetchFarms();
  }

  // ── Edit farm ─────────────────────────────────────────────────────────────

  function handleEdit(farm: Farm) {
    setEditId(farm.id);
    setEditForm({ name: farm.name, location: farm.location ?? "", owner: farm.owner ?? "" });
  }

  async function handleSaveEdit() {
    if (!editId || !editForm.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("farms").update({
      name:     editForm.name.trim(),
      location: editForm.location.trim() || null,
      owner:    editForm.owner.trim() || null,
    }).eq("id", editId);
    if (error) setError(error.message);
    setSaving(false);
    setEditId(null);
    await fetchFarms();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this farm? All sheds and linked data will also be deleted.")) return;
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) setError(error.message);
    setDeleting(null);
    await fetchFarms();
  }

  // ── Add / delete sheds on existing farms ─────────────────────────────────

  async function handleAddShed(farmId: string) {
    const shed = addShedForm[farmId];
    if (!shed?.name?.trim()) return;
    setShedSaving(farmId);
    const supabase = createClient();
    const { error } = await supabase.from("sheds").insert({
      farm_id:  farmId,
      name:     shed.name.trim(),
      capacity: parseInt(shed.capacity ?? "0", 10) || 0,
    });
    if (error) { setError(error.message); }
    else { setAddShedForm(prev => ({ ...prev, [farmId]: { name: "", capacity: "" } })); }
    setShedSaving(null);
    await fetchFarms();
  }

  async function handleDeleteShed(shedId: string) {
    if (!confirm("Delete this shed? This cannot be undone.")) return;
    setShedDeleting(shedId);
    const supabase = createClient();
    const { error } = await supabase.from("sheds").delete().eq("id", shedId);
    if (error) setError(error.message);
    setShedDeleting(null);
    await fetchFarms();
  }

  // ── Derived totals ────────────────────────────────────────────────────────

  const totalSheds    = farms.reduce((s, f) => s + f.sheds.length, 0);
  const totalCapacity = farms.reduce((s, f) => s + f.sheds.reduce((c, sh) => c + sh.capacity, 0), 0);

  return (
    <>
      <Header title="Farms" />
      <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
            {error}
            <button className="ml-2 underline text-xs" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Farms",    value: farms.length },
            { label: "Total Sheds",    value: totalSheds },
            { label: "Total Capacity", value: totalCapacity.toLocaleString() + " birds" },
            { label: "Locations",      value: [...new Set(farms.map(f => f.location).filter(Boolean))].length },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Farms</h2>
          <button
            onClick={() => { setShowAdd(true); setPendingSheds([]); setNewShed({ name: "", capacity: "" }); setForm({ name: "", location: "", owner: "" }); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Add Farm
          </button>
        </div>

        {/* ── Add Farm Form ── */}
        {showAdd && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> New Farm
              </CardTitle>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Farm details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Farm Name *</label>
                  <input className={inputCls} placeholder="e.g. Al Rehman Farm 2" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Location</label>
                  <input className={inputCls} placeholder="e.g. Faisalabad" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Owner / Manager</label>
                  <input className={inputCls} placeholder="e.g. Manager Name" value={form.owner} onChange={e => setForm(p => ({...p, owner: e.target.value}))} />
                </div>
              </div>

              {/* Sheds section */}
              <div className="border border-border/50 rounded-lg p-3 space-y-3 bg-muted/20">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" /> Add Sheds
                  <span className="font-normal text-muted-foreground">(optional — you can add more later)</span>
                </p>

                {/* Pending sheds list */}
                {pendingSheds.length > 0 && (
                  <div className="space-y-1.5">
                    {pendingSheds.map(s => (
                      <div key={s.key} className="flex items-center justify-between rounded-md bg-background border border-border/50 px-3 py-2">
                        <span className="text-xs font-medium">{s.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">{parseInt(s.capacity, 10) ? parseInt(s.capacity, 10).toLocaleString() + " birds" : "No capacity set"}</span>
                          <button onClick={() => removePendingShed(s.key)} className="text-muted-foreground hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pl-1">
                      Total: {pendingSheds.reduce((s, sh) => s + (parseInt(sh.capacity, 10) || 0), 0).toLocaleString()} birds capacity
                    </p>
                  </div>
                )}

                {/* Add shed row */}
                <div className="flex items-center gap-2">
                  <input
                    className={`${miniInputCls} flex-1 min-w-0`}
                    placeholder="Shed name (e.g. Shed 1)"
                    value={newShed.name}
                    onChange={e => setNewShed(p => ({...p, name: e.target.value}))}
                    onKeyDown={e => e.key === "Enter" && addPendingShed()}
                  />
                  <input
                    className={`${miniInputCls} w-28`}
                    placeholder="Capacity"
                    type="number"
                    min="0"
                    value={newShed.capacity}
                    onChange={e => setNewShed(p => ({...p, capacity: e.target.value}))}
                    onKeyDown={e => e.key === "Enter" && addPendingShed()}
                  />
                  <button
                    onClick={addPendingShed}
                    disabled={!newShed.name.trim()}
                    className="flex items-center gap-1 rounded-lg border border-primary text-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add Shed
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : `Save Farm${pendingSheds.length > 0 ? ` + ${pendingSheds.length} Shed${pendingSheds.length > 1 ? "s" : ""}` : ""}`}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && <p className="text-center text-sm text-muted-foreground py-12">Loading farms…</p>}

        {/* Empty */}
        {!loading && farms.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">No farms yet.</p>
            <button onClick={() => setShowAdd(true)} className="text-xs text-primary underline">Add your first farm</button>
          </div>
        )}

        {/* Farm Cards */}
        {!loading && farms.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {farms.map((farm) => {
              const farmCapacity = farm.sheds.reduce((s, sh) => s + sh.capacity, 0);
              const shedFormVal  = addShedForm[farm.id] ?? { name: "", capacity: "" };

              return (
                <Card key={farm.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-semibold truncate">{farm.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {new Date(farm.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-400/50 text-emerald-600 shrink-0">Active</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    {farm.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{farm.location}</span>
                      </div>
                    )}

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-muted/50 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Home className="h-3.5 w-3.5" /> Sheds
                        </div>
                        <p className="text-lg font-bold">{farm.sheds.length}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Bird className="h-3.5 w-3.5" /> Total Capacity
                        </div>
                        <p className="text-lg font-bold">{farmCapacity.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">birds</p>
                      </div>
                    </div>

                    {farm.owner && (
                      <p className="text-xs text-muted-foreground">Manager: {farm.owner}</p>
                    )}

                    {/* ── Sheds list (always visible) ── */}
                    <div className="border border-border/40 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between bg-muted/40 px-3 py-2 border-b border-border/40">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5" /> Sheds
                        </span>
                        <span className="text-xs text-muted-foreground">{farmCapacity.toLocaleString()} birds total</span>
                      </div>

                      <div className="divide-y divide-border/30">
                        {farm.sheds.length === 0 && (
                          <p className="text-xs text-muted-foreground px-3 py-3 italic">No sheds yet — add one below.</p>
                        )}
                        {farm.sheds.map((shed) => (
                          <div key={shed.id} className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-medium">{shed.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {shed.capacity.toLocaleString()} birds
                              </span>
                              <button
                                onClick={() => handleDeleteShed(shed.id)}
                                disabled={shedDeleting === shed.id}
                                className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                                title="Delete shed"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add shed inline */}
                      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border/40 bg-muted/20">
                        <input
                          className={`${miniInputCls} flex-1 min-w-0`}
                          placeholder="Shed name"
                          value={shedFormVal.name}
                          onChange={e => setAddShedForm(prev => ({ ...prev, [farm.id]: { ...shedFormVal, name: e.target.value } }))}
                        />
                        <input
                          className={`${miniInputCls} w-24`}
                          placeholder="Capacity"
                          type="number"
                          min="0"
                          value={shedFormVal.capacity}
                          onChange={e => setAddShedForm(prev => ({ ...prev, [farm.id]: { ...shedFormVal, capacity: e.target.value } }))}
                        />
                        <button
                          onClick={() => handleAddShed(farm.id)}
                          disabled={shedSaving === farm.id || !shedFormVal.name.trim()}
                          className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          {shedSaving === farm.id ? "…" : "Add"}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editId === farm.id && (
                      <div className="space-y-2 border-t border-border/40 pt-3">
                        <input className={inputCls} placeholder="Farm name *" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
                        <input className={inputCls} placeholder="Location" value={editForm.location} onChange={e => setEditForm(p => ({...p, location: e.target.value}))} />
                        <input className={inputCls} placeholder="Owner / Manager" value={editForm.owner} onChange={e => setEditForm(p => ({...p, owner: e.target.value}))} />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted">Cancel</button>
                          <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
                            <Check className="h-3 w-3" /> {saving ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Farm action row */}
                    <div className="flex justify-between pt-1 border-t border-border/40">
                      <button
                        onClick={() => handleEdit(farm)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit Farm
                      </button>
                      <button
                        onClick={() => handleDelete(farm.id)}
                        disabled={deleting === farm.id}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleting === farm.id ? "Deleting…" : "Delete Farm"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
