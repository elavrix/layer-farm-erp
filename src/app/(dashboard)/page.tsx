"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarDays, Sun, TrendingUp, TrendingDown } from "lucide-react";
import { EggRateWidget } from "@/components/dashboard/EggRateWidget";
import Image from "next/image";
import { EggIcon, MoneyIcon, ShedIcon } from "@/components/dashboard/FarmIcons";

// ─── helpers ────────────────────────────────────────────────
function eggFmt(eggs: number) {
  const p = Math.floor(eggs / 360);
  const t = Math.floor((eggs % 360) / 30);
  const l = eggs % 30;
  const parts: string[] = [];
  if (p) parts.push(`${p}P`);
  if (t) parts.push(`${t}T`);
  if (l) parts.push(`${l}L`);
  return { label: parts.join(" + ") || "0", trays: +(eggs / 30).toFixed(1) };
}

// ─── Data ───────────────────────────────────────────────────
const sheds = [
  { name: "Shed 1", birds: 20000, eggs: 17400, broken: 240, dirty: 360, mortality: 3, feed: 280 },
  { name: "Shed 2", birds: 10000, eggs: 8700,  broken: 120, dirty: 180, mortality: 1, feed: 140 },
];
const todayTotalEggs = sheds.reduce((s, r) => s + r.eggs, 0);
const todayBroken    = sheds.reduce((s, r) => s + r.broken, 0);
const todayDirty     = sheds.reduce((s, r) => s + r.dirty, 0);
const todaySaleable  = todayTotalEggs - todayBroken - todayDirty;
const todayFeed      = sheds.reduce((s, r) => s + r.feed, 0);
const todayMortality = sheds.reduce((s, r) => s + r.mortality, 0);
const feedStock      = 4800;

const todaySales = [
  { customer: "Ali Traders",    trays: 40, rate: 1050, amount: 42000,  status: "paid" },
  { customer: "Bismillah Mart", trays: 60, rate: 1050, amount: 63000,  status: "pending" },
];
const todaySoldEggs  = todaySales.reduce((s, r) => s + r.trays * 30, 0);
const todayRevenue   = todaySales.reduce((s, r) => s + r.amount, 0);
const todayPending   = todaySales.filter(s => s.status === "pending").reduce((s, r) => s + r.amount, 0);
const remainingStock = todaySaleable - todaySoldEggs;

// Auto-generate alerts from shed data
const alerts: { type: string; msg: string }[] = [];
sheds.forEach((s) => {
  if (s.mortality >= 3) alerts.push({ type: "danger",  msg: `High mortality in ${s.name} — ${s.mortality} birds today` });
  else if (s.mortality > 0) alerts.push({ type: "warning", msg: `${s.mortality} bird${s.mortality > 1 ? "s" : ""} died in ${s.name} today` });
});
if (feedStock < 3000) alerts.push({ type: "danger",  msg: `Feed stock critically low — ${feedStock} kg remaining` });
else if (feedStock < 6000) alerts.push({ type: "warning", msg: `Feed stock low — ${feedStock} kg remaining (~${Math.floor(feedStock / todayFeed)} days)` });
if (todayPending > 0) alerts.push({ type: "info", msg: `Pending payment: ₨${todayPending.toLocaleString()} from ${todaySales.filter(s => s.status === "pending").map(s => s.customer).join(", ")}` });
if (alerts.length === 0) alerts.push({ type: "info", msg: "No active alerts — all systems normal" });

const monthly = [
  { month: "Jan", eggs: 1182600, revenue: 2488460, expenses: 1540000, profit: 948460 },
  { month: "Feb", eggs: 1067400, revenue: 2245440, expenses: 1390000, profit: 855440 },
  { month: "Mar", eggs: 1152000, revenue: 2419200, expenses: 1480000, profit: 939200 },
  { month: "Apr", eggs: 1123200, revenue: 2358720, expenses: 1450000, profit: 908720 },
  { month: "May", eggs: 1195200, revenue: 2509920, expenses: 1560000, profit: 949920 },
  { month: "Jun", eggs: 1166400, revenue: 2449440, expenses: 1510000, profit: 939440 },
  { month: "Jul", eggs: 1238400, revenue: 2600640, expenses: 1580000, profit: 1020640 },
];
const bestMonth   = [...monthly].sort((a, b) => b.profit - a.profit)[0];
const totalRev    = monthly.reduce((s, r) => s + r.revenue, 0);
const totalProfit = monthly.reduce((s, r) => s + r.profit, 0);
const totalEggs   = monthly.reduce((s, r) => s + r.eggs, 0);

