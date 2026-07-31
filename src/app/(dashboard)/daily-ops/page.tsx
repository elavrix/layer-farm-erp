"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EggQuantityInput } from "@/components/ui/EggQuantityInput";
import { ClipboardList, Save } from "lucide-react";

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

const recentEntries = [
  { date: "2026-07-30", shed: "Shed A", eggs: 11160, broken: 180, dirty: 360, mortality: 2, feed: 890, by: "Ali Hassan" },
  { date: "2026-07-30", shed: "Shed B", eggs: 9720,  broken: 90,  dirty: 120, mortality: 1, feed: 780, by: "Ali Hassan" },
  { date: "2026-07-29", shed: "Shed A", eggs: 11340, broken: 60,  dirty: 180, mortality: 0, feed: 885, by: "Ali Hassan" },
  { date: "2026-07-29", shed: "Shed B", eggs: 9900,  broken: 120, dirty: 90,  mortality: 2, feed: 775, by: "Usman Khan" },
  { date: "2026-07-28", shed: "Shed C", eggs: 11160, broken: 150, dirty: 210, mortality: 3, feed: 900, by: "Ali Hassan" },
  { date: "2026-07-27", shed: "Shed A", eggs: 11520, broken: 30,  dirty: 120, mortality: 1, feed: 888, by: "Ali Hassan" },
  { date: "2026-07-26", shed: "Shed D", eggs: 9360,  broken: 60,  dirty: 90,  mortality: 0, feed: 810, by: "Usman Khan" },
];

export default function DailyOpsPage() {
  const [farm, setFarm] = useState("green-valley");
  const [shed, setShed] = useState("shed-a");
  const [saved, setSaved] = useState(false);

  const [eggsCollected, setEggsCollected] = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [brokenEggs,    setBrokenEggs]    = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });
  const [dirtyEggs,     setDirtyEggs]     = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });

  const goodEggs = eggsCollected.totalEggs - brokenEggs.totalEggs - dirtyEggs.totalEggs;

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <Header title="Daily Operations" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 xl:grid-cols-2">

          {/* ── Entry Form ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" />
                Today&apos;s Entry — 31 Jul 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Farm / Shed / Date */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" defaultValue="2026-07-31" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Farm</Label>
                  <Select value={farm} onValueChange={(v) => v && setFarm(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green-valley">Green Valley Farm</SelectItem>
                      <SelectItem value="sunrise">Sunrise Poultry</SelectItem>
                      <SelectItem value="alnoor">Al-Noor Farm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Shed</Label>
                  <Select value={shed} onValueChange={(v) => v && setShed(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shed-a">Shed A</SelectItem>
                      <SelectItem value="shed-b">Shed B</SelectItem>
                      <SelectItem value="shed-c">Shed C</SelectItem>
                      <SelectItem value="shed-d">Shed D</SelectItem>
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
                  <Input type="number" placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Feed Used (kg)</Label>
                  <Input type="number" placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Water Used (L)</Label>
                  <Input type="number" placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Temperature (°C)</Label>
                  <Input type="number" placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Humidity (%)</Label>
                  <Input type="number" placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Medicine Given</Label>
                  <Input type="text" placeholder="e.g. Vitamin E" className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes / Observations</Label>
                <Textarea placeholder="Any remarks..." className="text-xs resize-none" rows={2} />
              </div>

              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                {saved ? "Saved!" : "Save Entry"}
              </button>
            </CardContent>
          </Card>

          {/* ── Recent Entries ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Entries (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shed</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Broken</TableHead>
                    <TableHead>Dirty</TableHead>
                    <TableHead className="text-right">Mortality</TableHead>
                    <TableHead className="text-right">Feed kg</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{e.date}</TableCell>
                      <TableCell className="text-xs font-medium">{e.shed}</TableCell>
                      <TableCell className="text-xs font-mono text-emerald-400 whitespace-nowrap">
                        {eggLabel(e.eggs)}
                        <span className="text-muted-foreground ml-1">({(e.eggs/30).toFixed(0)}T)</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-orange-400 whitespace-nowrap">
                        {eggLabel(e.broken)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-yellow-400 whitespace-nowrap">
                        {eggLabel(e.dirty)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-semibold ${
                          e.mortality === 0 ? "text-emerald-400"
                          : e.mortality <= 2 ? "text-yellow-400"
                          : "text-red-400"
                        }`}>{e.mortality}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{e.feed}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
