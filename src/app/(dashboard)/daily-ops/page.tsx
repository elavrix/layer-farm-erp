"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EggQuantityInput } from "@/components/ui/EggQuantityInput";
import { ClipboardList, Save, Trash2 } from "lucide-react";

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

// Today's ISO date (YYYY-MM-DD)
function todayISO() {
  return new Date().toISOString().split("T")[0];
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

export default function DailyOpsPage() {
  const supabase = createClient();

  // ── data ──────────────────────────────────────────────────────
  const [sheds,   setSheds]   = useState<Shed[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── form ──────────────────────────────────────────────────────
  const [shedId,    setShedId]    = useState("");
  const [entryDate, setEntryDate] = useState(todayISO());
  const [mortality, setMortality] = useState("");
  const [feedUsed,  setFeedUsed]  = useState("");
  const [notes,     setNotes]     = useState("");

  const [eggsCollected, setEggsCollected] = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [brokenEggs,    setBrokenEggs]    = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [dirtyEggs,     setDirtyEggs]     = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });

  const goodEggs = eggsCollected.totalEggs - brokenEggs.totalEggs - dirtyEggs.totalEggs;

  // ── fetch sheds once ─────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("sheds")
      .select("id, name, capacity")
      .order("name")
      .then(({ data, error }) => {
        if (error) { setError(error.message); return; }
        const list = data ?? [];
        setSheds(list);
        if (list.length > 0) setShedId(list[0].id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fetch today's entries ─────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_entries")
      .select("id, shed_id, entry_date, eggs_collected, eggs_broken, eggs_dirty, mortality, feed_used, notes, sheds(name)")
      .eq("entry_date", todayISO())
      .order("created_at", { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }

    setEntries(
      (data ?? []).map((row: any) => ({
        ...row,
        shed_name: row.sheds?.name ?? "—",
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── submit ────────────────────────────────────────────────────
  async function handleSave() {
    if (!shedId) { setError("Please select a shed."); return; }
    setSaving(true);
    setError(null);

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
    await fetchEntries();
  }

  // ── delete ────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const { error } = await supabase.from("daily_entries").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    await fetchEntries();
  }

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <Header title="Daily Operations" />
      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">

          {/* ── Entry Form ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" />
                Today&apos;s Entry — {today}
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
                    type="number"
                    placeholder="0"
                    value={mortality}
                    onChange={(e) => setMortality(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Feed Used (kg)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={feedUsed}
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

          {/* ── Today's Entries ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Today&apos;s Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">No entries yet for today.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shed</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Broken</TableHead>
                      <TableHead>Dirty</TableHead>
                      <TableHead>Good</TableHead>
                      <TableHead className="text-right">Mort.</TableHead>
                      <TableHead className="text-right">Feed kg</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => {
                      const good = e.eggs_collected - e.eggs_broken - e.eggs_dirty;
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs font-medium">{e.shed_name}</TableCell>
                          <TableCell className="text-xs font-mono text-emerald-400 whitespace-nowrap">
                            {eggLabel(e.eggs_collected)}
                            <span className="text-muted-foreground ml-1">({(e.eggs_collected / 30).toFixed(0)}T)</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-orange-400 whitespace-nowrap">
                            {eggLabel(e.eggs_broken)}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-yellow-400 whitespace-nowrap">
                            {eggLabel(e.eggs_dirty)}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-emerald-400 whitespace-nowrap">
                            {eggLabel(good)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-semibold ${
                              e.mortality === 0 ? "text-emerald-400"
                              : e.mortality <= 2 ? "text-yellow-400"
                              : "text-red-400"
                            }`}>{e.mortality}</span>
                          </TableCell>
                          <TableCell className="text-right text-xs">{e.feed_used}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleDelete(e.id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <p className="text-[10px] text-muted-foreground px-4 py-2">
                P = Patti (360 eggs) · T = Tray (30 eggs) · L = Loose eggs
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
