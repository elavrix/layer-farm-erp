"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarDays, Sun, TrendingUp, TrendingDown } from "lucide-react";
import { EggRateWidget } from "@/components/dashboard/EggRateWidget";
import Image from "next/image";
import { EggIcon, MoneyIcon, ShedIcon } from "@/components/dashboard/FarmIcons";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

// ─── Types ───────────────────────────────────────────────────
type Shed = {
  id: string;
  name: string;
  capacity: number;
  farm_id: string;
};

type DailyEntry = {
  shed_id: string;
  entry_date: string;
  eggs_collected: number;
  eggs_broken: number;
  eggs_dirty: number;
  mortality: number;
  feed_used: number;
  notes: string | null;
  shed_name?: string;
};

type Sale = {
  id: string;
  customer_name: string;
  sale_date: string;
  trays: number;
  rate_per_tray: number;
  net_amount: number;
  payment_status: string;
};

type MonthlyRow = {
  month: string;
  monthIndex: number;
  revenue: number;
};

// ─── Month names ─────────────────────────────────────────────
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const [view, setView] = useState<"today" | "monthly">("today");
  const [loading, setLoading] = useState(true);

  // Today data
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [feedStock, setFeedStock] = useState(0);

  // Monthly data
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-based

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const supabase = createClient();

      // 1. Sheds
      const { data: shedsData } = await supabase.from("sheds").select("*");

      // 2. Daily entries for today
      const { data: entriesData } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("entry_date", today);

      // 3. Today's sales
      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .eq("sale_date", today);

      // 4. Feed inventory total
      const { data: feedData } = await supabase
        .from("inventory_feed")
        .select("stock");

      // 5. Monthly sales for current year
      const { data: monthlySalesData } = await supabase
        .from("sales")
        .select("sale_date, net_amount")
        .gte("sale_date", `${year}-01-01`)
        .lte("sale_date", `${year}-12-31`);

      // ── Process sheds ──
      const resolvedSheds: Shed[] = shedsData ?? [];
      setSheds(resolvedSheds);

      // ── Process daily entries (join shed name) ──
      const shedMap: Record<string, string> = {};
      resolvedSheds.forEach((s) => { shedMap[s.id] = s.name; });
      const resolvedEntries: DailyEntry[] = (entriesData ?? []).map((e) => ({
        ...e,
        shed_name: shedMap[e.shed_id] ?? "Unknown Shed",
      }));
      setDailyEntries(resolvedEntries);

      // ── Process sales ──
      setTodaySales(salesData ?? []);

      // ── Process feed stock ──
      const totalFeed = (feedData ?? []).reduce((sum, row) => sum + (row.stock ?? 0), 0);
      setFeedStock(totalFeed);

      // ── Aggregate monthly sales ──
      const monthTotals: Record<number, number> = {};
      (monthlySalesData ?? []).forEach((row) => {
        const m = new Date(row.sale_date).getMonth(); // 0-based
        monthTotals[m] = (monthTotals[m] ?? 0) + (row.net_amount ?? 0);
      });
      const aggregated: MonthlyRow[] = Object.entries(monthTotals)
        .map(([idx, revenue]) => ({
          monthIndex: Number(idx),
          month: MONTH_NAMES[Number(idx)],
          revenue,
        }))
        .sort((a, b) => a.monthIndex - b.monthIndex);
      setMonthly(aggregated);

      setLoading(false);
    }

    fetchAll();
  }, [today, year]);

  // ── Derived today values ──
  const activeBirds      = sheds.reduce((s, r) => s + (r.capacity ?? 0), 0);
  const todayTotalEggs   = dailyEntries.reduce((s, r) => s + (r.eggs_collected ?? 0), 0);
  const todayBroken      = dailyEntries.reduce((s, r) => s + (r.eggs_broken ?? 0), 0);
  const todayDirty       = dailyEntries.reduce((s, r) => s + (r.eggs_dirty ?? 0), 0);
  const todaySaleable    = todayTotalEggs - todayBroken - todayDirty;
  const todayFeed        = dailyEntries.reduce((s, r) => s + (r.feed_used ?? 0), 0);
  const todayMortality   = dailyEntries.reduce((s, r) => s + (r.mortality ?? 0), 0);
  const todaySoldEggs    = todaySales.reduce((s, r) => s + (r.trays ?? 0) * 30, 0);
  const todayRevenue     = todaySales.reduce((s, r) => s + (r.net_amount ?? 0), 0);
  const todayPending     = todaySales.filter((s) => s.payment_status === "pending").reduce((s, r) => s + (r.net_amount ?? 0), 0);
  const remainingStock   = todaySaleable - todaySoldEggs;

  // ── Auto-generate alerts ──
  const alerts: { type: string; msg: string }[] = [];
  dailyEntries.forEach((e) => {
    const name = e.shed_name ?? "Unknown";
    if (e.mortality >= 3) alerts.push({ type: "danger",  msg: `High mortality in ${name} — ${e.mortality} birds today` });
    else if (e.mortality > 0) alerts.push({ type: "warning", msg: `${e.mortality} bird${e.mortality > 1 ? "s" : ""} died in ${name} today` });
  });
  if (feedStock > 0 && feedStock < 3000) alerts.push({ type: "danger",  msg: `Feed stock critically low — ${feedStock} kg remaining` });
  else if (feedStock > 0 && feedStock < 6000) alerts.push({ type: "warning", msg: `Feed stock low — ${feedStock} kg remaining${todayFeed > 0 ? ` (~${Math.floor(feedStock / todayFeed)} days)` : ""}` });
  if (todayPending > 0) {
    const pendingCustomers = todaySales.filter((s) => s.payment_status === "pending").map((s) => s.customer_name).join(", ");
    alerts.push({ type: "info", msg: `Pending payment: ₨${todayPending.toLocaleString()} from ${pendingCustomers}` });
  }
  if (alerts.length === 0) alerts.push({ type: "info", msg: "No active alerts — all systems normal" });

  // ── Derived monthly values ──
  const totalRev     = monthly.reduce((s, r) => s + r.revenue, 0);
  const currentMonthRow = monthly.find((m) => m.monthIndex === currentMonthIndex);
  const bestMonth    = monthly.length > 0 ? [...monthly].sort((a, b) => b.revenue - a.revenue)[0] : null;

  // ── Today's date label ──
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── Loading spinner ──
  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-sm">Loading dashboard…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto">

        {/* ── Banner ── */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs">{todayLabel}</p>
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
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Active Birds",  value: activeBirds.toLocaleString(),        sub: `${sheds.length} shed${sheds.length !== 1 ? "s" : ""}`,       icon: <Image src="/white-chicken.webp" alt="Hen" width={72} height={72} className="object-contain" />, dot: "bg-blue-500" },
                { label: "Eggs Today",    value: eggFmt(todayTotalEggs).label,        sub: `${eggFmt(todayTotalEggs).trays}T`,                            icon: <Image src="/eggs.png" alt="Eggs" width={72} height={72} className="object-contain" />, dot: "bg-amber-400" },
                { label: "Saleable",      value: eggFmt(todaySaleable).label,         sub: `${eggFmt(todaySaleable).trays}T`,                             icon: <Image src="/eggs.png" alt="Eggs" width={72} height={72} className="object-contain" />, dot: "bg-emerald-500" },
                { label: "Broken+Dirty",  value: eggFmt(todayBroken+todayDirty).label, sub: "discarded",                                                 icon: <Image src="/broken-egg.png" alt="Broken egg" width={72} height={72} className="object-contain" />, dot: "bg-orange-400" },
                { label: "Feed Used",     value: `${todayFeed} kg`,                   sub: `${feedStock} kg left`,                                        icon: <Image src="/feed.png" alt="Feed" width={72} height={72} className="object-contain" />, dot: "bg-yellow-500" },
                { label: "Revenue",       value: `₨${(todayRevenue/1000).toFixed(0)}K`, sub: `₨${(todayPending/1000).toFixed(0)}K pending`,              icon: <MoneyIcon className="w-16 h-16" />, dot: "bg-violet-500" },
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

            {/* Quick stats */}
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
                  {dailyEntries.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <p>No entries for today.</p>
                      <p className="mt-1">
                        Go to{" "}
                        <Link href="/daily-ops" className="underline text-foreground hover:text-primary">
                          Daily Operations
                        </Link>{" "}
                        to add today&apos;s data.
                      </p>
                    </div>
                  ) : (
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
                        {dailyEntries.map((e) => {
                          const saleable = e.eggs_collected - e.eggs_broken - e.eggs_dirty;
                          const pct = e.eggs_collected > 0 ? ((saleable / e.eggs_collected) * 100).toFixed(0) : "0";
                          return (
                            <tr key={e.shed_id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-4 text-xs font-semibold flex items-center gap-2">
                                <ShedIcon className="w-4 h-4 text-muted-foreground/50" />{e.shed_name}
                              </td>
                              <td className="py-2.5 px-2 text-right text-xs font-mono">{eggFmt(e.eggs_collected).label}</td>
                              <td className="py-2.5 px-2 text-right text-xs text-red-400 font-mono">{eggFmt(e.eggs_broken).label}</td>
                              <td className="py-2.5 px-2 text-right text-xs text-muted-foreground font-mono">{eggFmt(e.eggs_dirty).label}</td>
                              <td className="py-2.5 px-2 text-right text-xs font-mono">
                                <span className="font-semibold">{eggFmt(saleable).label}</span>
                                <span className="text-muted-foreground ml-1 text-[10px]">{pct}%</span>
                              </td>
                              <td className={`py-2.5 px-4 text-right text-xs font-bold ${e.mortality === 0 ? "text-muted-foreground" : e.mortality <= 2 ? "text-amber-500" : "text-red-500"}`}>
                                {e.mortality}
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
                  )}
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
                      <span className="mr-1.5">●</span>
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
                  {todaySales.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No sales recorded for today.
                    </div>
                  ) : (
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
                        {todaySales.map((s) => (
                          <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-4 text-xs font-medium">{s.customer_name}</td>
                            <td className="py-2.5 px-2 text-right text-xs font-mono text-muted-foreground">
                              {Math.floor(s.trays / 12) > 0 ? `${Math.floor(s.trays / 12)}P ` : ""}
                              {s.trays % 12 > 0 ? `${s.trays % 12}T` : ""}
                            </td>
                            <td className="py-2.5 px-2 text-right text-xs font-mono">{s.trays}</td>
                            <td className="py-2.5 px-2 text-right text-xs font-mono">₨{(s.rate_per_tray * 12).toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-right text-xs font-bold">₨{s.net_amount.toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-right">
                              <Badge variant="outline" className={`text-[10px] ${s.payment_status === "paid" ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "border-amber-500/50 text-amber-600 dark:text-amber-400"}`}>
                                {s.payment_status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: `Revenue (${currentMonthRow?.month ?? "—"})`, value: currentMonthRow ? `₨ ${(currentMonthRow.revenue / 100000).toFixed(2)}L` : "—", icon: TrendingUp },
                { label: "Expenses",   value: "—",                                                          icon: TrendingDown },
                { label: "Net Profit", value: "—",                                                          icon: TrendingUp },
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
                  <p className="text-2xl font-bold mt-1">₨ {(totalRev / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground mt-1">Jan – {MONTH_NAMES[currentMonthIndex]} {year}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">YTD Net Profit</p>
                  <p className="text-2xl font-bold mt-1">—</p>
                  <p className="text-xs text-muted-foreground mt-1">No expenses data yet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Month</p>
                  <p className="text-2xl font-bold mt-1">{bestMonth ? `${bestMonth.month} ${year}` : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bestMonth ? `₨${(bestMonth.revenue / 100000).toFixed(2)}L revenue` : "No data"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" /> Monthly Sales — Jan to {MONTH_NAMES[currentMonthIndex]} {year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {monthly.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No sales data found for {year}.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] text-muted-foreground">
                        <th className="text-left py-2.5 px-4 font-medium">Month</th>
                        <th className="text-right py-2.5 px-3 font-medium">Revenue (₨)</th>
                        <th className="text-right py-2.5 px-3 font-medium">Expenses (₨)</th>
                        <th className="text-right py-2.5 px-3 font-medium">Profit (₨)</th>
                        <th className="text-right py-2.5 px-4 font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m) => {
                        const isCurrent = m.monthIndex === currentMonthIndex;
                        return (
                          <tr key={m.month} className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors ${isCurrent ? "bg-muted/30" : ""}`}>
                            <td className="py-2.5 px-4 text-xs font-semibold">
                              <span className="flex items-center gap-2">
                                {m.month} {year}
                                {isCurrent && <Badge variant="outline" className="text-[9px] py-0">Current</Badge>}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono">{m.revenue.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-muted-foreground">—</td>
                            <td className="py-2.5 px-3 text-right text-xs font-bold font-mono">—</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="text-[11px] font-bold text-muted-foreground">—</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-bold text-xs border-t border-border">
                        <td className="py-2.5 px-4 text-muted-foreground">TOTAL (YTD)</td>
                        <td className="py-2.5 px-3 text-right font-mono">{totalRev.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">—</td>
                        <td className="py-2.5 px-3 text-right font-mono">—</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">—</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </main>
    </>
  );
}
