"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Wheat, FlaskConical, Plus, X, Check, Trash2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────
interface FeedItem {
  id: string; name: string; unit: string; stock: number;
  reorder: number; supplier: string; pricePerUnit: number;
}
interface MedItem {
  id: string; name: string; qty: string; expiry: string;
}

function medStatus(expiry: string) {
  const days = Math.round((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)  return "expired";
  if (days < 30) return "expiring";
  return "ok";
}

type Tab = "eggs" | "feed" | "medicine";

// ─── Egg shed data (static / mock) ───────────────────────────
const eggSheds = [
  { shed: "Shed 1", collected: 17400, broken: 240, dirty: 360 },
  { shed: "Shed 2", collected: 8700,  broken: 120, dirty: 180 },
];
const totalSaleable = eggSheds.reduce((s, r) => s + r.collected - r.broken - r.dirty, 0);
const totalBroken   = eggSheds.reduce((s, r) => s + r.broken, 0);
const totalDirty    = eggSheds.reduce((s, r) => s + r.dirty, 0);

export default function InventoryPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("feed");
  const [loading, setLoading] = useState(true);

  // Feed state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: "", unit: "50kg bag", stock: "", reorder: "", supplier: "", pricePerUnit: "" });

  // Medicine state
  const [meds, setMeds] = useState<MedItem[]>([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", qty: "", expiry: "" });

  // ─── Fetch helpers ────────────────────────────────────────
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
      await Promise.all([fetchFeed(), fetchMeds()]);
      setLoading(false);
    }
    load();
  }, [fetchFeed, fetchMeds]);

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
          <button className={tabCls("eggs")}     onClick={() => setTab("eggs")}>🥚 Eggs</button>
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
            {tab === "eggs" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Saleable (trays)", value: Math.floor(totalSaleable / 30).toLocaleString(), img: "/eggs.png" },
                    { label: "Broken",           value: totalBroken.toLocaleString(),                    img: "/broken-egg.png" },
                    { label: "Dirty",            value: totalDirty.toLocaleString(),                     img: "/eggs.png" },
                    { label: "Total Collected",  value: eggSheds.reduce((s,r)=>s+r.collected,0).toLocaleString(), img: "/eggs.png" },
                  ].map(s => (
                    <Card key={s.label}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Image src={s.img} alt="" width={36} height={36} className="object-contain shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          <p className="text-xl font-bold">{s.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Egg Stock by Shed</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shed</TableHead>
                          <TableHead className="text-right">Collected</TableHead>
                          <TableHead className="text-right">Broken</TableHead>
                          <TableHead className="text-right">Dirty</TableHead>
                          <TableHead className="text-right">Saleable (trays)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eggSheds.map(r => {
                          const sellable = Math.floor((r.collected - r.broken - r.dirty) / 30);
                          return (
                            <TableRow key={r.shed}>
                              <TableCell className="font-medium text-xs">{r.shed}</TableCell>
                              <TableCell className="text-right text-xs">{r.collected.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-xs text-red-500">{r.broken}</TableCell>
                              <TableCell className="text-right text-xs text-amber-500">{r.dirty}</TableCell>
                              <TableCell className="text-right text-xs font-bold">{sellable.toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

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
