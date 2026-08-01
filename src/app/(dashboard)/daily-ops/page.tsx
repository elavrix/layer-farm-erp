"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EggQuantityInput } from "@/components/ui/EggQuantityInput";
import { ClipboardList, Save, Trash2, History, Filter } from "lucide-react";

// Helper: convert total eggs → patti / tray / loose display string
function eggLabel(totalEggs: number) {
  const pattis = Math.floor(totalEggs / 360);
  const rem    = totalEggs % 360;
  const trays  = Math.floor(rem / 30);
  const loose  = rem % 30;
  const parts  = [];
  if (pattis) parts.push(`${pattis}P`);
  if (trays)  parts.push(`${trays}T`);
  if (loose)  parts.push(`${loose}L`);
  return parts.length ? parts.join(" + ") : "0";
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

interface Shed {
  id: string;
  name: string;
  capacity: number;
}

interface DailyEntry {
  id: string;
  shed_id: string;
  shed_name?: string;
  entry_date: string;
  eggs_collected: number;
  eggs_broken: number;
  eggs_dirty: number;
  mortality: number;
  feed_used: number;
  notes: string | null;
}

// Group entries by date for the log view
function groupByDate(entries: DailyEntry[]) {
  const map: Record<string, DailyEntry[]> = {};
  entries.forEach((e) => {
    if (!map[e.entry_date]) map[e.entry_date] = [];
    map[e.entry_date].push(e);
  });
  // Return sorted newest first
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

export default function DailyOpsPage() {
  const supabase = createClient();

  // ── shared data ───────────────────────────────────────────────
  const [sheds,   setSheds]   = useState<Shed[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── tabs ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<"entry" | "log">("entry");

  // ── entry form ────────────────────────────────────────────────
  const [shedId,    setShedId]    = useState("");
  const [entryDate, setEntryDate] = useState(todayISO());
  const [mortality, setMortality] = useState("");
  const [feedUsed,  setFeedUsed]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [eggsCollected, setEggsCollected] = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [brokenEggs,    setBrokenEggs]    = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [dirtyEggs,     setDirtyEggs]     = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const goodEggs = eggsCollected.totalEggs - brokenEggs.totalEggs - dirtyEggs.totalEggs;

  // ── log ───────────────────────────────────────────────────────
  const [allEntries,  setAllEntries]  = useState<DailyEntry[]>([]);
  const [logLoading,  setLogLoading]  = useState(false);
  const [filterShed,  setFilterShed]  = useState("all");
  const [filterFrom,  setFilterFrom]  = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [filterTo, setFilterTo] = useState(todayISO());

  // ── fetch sheds once ─────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("sheds")
      .select("id, name, capacity")
      .order("name")
      .then(({ data }) => {
        const list = data ?? [];
        setSheds(list);
        if (list.length > 0) setShedId(list[0].id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fetch all entries (log) ───────────────────────────────────
  const fetchLog = useCallback(async () => {
    setLogLoading(true);
    let query = supabase
      .from("daily_entries")
      .select("id, shed_id, entry_date, eggs_collected, eggs_broken, eggs_dirty, mortality, feed_used, notes, sheds(name)")
      .gte("entry_date", filterFrom)
      .lte("entry_date", filterTo)
      .order("entry_date", { ascending: false })
      .order("created_at",  { ascending: false });

    if (filterShed !== "all") query = query.eq("shed_id", filterShed);

    const { data, error } = await query;
    if (error) { setError(error.message); setLogLoading(false); return; }

    setAllEntries(
      (data ?? []).map((row: any) => ({
        ...row,
        shed_name: row.sheds?.name ?? "—",
      }))
    );
    setLogLoading(false);
  }, [supabase, filterFrom, filterTo, filterShed]);

  useEffect(() => {
    if (tab === "log") fetchLog();
  }, [tab, fetchLog]);

  // ── save entry ────────────────────────────────────────────────
  async function handleSave() {
    if (!shedId) { setError("Please select a shed."); return; }
    setSaving(true); setError(null);

    const payload = {
      shed_id:        shedId,
      entry_date:     entryDate,
      eggs_collected: eggsCollected.totalEggs,
      eggs_broken:    brokenEggs.totalEggs,
      eggs_dirty:     dirtyEggs.totalEggs,
      mortality:      parseInt(mortality) || 0,
      feed_used:      parseFloat(feedUsed) || 0,
      notes:          notes.trim() || null,
    };

    const { error } = await supabase
      .from("daily_entries")
      .upsert(payload, { onConflict: "shed_id,entry_date" });

    setSaving(false);
    if (error) { setError(error.message); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Refresh log if visible
    if (tab === "log") fetchLog();
  }

  // ── delete entry ──────────────────────────────────────────────
  async function handleDelete(id: string) {
    const { error } = await supabase.from("daily_entries").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    fetchLog();
  }

  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // ── log derived ───────────────────────────────────────────────
  const grouped      = groupByDate(allEntries);
  const totalEggsAll = allEntries.reduce((s, e) => s + e.eggs_collected, 0);
  const totalGoodAll = allEntries.reduce((s, e) => s + (e.eggs_collected - e.eggs_broken - e.eggs_dirty), 0);
  const totalDeaths  = allEntries.reduce((s, e) => s + e.mortality, 0);
  const totalFeed    = allEntries.reduce((s, e) => s + e.feed_used, 0);

  return (
    <>
      <Header title="Daily Operations" />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
            {error}
            <button className="ml-3 underline" onClick={() => setError(null)}>dismiss</button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-lg border border-border p-1 w-fit bg-muted/30">
          <button
            onClick={() => setTab("entry")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === "entry" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" /> Log Entry
          </button>
          <button
            onClick={() => setTab("log")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === "log" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" /> Daily Reports
          </button>
        </div>

        {/* ══════════════ LOG ENTRY TAB ══════════════ */}
        {tab === "entry" && (
          <Card className="max-w-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" />
                Daily Entry — {todayLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Shed / Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Shed</Label>
                  <Select value={shedId} onValueChange={(v) => v && setShedId(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select shed…" /></SelectTrigger>
                    <SelectContent>
                      {sheds.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Egg inputs */}
              <EggQuantityInput label="Eggs Collected" onChange={setEggsCollected} />
              <EggQuantityInput label="Broken Eggs"    onChange={setBrokenEggs} />
              <EggQuantityInput label="Dirty Eggs"     onChange={setDirtyEggs} />

              {/* Good eggs summary */}
              {eggsCollected.totalEggs > 0 && (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-emerald-400 font-medium">✓ Good (Saleable) Eggs</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {goodEggs.toLocaleString()} eggs&nbsp;
                    <span className="text-xs font-normal text-muted-foreground">({(goodEggs / 30).toFixed(1)} trays)</span>
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mortality (birds)</Label>
                  <Input
                    type="number" placeholder="0" value={mortality}
                    onChange={(e) => setMortality(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Feed Used (kg)</Label>
                  <Input
                    type="number" placeholder="0" value={feedUsed}
                    onChange={(e) => setFeedUsed(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes / Observations</Label>
                <Textarea
                  placeholder="Any remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : saved ? "Saved!" : "Save Entry"}
              </button>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ENTRY HISTORY TAB ══════════════ */}
        {tab === "log" && (
          <div className="space-y-4">

            {/* ── Filters ── */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0 mb-1" />
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">From</Label>
                    <Input
                      type="date" value={filterFrom}
                      onChange={(e) => setFilterFrom(e.target.value)}
                      className="h-8 text-xs w-36"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">To</Label>
                    <Input
                      type="date" value={filterTo}
                      onChange={(e) => setFilterTo(e.target.value)}
                      className="h-8 text-xs w-36"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Shed</Label>
                    <Select value={filterShed} onValueChange={setFilterShed}>
                      <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sheds</SelectItem>
                        {sheds.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    onClick={fetchLog}
                    className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* ── Summary strip ── */}
            {allEntries.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Collected",  value: eggLabel(totalEggsAll) },
                  { label: "Total Good Eggs",  value: eggLabel(totalGoodAll) },
                  { label: "Total Mortality",  value: `${totalDeaths} birds` },
                  { label: "Total Feed Used",  value: `${totalFeed.toFixed(0)} kg` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border px-4 py-3">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-bold font-mono mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Entry log grouped by date ── */}
            {logLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin mr-3" />
                <span className="text-sm">Loading entries…</span>
              </div>
            ) : grouped.length === 0 ? (
              <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
                No daily reports found for the selected period.
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map(([date, dayEntries]) => {
                  const dayCollected = dayEntries.reduce((s, e) => s + e.eggs_collected, 0);
                  const dayGood      = dayEntries.reduce((s, e) => s + (e.eggs_collected - e.eggs_broken - e.eggs_dirty), 0);
                  const dayDeaths    = dayEntries.reduce((s, e) => s + e.mortality, 0);
                  const dayFeed      = dayEntries.reduce((s, e) => s + e.feed_used, 0);
                  const isToday      = date === todayISO();

                  return (
                    <Card key={date}>
                      {/* Date header */}
                      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-border ${isToday ? "bg-primary/5" : "bg-muted/20"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{formatDate(date)}</span>
                          {isToday && (
                            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Today</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{dayEntries.length} shed{dayEntries.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
                          <span className="text-emerald-500 font-semibold">{eggLabel(dayGood)} good</span>
                          {dayDeaths > 0 && <span className="text-red-400">{dayDeaths} deaths</span>}
                          <span>{dayFeed.toFixed(0)} kg feed</span>
                        </div>
                      </div>

                      {/* Shed rows */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[10px] text-muted-foreground border-b border-border/50">
                              <th className="text-left py-1.5 px-4 font-medium">Shed</th>
                              <th className="text-right py-1.5 px-3 font-medium">Collected</th>
                              <th className="text-right py-1.5 px-3 font-medium">Broken</th>
                              <th className="text-right py-1.5 px-3 font-medium">Dirty</th>
                              <th className="text-right py-1.5 px-3 font-medium">Good</th>
                              <th className="text-right py-1.5 px-3 font-medium">Deaths</th>
                              <th className="text-right py-1.5 px-3 font-medium">Feed kg</th>
                              <th className="py-1.5 px-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayEntries.map((e) => {
                              const good = e.eggs_collected - e.eggs_broken - e.eggs_dirty;
                              return (
                                <tr key={e.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                                  <td className="py-2 px-4 font-medium">{e.shed_name}</td>
                                  <td className="py-2 px-3 text-right font-mono">{eggLabel(e.eggs_collected)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-orange-400">{e.eggs_broken > 0 ? eggLabel(e.eggs_broken) : "—"}</td>
                                  <td className="py-2 px-3 text-right font-mono text-yellow-400">{e.eggs_dirty > 0 ? eggLabel(e.eggs_dirty) : "—"}</td>
                                  <td className="py-2 px-3 text-right font-mono text-emerald-400 font-semibold">{eggLabel(good)}</td>
                                  <td className={`py-2 px-3 text-right font-bold ${e.mortality === 0 ? "text-muted-foreground" : e.mortality <= 2 ? "text-yellow-400" : "text-red-400"}`}>
                                    {e.mortality || "—"}
                                  </td>
                                  <td className="py-2 px-3 text-right">{e.feed_used > 0 ? e.feed_used : "—"}</td>
                                  <td className="py-2 px-3">
                                    <button
                                      onClick={() => handleDelete(e.id)}
                                      className="text-muted-foreground hover:text-red-400 transition-colors"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {dayEntries.length > 1 && (
                            <tfoot>
                              <tr className="bg-muted/30 font-bold text-[11px] border-t border-border">
                                <td className="py-1.5 px-4 text-muted-foreground">Day Total</td>
                                <td className="py-1.5 px-3 text-right font-mono">{eggLabel(dayCollected)}</td>
                                <td className="py-1.5 px-3"></td>
                                <td className="py-1.5 px-3"></td>
                                <td className="py-1.5 px-3 text-right font-mono text-emerald-400">{eggLabel(dayGood)}</td>
                                <td className={`py-1.5 px-3 text-right ${dayDeaths > 0 ? "text-red-400" : "text-muted-foreground"}`}>{dayDeaths || "—"}</td>
                                <td className="py-1.5 px-3 text-right">{dayFeed.toFixed(0)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                        {dayEntries.some(e => e.notes) && (
                          <div className="px-4 py-2 border-t border-border/30 space-y-0.5">
                            {dayEntries.filter(e => e.notes).map(e => (
                              <p key={e.id} className="text-[10px] text-muted-foreground">
                                <span className="font-semibold">{e.shed_name}:</span> {e.notes}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center pb-2">P = Patti (360 eggs) · T = Tray (30 eggs) · L = Loose eggs</p>
          </div>
        )}

      </main>
    </>
  );
}
