"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { Package, Wheat, FlaskConical, Plus, X, Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────
interface FeedItem {
  id: string; name: string; unit: string; stock: number;
  reorder: number; supplier: string; pricePerUnit: number;
}
interface MedItem {
  id: string; name: string; qty: string; expiry: string;
}
interface ShedEggRow {
  shed: string;
  collected: number;
  broken: number;
  dirty: number;
  goodEggs: number;
}

function medStatus(expiry: string) {
  const days = Math.round((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)  return "expired";
  if (days < 30) return "expiring";
  return "ok";
}

type Tab = "eggs" | "feed" | "medicine";

export default function InventoryPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("eggs");
  const [loading, setLoading] = useState(true);

  // Feed state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: "", unit: "50kg bag", stock: "", reorder: "", supplier: "", pricePerUnit: "" });

  // Medicine state
  const [meds, setMeds] = useState<MedItem[]>([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", qty: "", expiry: "" });

  // Egg stock state
  const [shedRows, setShedRows]     = useState<ShedEggRow[]>([]);
  const [totalSold, setTotalSold]   = useState(0);

  // ─── Fetch helpers ────────────────────────────────────────

  const fetchEggs = useCallback(async () => {
    // All-time good eggs per shed
    const { data: entries } = await supabase
      .from("daily_entries")
      .select("shed_id, eggs_collected, eggs_broken, eggs_dirty, sheds(name)");

    // All-time eggs sold (trays × 30)
    const { data: salesData } = await supabase
      .from("sales")
      .select("trays");

    const sold = (salesData ?? []).reduce((s, r) => s + (r.trays ?? 0) * 30, 0);
    setTotalSold(sold);

    // Group by shed
    const map: Record<string, ShedEggRow> = {};
    for (const e of entries ?? []) {
      const shedName = (e.sheds as unknown as { name: string } | null)?.name ?? "Unknown";
      if (!map[shedName]) map[shedName] = { shed: shedName, collected: 0, broken: 0, dirty: 0, goodEggs: 0 };
      map[shedName].collected += e.eggs_collected ?? 0;
      map[shedName].broken    += e.eggs_broken   ?? 0;
      map[shedName].dirty     += e.eggs_dirty    ?? 0;
    }
    Object.values(map).forEach(r => { r.goodEggs = r.collected - r.broken - r.dirty; });
    setShedRows(Object.values(map).sort((a, b) => a.shed.localeCompare(b.shed)));
  }, [supabase]);

  const fetchFeed = useCallback(async () => {
    const { data } = await supabase
      .from("inventory_feed")
      .select("id, name, unit, stock, reorder_level, price_per_unit, supplier")
      .order("name");
    if (data) {
      setFeed(
        data.map(r => ({
          id:           r.id,
          name:         r.name,
          unit:         r.unit,
          stock:        r.stock,
          reorder:      r.reorder_level,
          pricePerUnit: r.price_per_unit,
          supplier:     r.supplier ?? "",
        }))
      );
    }
  }, [supabase]);

  const fetchMeds = useCallback(async () => {
    const { data } = await supabase
      .from("inventory_medicine")
      .select("id, name, quantity, expiry_date")
      .order("name");
    if (data) {
      setMeds(
        data.map(r => ({
          id:     r.id,
          name:   r.name,
          qty:    r.quantity,
          expiry: r.expiry_date,
        }))
      );
    }
  }, [supabase]);

  // ─── Initial load ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchEggs(), fetchFeed(), fetchMeds()]);
      setLoading(false);
    }
    load();
  }, [fetchEggs, fetchFeed, fetchMeds]);

  // ─── CRUD ─────────────────────────────────────────────────
  async function addFeed() {
    if (!newFeed.name || !newFeed.stock) return;
    await supabase.from("inventory_feed").insert({
      name:           newFeed.name,
      unit:           newFeed.unit,
      stock:          +newFeed.stock,
      reorder_level:  +newFeed.reorder || 0,
      price_per_unit: +newFeed.pricePerUnit || 0,
      supplier:       newFeed.supplier,
    });
    await fetchFeed();
    setNewFeed({ name: "", unit: "50kg bag", stock: "", reorder: "", supplier: "", pricePerUnit: "" });
    setShowAddFeed(false);
  }

  async function deleteFeed(id: string) {
    await supabase.from("inventory_feed").delete().eq("id", id);
    await fetchFeed();
  }

  async function addMed() {
    if (!newMed.name || !newMed.qty || !newMed.expiry) return;
    await supabase.from("inventory_medicine").insert({
      name:        newMed.name,
      quantity:    newMed.qty,
      expiry_date: newMed.expiry, // already YYYY-MM-DD from the date input
    });
    await fetchMeds();
    setNewMed({ name: "", qty: "", expiry: "" });
    setShowAddMed(false);
  }

  async function deleteMed(id: string) {
    await supabase.from("inventory_medicine").delete().eq("id", id);
    await fetchMeds();
  }

  // ─── Shared styles ────────────────────────────────────────
  const tabCls = (t: Tab) =>
    `px-4 py-2 text-xs font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <>
      <Header title="Inventory" />
      <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">

        {/* Tab Bar */}
        <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
          <button className={tabCls("eggs")}     onClick={() => setTab("eggs")}>🥚 Egg Stock</button>
          <button className={tabCls("feed")}     onClick={() => setTab("feed")}>🌾 Feed</button>
          <button className={tabCls("medicine")} onClick={() => setTab("medicine")}>💊 Medicine</button>
        </div>

        {/* Loading state */}
        {loading && (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        )}

        {!loading && (
          <>
            {/* ══ EGGS ══ */}
            {tab === "eggs" && (() => {
              const totalGood  = shedRows.reduce((s, r) => s + r.goodEggs, 0);
              const inStock    = Math.max(0, totalGood - totalSold);
              const inTrays    = Math.floor(inStock / 30);
              const inPattis   = Math.floor(inStock / 360);
              const loose      = inStock % 30;
              const eggRate    = inTrays; // display trays as primary unit

              return (
                <div className="space-y-4">
                  {/* Stock summary banner */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-3">
                      <Image src="/eggs.png" alt="eggs" width={48} height={48} className="object-contain" />
                      <div>
                        <p className="text-xs text-muted-foreground">Current Egg Stock</p>
                        <p className="text-3xl font-bold">{inStock.toLocaleString()} <span className="text-base font-normal text-muted-foreground">eggs</span></p>
                      </div>
                    </div>
                    <div className="flex gap-6 flex-wrap text-sm">
                      <div><p className="text-xs text-muted-foreground">Patties</p><p className="text-xl font-bold">{inPattis.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Trays</p><p className="text-xl font-bold">{inTrays.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Loose eggs</p><p className="text-xl font-bold">{loose}</p></div>
                    </div>
                  </div>

                  {/* How it's calculated */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Image src="/eggs.png" alt="" width={32} height={32} className="object-contain shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Total Collected (good)</p>
                          <p className="text-lg font-bold">{totalGood.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">all time, excl. broken & dirty</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Image src="/broken-egg.png" alt="" width={32} height={32} className="object-contain shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Total Sold</p>
                          <p className="text-lg font-bold">{totalSold.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">all time, from sales records</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/30">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Image src="/eggs.png" alt="" width={32} height={32} className="object-contain shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">In Storage Now</p>
                          <p className="text-lg font-bold text-primary">{inStock.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">collected − sold</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Per-shed breakdown */}
                  {shedRows.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Production by Shed (all time)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Shed</TableHead>
                              <TableHead className="text-right">Collected</TableHead>
                              <TableHead className="text-right">Broken</TableHead>
                              <TableHead className="text-right">Dirty</TableHead>
                              <TableHead className="text-right">Good Eggs</TableHead>
                              <TableHead className="text-right">Trays</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shedRows.map(r => (
                              <TableRow key={r.shed}>
                                <TableCell className="font-medium text-xs">{r.shed}</TableCell>
                                <TableCell className="text-right text-xs">{r.collected.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-xs text-red-500">{r.broken.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-xs text-amber-500">{r.dirty.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-xs font-semibold">{r.goodEggs.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-xs font-bold">{Math.floor(r.goodEggs / 30).toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {shedRows.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No egg data yet. Enter daily collections in <a href="/daily-ops" className="text-primary underline">Daily Operations</a>.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ FEED ══ */}
            {tab === "feed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{feed.length} item{feed.length !== 1 ? "s" : ""} in stock</p>
                  <button onClick={() => setShowAddFeed(true)} className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" /> Add Feed Item
                  </button>
                </div>

                {/* Add Feed Form */}
                {showAddFeed && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Wheat className="h-4 w-4" /> New Feed Item</CardTitle>
                      <button onClick={() => setShowAddFeed(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <label className="text-xs font-medium text-muted-foreground">Feed Name *</label>
                        <input className={inputCls} placeholder="e.g. Layer Mash" value={newFeed.name} onChange={e => setNewFeed(p => ({...p, name: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Unit</label>
                        <select className={inputCls} value={newFeed.unit} onChange={e => setNewFeed(p => ({...p, unit: e.target.value}))}>
                          <option>50kg bag</option><option>25kg bag</option><option>kg</option><option>litre</option><option>piece</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Qty in Stock *</label>
                        <input className={inputCls} type="number" placeholder="0" value={newFeed.stock} onChange={e => setNewFeed(p => ({...p, stock: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Reorder Level</label>
                        <input className={inputCls} type="number" placeholder="0" value={newFeed.reorder} onChange={e => setNewFeed(p => ({...p, reorder: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Price / Unit (₨)</label>
                        <input className={inputCls} type="number" placeholder="0" value={newFeed.pricePerUnit} onChange={e => setNewFeed(p => ({...p, pricePerUnit: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Supplier</label>
                        <input className={inputCls} placeholder="Supplier name" value={newFeed.supplier} onChange={e => setNewFeed(p => ({...p, supplier: e.target.value}))} />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
                        <button onClick={() => setShowAddFeed(false)} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={addFeed} className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90">
                          <Check className="h-3.5 w-3.5" /> Save Item
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feed Type</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">In Stock</TableHead>
                          <TableHead className="text-right">Reorder At</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Value (₨)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feed.map(f => {
                          const low = f.stock <= f.reorder;
                          return (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium text-xs">{f.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{f.unit}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">{f.stock}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{f.reorder}</TableCell>
                              <TableCell className="text-xs">{f.supplier || "—"}</TableCell>
                              <TableCell className="text-right text-xs font-mono">{f.pricePerUnit ? (f.stock * f.pricePerUnit).toLocaleString() : "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={low ? "border-red-400/50 text-red-500" : "border-emerald-400/50 text-emerald-600"}>
                                  {low ? "Low Stock" : "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button onClick={() => deleteFeed(f.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {feed.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No feed items. Click "Add Feed Item" to get started.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══ MEDICINE ══ */}
            {tab === "medicine" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{meds.length} item{meds.length !== 1 ? "s" : ""}</p>
                  <button onClick={() => setShowAddMed(true)} className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" /> Add Medicine
                  </button>
                </div>

                {/* Add Medicine Form */}
                {showAddMed && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" /> New Medicine / Vaccine</CardTitle>
                      <button onClick={() => setShowAddMed(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-medium text-muted-foreground">Name *</label>
                        <input className={inputCls} placeholder="e.g. Newcastle Vaccine" value={newMed.name} onChange={e => setNewMed(p => ({...p, name: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                        <input className={inputCls} placeholder="e.g. 500 doses" value={newMed.qty} onChange={e => setNewMed(p => ({...p, qty: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Expiry Date *</label>
                        <input className={inputCls} type="date" value={newMed.expiry} onChange={e => setNewMed(p => ({...p, expiry: e.target.value}))} />
                      </div>
                      <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                        <button onClick={() => setShowAddMed(false)} className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={addMed} className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90">
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meds.map(m => {
                          const status = medStatus(m.expiry);
                          return (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium text-xs">{m.name}</TableCell>
                              <TableCell className="text-xs">{m.qty}</TableCell>
                              <TableCell className="text-xs font-mono">{m.expiry}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  status === "ok"       ? "border-emerald-400/50 text-emerald-600"
                                  : status === "expiring" ? "border-amber-400/50 text-amber-500"
                                  : "border-red-400/50 text-red-500"
                                }>
                                  {status === "ok" ? "OK" : status === "expiring" ? "Expiring Soon" : "Expired"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button onClick={() => deleteMed(m.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {meds.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No medicines. Click "Add Medicine" to get started.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Summary badges */}
                <div className="flex gap-3 flex-wrap">
                  {["ok","expiring","expired"].map(s => {
                    const count = meds.filter(m => medStatus(m.expiry) === s).length;
                    return count > 0 ? (
                      <div key={s} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                        s === "ok" ? "border-emerald-400/50 text-emerald-600" : s === "expiring" ? "border-amber-400/50 text-amber-500" : "border-red-400/50 text-red-500"
                      }`}>
                        {count} {s === "ok" ? "OK" : s === "expiring" ? "Expiring Soon" : "Expired"}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Package icon used to suppress unused import warning */}
        <span className="hidden"><Package /></span>
      </main>
    </>
  );
}