export default function DashboardPage() {
  const [view, setView] = useState<"today" | "monthly">("today");

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto">

        {/* ── Banner ── */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs">Thursday, 31 July 2026</p>
              <h2 className="text-white font-bold text-lg mt-0.5">Good morning, Manager 👋</h2>
              <p className="text-white/40 text-xs mt-0.5">Al Rehman Poultry Farm · Daily report</p>
            </div>
            <div className="flex rounded-lg border border-white/20 overflow-hidden text-xs font-medium">
              <button onClick={() => setView("today")} className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${view === "today" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}>
                <Sun className="h-3.5 w-3.5" /> Today
              </button>
              <button onClick={() => setView("monthly")} className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${view === "monthly" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}>
                <CalendarDays className="h-3.5 w-3.5" /> Monthly
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Egg Rate Widget ── */}
          <EggRateWidget />

        {/* ══════════════ TODAY ══════════════ */}
        {view === "today" && (
          <>
            {/* KPI Cards — clean neutral */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Active Birds",  value: "30,000",                      sub: "2 sheds",                           icon: <Image src="/white-chicken.webp" alt="Hen" width={72} height={72} className="object-contain" />, dot: "bg-blue-500" },
                { label: "Eggs Today",    value: eggFmt(todayTotalEggs).label,  sub: `${eggFmt(todayTotalEggs).trays}T`,  icon: <Image src="/eggs.png" alt="Eggs" width={72} height={72} className="object-contain" />, dot: "bg-amber-400" },
                { label: "Saleable",      value: eggFmt(todaySaleable).label,   sub: `${eggFmt(todaySaleable).trays}T`,   icon: <Image src="/eggs.png" alt="Eggs" width={72} height={72} className="object-contain" />, dot: "bg-emerald-500" },
                { label: "Broken+Dirty",  value: eggFmt(todayBroken+todayDirty).label, sub: "discarded",                 icon: <Image src="/broken-egg.png" alt="Broken egg" width={72} height={72} className="object-contain" />, dot: "bg-orange-400" },
                { label: "Feed Used",     value: `${todayFeed} kg`,             sub: `${feedStock} kg left`,              icon: <Image src="/feed.png" alt="Feed" width={72} height={72} className="object-contain" />, dot: "bg-yellow-500" },
                { label: "Revenue",       value: `₨${(todayRevenue/1000).toFixed(0)}K`, sub: `₨${(todayPending/1000).toFixed(0)}K pending`, icon: <MoneyIcon className="w-16 h-16" />, dot: "bg-violet-500" },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-muted-foreground/60">{k.icon}</div>
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${k.dot}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{k.label}</p>
                    <p className="font-bold text-sm leading-tight mt-0.5">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick stats — plain row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Mortality Today", value: `${todayMortality} birds`,    warn: todayMortality > 2 },
                { label: "Sold Today",      value: eggFmt(todaySoldEggs).label,  warn: false },
                { label: "Remaining Stock", value: eggFmt(remainingStock).label, warn: false },
                { label: "Feed in Store",   value: `${feedStock} kg`,            warn: false },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-border px-4 py-3">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{k.label}</p>
                  <p className={`font-bold text-sm mt-0.5 font-mono ${k.warn ? "text-red-500" : ""}`}>{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Egg Production Report */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <div className="text-muted-foreground/70"><EggIcon className="w-7 h-7" /></div>
                  <div>
                    <CardTitle className="text-sm">Egg Production — Today</CardTitle>
                    <p className="text-[10px] text-muted-foreground">P = Patti (360) · T = Tray (30) · L = Loose</p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] text-muted-foreground">
                        <th className="text-left py-2 px-4 font-medium">Shed</th>
                        <th className="text-right py-2 px-2 font-medium">Collected</th>
                        <th className="text-right py-2 px-2 font-medium">Broken</th>
                        <th className="text-right py-2 px-2 font-medium">Dirty</th>
                        <th className="text-right py-2 px-2 font-medium">Saleable</th>
                        <th className="text-right py-2 px-4 font-medium">Deaths</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheds.map((s) => {
                        const saleable = s.eggs - s.broken - s.dirty;
                        const pct = ((saleable / s.eggs) * 100).toFixed(0);
                        return (
                          <tr key={s.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-4 text-xs font-semibold flex items-center gap-2">
                              <ShedIcon className="w-4 h-4 text-muted-foreground/50" />{s.name}
                            </td>
                            <td className="py-2.5 px-2 text-right text-xs font-mono">{eggFmt(s.eggs).label}</td>
                            <td className="py-2.5 px-2 text-right text-xs text-red-400 font-mono">{eggFmt(s.broken).label}</td>
                            <td className="py-2.5 px-2 text-right text-xs text-muted-foreground font-mono">{eggFmt(s.dirty).label}</td>
                            <td className="py-2.5 px-2 text-right text-xs font-mono">
                              <span className="font-semibold">{eggFmt(saleable).label}</span>
                              <span className="text-muted-foreground ml-1 text-[10px]">{pct}%</span>
                            </td>
                            <td className={`py-2.5 px-4 text-right text-xs font-bold ${s.mortality === 0 ? "text-muted-foreground" : s.mortality <= 2 ? "text-amber-500" : "text-red-500"}`}>
                              {s.mortality}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 text-xs font-bold border-t border-border">
                        <td className="py-2.5 px-4 text-muted-foreground">TOTAL</td>
                        <td className="py-2.5 px-2 text-right font-mono">{eggFmt(todayTotalEggs).label}</td>
                        <td className="py-2.5 px-2 text-right text-red-400 font-mono">{eggFmt(todayBroken).label}</td>
                        <td className="py-2.5 px-2 text-right text-muted-foreground font-mono">{eggFmt(todayDirty).label}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{eggFmt(todaySaleable).label}</td>
                        <td className="py-2.5 px-4 text-right text-red-500">{todayMortality}</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {alerts.map((a, i) => (
                    <div key={i} className={`rounded-lg p-3 text-xs border-l-2 ${
                      a.type === "danger"  ? "border-red-500    bg-muted/40 text-foreground"
                      : a.type === "warning" ? "border-amber-500 bg-muted/40 text-foreground"
                      : "border-border bg-muted/40 text-foreground"
                    }`}>
                      <span className="mr-1.5">{a.type === "danger" ? "●" : a.type === "warning" ? "●" : "●"}</span>
                      <span className={`font-semibold mr-1 ${a.type === "danger" ? "text-red-500" : a.type === "warning" ? "text-amber-500" : "text-muted-foreground"}`}>
                        {a.type === "danger" ? "Critical" : a.type === "warning" ? "Warning" : "Info"}
                      </span>
                      {a.msg}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sales + Stock */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2 flex flex-row items-center gap-3">
                  <div className="text-muted-foreground/70"><MoneyIcon className="w-6 h-6" /></div>
                  <CardTitle className="text-sm flex-1">Today&apos;s Sales</CardTitle>
                  <span className="text-xs font-bold">₨{todayRevenue.toLocaleString()}</span>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] text-muted-foreground">
                        <th className="text-left py-2 px-4 font-medium">Customer</th>
                        <th className="text-right py-2 px-2 font-medium">Qty</th>
                        <th className="text-right py-2 px-2 font-medium">Trays</th>
                        <th className="text-right py-2 px-2 font-medium">Rate/Patti</th>
                        <th className="text-right py-2 px-2 font-medium">Amount</th>
                        <th className="text-right py-2 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySales.map((s, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-4 text-xs font-medium">{s.customer}</td>
                          <td className="py-2.5 px-2 text-right text-xs font-mono text-muted-foreground">
                            {Math.floor(s.trays/12) > 0 ? `${Math.floor(s.trays/12)}P ` : ""}
                            {s.trays % 12 > 0 ? `${s.trays%12}T` : ""}
                          </td>
                          <td className="py-2.5 px-2 text-right text-xs font-mono">{s.trays}</td>
                          <td className="py-2.5 px-2 text-right text-xs font-mono">₨{(s.rate * 12).toLocaleString()}</td>
                          <td className="py-2.5 px-2 text-right text-xs font-bold">₨{s.amount.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right">
                            <Badge variant="outline" className={`text-[10px] ${s.status === "paid" ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "border-amber-500/50 text-amber-600 dark:text-amber-400"}`}>
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* End of Day Stock */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center gap-2">
                  <div><Image src="/feed.png" alt="Feed" width={24} height={24} className="object-contain" /></div>
                  <CardTitle className="text-sm">End-of-Day Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  {[
                    { label: "Eggs Produced",   value: eggFmt(todayTotalEggs).label },
                    { label: "Sold Today",       value: eggFmt(todaySoldEggs).label },
                    { label: "Broken + Dirty",   value: eggFmt(todayBroken+todayDirty).label },
                    { label: "Remaining Stock",  value: eggFmt(remainingStock).label, bold: true },
                    { label: "Feed in Store",    value: `${feedStock} kg` },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-2 last:pb-0">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className={`text-xs font-mono ${r.bold ? "font-bold" : "font-semibold"}`}>{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ══════════════ MONTHLY ══════════════ */}
        {view === "monthly" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Revenue (Jul)",  value: `₨ ${(monthly[6].revenue/100000).toFixed(2)}L`,  icon: TrendingUp },
                { label: "Expenses (Jul)", value: `₨ ${(monthly[6].expenses/100000).toFixed(2)}L`, icon: TrendingDown },
                { label: "Net Profit",     value: `₨ ${(monthly[6].profit/100000).toFixed(2)}L`,   icon: TrendingUp },
                { label: "Eggs (Jul)",     value: `${(monthly[6].eggs/360).toFixed(0)} patti`,      icon: TrendingUp },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <k.icon className="h-7 w-7 text-muted-foreground/50 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-xl font-bold mt-0.5">{k.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">YTD Revenue</p>
                  <p className="text-2xl font-bold mt-1">₨ {(totalRev/100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground mt-1">Jan – Jul 2026</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">YTD Net Profit</p>
                  <p className="text-2xl font-bold mt-1">₨ {(totalProfit/100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg margin ~38%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Month</p>
                  <p className="text-2xl font-bold mt-1">{bestMonth.month} 2026</p>
                  <p className="text-xs text-muted-foreground mt-1">₨{(bestMonth.profit/100000).toFixed(2)}L profit</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" /> Monthly P&amp;L — Jan to Jul 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] text-muted-foreground">
                      <th className="text-left py-2.5 px-4 font-medium">Month</th>
                      <th className="text-right py-2.5 px-3 font-medium">Eggs (Patti)</th>
                      <th className="text-right py-2.5 px-3 font-medium">Revenue (₨)</th>
                      <th className="text-right py-2.5 px-3 font-medium">Expenses (₨)</th>
                      <th className="text-right py-2.5 px-3 font-medium">Profit (₨)</th>
                      <th className="text-right py-2.5 px-4 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => {
                      const margin = ((m.profit / m.revenue) * 100).toFixed(0);
                      const isCurrent = m.month === "Jul";
                      return (
                        <tr key={m.month} className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors ${isCurrent ? "bg-muted/30" : ""}`}>
                          <td className="py-2.5 px-4 text-xs font-semibold">
                            <span className="flex items-center gap-2">
                              {m.month} 2026
                              {isCurrent && <Badge variant="outline" className="text-[9px] py-0">Current</Badge>}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs font-mono">{(m.eggs/360).toFixed(0)}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-mono">{m.revenue.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-mono text-muted-foreground">{m.expenses.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-bold font-mono">{m.profit.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`text-[11px] font-bold ${+margin >= 38 ? "text-emerald-600 dark:text-emerald-400" : +margin >= 35 ? "text-amber-500" : "text-red-500"}`}>{margin}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-bold text-xs border-t border-border">
                      <td className="py-2.5 px-4 text-muted-foreground">TOTAL (YTD)</td>
                      <td className="py-2.5 px-3 text-right font-mono">{(totalEggs/360).toFixed(0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalRev.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{monthly.reduce((s,r)=>s+r.expenses,0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalProfit.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">{((totalProfit/totalRev)*100).toFixed(0)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </main>
    </>
  );
}
