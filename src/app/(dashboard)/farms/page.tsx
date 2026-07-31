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
  shed_count?: number;
  total_capacity?: number;
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function FarmsPage() {
  const [farms, setFarms]         = useState<Farm[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", location: "", owner: "" });
  const [form, setForm]           = useState({ name: "", location: "", owner: "" });
  const [error, setError]         = useState("");

  async function fetchFarms() {
    const supabase = createClient();
    // Fetch farms with shed count and total capacity via join
    const { data, error } = await supabase
      .from("farms")
      .select(`
        id, name, location, owner, created_at,
        sheds(id, capacity)
      `)
      .order("created_at", { ascending: true });

    if (error) { setError(error.message); return; }

    const mapped: Farm[] = (data ?? []).map((f) => ({
      id:             f.id,
      name:           f.name,
      location:       f.location,
      owner:          f.owner,
      created_at:     f.created_at,
      shed_count:     f.sheds?.length ?? 0,
      total_capacity: (f.sheds ?? []).reduce((s: number, sh: { capacity: number }) => s + (sh.capacity ?? 0), 0),
    }));

    setFarms(mapped);
    setLoading(false);
  }

  useEffect(() => { fetchFarms(); }, []);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("farms").insert({
      name:     form.name.trim(),
      location: form.location.trim() || null,
      owner:    form.owner.trim() || null,
    });
    if (error) { setError(error.message); setSaving(false); return; }
    setForm({ name: "", location: "", owner: "" });
    setShowAdd(false);
    setSaving(false);
    await fetchFarms();
  }

  async function handleEdit(farm: Farm) {
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
    if (!confirm("Delete this farm? All sheds and data linked to it will also be deleted.")) return;
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) setError(error.message);
    setDeleting(null);
    await fetchFarms();
  }

  const totalCapacity = farms.reduce((s, f) => s + (f.total_capacity ?? 0), 0);
  const totalSheds    = farms.reduce((s, f) => s + (f.shed_count ?? 0), 0);

  return (
    <>
      <Header title="Farms" />
      <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
            {error} <button className="ml-2 underline text-xs" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Farms",    value: farms.length },
            { label: "Total Sheds",    value: totalSheds },
            { label: "Total Capacity", value: totalCapacity.toLocaleString() },
            { label: "Locations",      value: [...new Set(farms.map(f => f.location).filter(Boolean))].length },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Farms</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Add Farm
          </button>
        </div>

        {/* Add Farm Form */}
        {showAdd && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> New Farm
              </CardTitle>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Farm"}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {farms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{farm.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{new Date(farm.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-400/50 text-emerald-600 shrink-0">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {farm.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{farm.location}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted/50 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Home className="h-3.5 w-3.5" /> Sheds
                      </div>
                      <p className="text-sm font-semibold">{farm.shed_count}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Bird className="h-3.5 w-3.5" /> Capacity
                      </div>
                      <p className="text-sm font-semibold">{(farm.total_capacity ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {farm.owner && (
                    <p className="text-xs text-muted-foreground">Manager: {farm.owner}</p>
                  )}
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

                  <div className="flex justify-between pt-1 border-t border-border/40">
                    <button
                      onClick={() => handleEdit(farm)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(farm.id)}
                      disabled={deleting === farm.id}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting === farm.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
