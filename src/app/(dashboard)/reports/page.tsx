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
import {
  ClipboardList,
  Calendar,
  TrendingUp,
  Wheat,
  AlertTriangle,
  Users,
  Package,
  Download,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType =
  | "daily-production"
  | "weekly-summary"
  | "monthly-pl"
  | "feed-consumption"
  | "mortality"
  | "customer-ledger"
  | "inventory";

interface DailyProductionRow {
  date: string;
  eggs: number;
  broken: number;
  dirty: number;
  mortality: number;
  feed: number;
}

interface WeeklySummaryRow {
  weekLabel: string;
  isoWeek: string;
  eggs: number;
  broken: number;
  mortality: number;
  feed: number;
}

interface MonthlyPLRow {
  month: string;       // "Jan 2026"
  monthKey: string;    // "2026-01"
  income: number;
  expenses: number;
}

interface FeedConsumptionRow {
  shedName: string;
  totalFeed: number;
}

interface MortalityRow {
  date: string;
  shedName: string;
  mortality: number;
}

interface CustomerLedgerRow {
  customer: string;
  total: number;
  paid: number;
  outstanding: number;
  lastSale: string;
  status: "clear" | "overdue";
}

interface InventoryRow {
  category: "Feed" | "Medicine";
  item: string;
  qty: string;
  value: number;
  status: "ok" | "low" | "expiring" | "expired";
}

interface ReportData {
  dailyProduction: DailyProductionRow[];
  weeklySummary: WeeklySummaryRow[];
  monthlyPL: MonthlyPLRow[];
  feedConsumption: FeedConsumptionRow[];
  mortality: MortalityRow[];
  customerLedger: CustomerLedgerRow[];
  inventory: InventoryRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as ₨ X,XXX or ₨ X.XL / ₨ X.XCr */
function fmt(n: number): string {
  if (n >= 10_000_000) return `₨ ${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₨ ${(n / 100_000).toFixed(1)}L`;
  return `₨ ${n.toLocaleString("en-PK")}`;
}

/** ISO week string like "2026-W30" */
function toISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** "2026-W30" → "Week 30 (Jul 21–27, 2026)" */
function weekLabel(key: string): string {
  const [year, wPart] = key.split("-W");
  const weekNum = parseInt(wPart, 10);
  // Find Monday of that ISO week
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (weekNum - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mo = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const su = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week ${weekNum} (${mo}–${su})`;
}

/** "2026-07-15" → "Jul 2026" */
function toMonthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** "2026-07-15" → "2026-07" */
function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Days ago as ISO date string */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Months ago as "YYYY-MM" */
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

/** Medicine expiry status */
function expiryStatus(expiryDate: string | null): "ok" | "expiring" | "expired" {
  if (!expiryDate) return "ok";
  const exp = new Date(expiryDate);
  const now = new Date();
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "expired";
  if (diff <= 30) return "expiring";
  return "ok";
}

// ─── Sidebar config ───────────────────────────────────────────────────────────

const reportTypes: {
  id: ReportType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "daily-production",
    label: "Daily Production",
    icon: ClipboardList,
    description: "Egg collection, mortality & feed per day (last 7 days)",
  },
  {
    id: "weekly-summary",
    label: "Weekly Summary",
    icon: Calendar,
    description: "7-day totals grouped by ISO week (last 4 weeks)",
  },
  {
    id: "monthly-pl",
    label: "Monthly P&L",
    icon: TrendingUp,
    description: "Income, expenses and net profit by month",
  },
  {
    id: "feed-consumption",
    label: "Feed Consumption",
    icon: Wheat,
    description: "Feed used per shed over the last 30 days",
  },
  {
    id: "mortality",
    label: "Mortality Report",
    icon: AlertTriangle,
    description: "Bird deaths by date and shed (last 30 days)",
  },
  {
    id: "customer-ledger",
    label: "Customer Ledger",
    icon: Users,
    description: "Sales history and outstanding balance per customer",
  },
  {
    id: "inventory",
    label: "Inventory Report",
    icon: Package,
    description: "Current stock levels for feed and medicine",
  },
];

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAllReports(): Promise<ReportData> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const day7 = daysAgo(7);
  const day30 = daysAgo(30);
  const month7 = monthsAgo(6); // 7 months including current

  // Fetch in parallel
  const [
    dailyEntriesRes,
    weeklyShedsRes,
    salesRes,
    purchasesRes,
    feedInventoryRes,
    medicineInventoryRes,
  ] = await Promise.all([
    // daily_entries with shed name, last 30 days (covers daily/weekly/feed/mortality)
    supabase
      .from("daily_entries")
      .select("entry_date, shed_id, eggs_collected, eggs_broken, eggs_dirty, mortality, feed_used, sheds(name)")
      .gte("entry_date", day30)
      .lte("entry_date", today)
      .order("entry_date", { ascending: false }),

    // same query alias for weekly (reuse dailyEntriesRes)
    Promise.resolve(null),

    // sales for monthly P&L and customer ledger
    supabase
      .from("sales")
      .select("customer_name, sale_date, trays, rate_per_tray, net_amount, payment_status")
      .gte("sale_date", month7 + "-01"),

    // purchases for monthly P&L
    supabase
      .from("purchases")
      .select("purchase_date, total_amount")
      .gte("purchase_date", month7 + "-01"),

    // feed inventory
    supabase
      .from("inventory_feed")
      .select("name, unit, stock, reorder_level, price_per_unit"),

    // medicine inventory
    supabase
      .from("inventory_medicine")
      .select("name, quantity, expiry_date"),
  ]);

  const rawEntries = (dailyEntriesRes.data ?? []) as unknown as Array<{
    entry_date: string;
    shed_id: string;
    eggs_collected: number;
    eggs_broken: number;
    eggs_dirty: number;
    mortality: number;
    feed_used: number;
    sheds: { name: string } | null;
  }>;

  const rawSales = (salesRes.data ?? []) as Array<{
    customer_name: string;
    sale_date: string;
    trays: number;
    rate_per_tray: number;
    net_amount: number;
    payment_status: string;
  }>;

  const rawPurchases = (purchasesRes.data ?? []) as Array<{
    purchase_date: string;
    total_amount: number;
  }>;

  const rawFeed = (feedInventoryRes.data ?? []) as Array<{
    name: string;
    unit: string;
    stock: number;
    reorder_level: number;
    price_per_unit: number;
  }>;

  const rawMedicine = (medicineInventoryRes.data ?? []) as Array<{
    name: string;
    quantity: number;
    expiry_date: string | null;
  }>;

  // ── 1. Daily Production: last 7 days, group by date ──────────────────────
  const last7Entries = rawEntries.filter((e) => e.entry_date >= day7);

  const dailyMap = new Map<string, DailyProductionRow>();
  for (const e of last7Entries) {
    const existing = dailyMap.get(e.entry_date);
    if (existing) {
      existing.eggs += e.eggs_collected ?? 0;
      existing.broken += e.eggs_broken ?? 0;
      existing.dirty += e.eggs_dirty ?? 0;
      existing.mortality += e.mortality ?? 0;
      existing.feed += e.feed_used ?? 0;
    } else {
      dailyMap.set(e.entry_date, {
        date: e.entry_date,
        eggs: e.eggs_collected ?? 0,
        broken: e.eggs_broken ?? 0,
        dirty: e.eggs_dirty ?? 0,
        mortality: e.mortality ?? 0,
        feed: e.feed_used ?? 0,
      });
    }
  }
  const dailyProduction = Array.from(dailyMap.values()).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  // ── 2. Weekly Summary: last 4 ISO weeks ──────────────────────────────────
  // Determine 4-week cutoff
  const week4ago = daysAgo(28);
  const weeklyEntries = rawEntries.filter((e) => e.entry_date >= week4ago);

  const weeklyMap = new Map<
    string,
    { eggs: number; broken: number; mortality: number; feed: number }
  >();
  for (const e of weeklyEntries) {
    const wk = toISOWeekKey(e.entry_date);
    const existing = weeklyMap.get(wk);
    if (existing) {
      existing.eggs += e.eggs_collected ?? 0;
      existing.broken += e.eggs_broken ?? 0;
      existing.mortality += e.mortality ?? 0;
      existing.feed += e.feed_used ?? 0;
    } else {
      weeklyMap.set(wk, {
        eggs: e.eggs_collected ?? 0,
        broken: e.eggs_broken ?? 0,
        mortality: e.mortality ?? 0,
        feed: e.feed_used ?? 0,
      });
    }
  }
  const weeklySummary: WeeklySummaryRow[] = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4)
    .map(([key, v]) => ({
      weekLabel: weekLabel(key),
      isoWeek: key,
      ...v,
    }));

  // ── 3. Monthly P&L ───────────────────────────────────────────────────────
  const incomeByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();

  for (const s of rawSales) {
    const mk = toMonthKey(s.sale_date);
    incomeByMonth.set(mk, (incomeByMonth.get(mk) ?? 0) + (s.net_amount ?? 0));
  }
  for (const p of rawPurchases) {
    const mk = toMonthKey(p.purchase_date);
    expensesByMonth.set(mk, (expensesByMonth.get(mk) ?? 0) + (p.total_amount ?? 0));
  }

  // Build last 7 months (including current month) in order
  const plMonthKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    plMonthKeys.push(d.toISOString().slice(0, 7));
  }

  const monthlyPL: MonthlyPLRow[] = plMonthKeys.map((mk) => ({
    month: toMonthLabel(mk + "-01"),
    monthKey: mk,
    income: incomeByMonth.get(mk) ?? 0,
    expenses: expensesByMonth.get(mk) ?? 0,
  }));

  // ── 4. Feed Consumption: last 30 days, group by shed ─────────────────────
  const feedMap = new Map<string, number>();
  for (const e of rawEntries) {
    const shedName = (e.sheds as { name: string } | null)?.name ?? `Shed ${e.shed_id}`;
    feedMap.set(shedName, (feedMap.get(shedName) ?? 0) + (e.feed_used ?? 0));
  }
  const feedConsumption: FeedConsumptionRow[] = Array.from(feedMap.entries())
    .map(([shedName, totalFeed]) => ({ shedName, totalFeed }))
    .sort((a, b) => b.totalFeed - a.totalFeed);

  // ── 5. Mortality: last 30 days, only rows where mortality > 0 ────────────
  const mortality: MortalityRow[] = rawEntries
    .filter((e) => (e.mortality ?? 0) > 0)
    .map((e) => ({
      date: e.entry_date,
      shedName: (e.sheds as { name: string } | null)?.name ?? `Shed ${e.shed_id}`,
      mortality: e.mortality,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── 6. Customer Ledger ───────────────────────────────────────────────────
  const ledgerMap = new Map<
    string,
    { total: number; paid: number; lastSale: string }
  >();
  for (const s of rawSales) {
    const key = s.customer_name;
    const existing = ledgerMap.get(key);
    const amount = s.net_amount ?? 0;
    const isPaid = s.payment_status === "paid";
    if (existing) {
      existing.total += amount;
      if (isPaid) existing.paid += amount;
      if (s.sale_date > existing.lastSale) existing.lastSale = s.sale_date;
    } else {
      ledgerMap.set(key, {
        total: amount,
        paid: isPaid ? amount : 0,
        lastSale: s.sale_date,
      });
    }
  }
  const customerLedger: CustomerLedgerRow[] = Array.from(
    ledgerMap.entries()
  )
    .map(([customer, v]) => {
      const outstanding = Math.max(0, v.total - v.paid);
      return {
        customer,
        total: v.total,
        paid: v.paid,
        outstanding,
        lastSale: v.lastSale,
        status: outstanding === 0 ? "clear" : "overdue",
      } as CustomerLedgerRow;
    })
    .sort((a, b) => b.outstanding - a.outstanding || b.total - a.total);

  // ── 7. Inventory ─────────────────────────────────────────────────────────
  const inventory: InventoryRow[] = [
    ...rawFeed.map((f) => ({
      category: "Feed" as const,
      item: `${f.name}${f.unit ? ` (${f.unit})` : ""}`,
      qty: `${f.stock?.toLocaleString() ?? 0} ${f.unit ?? ""}`.trim(),
      value: (f.stock ?? 0) * (f.price_per_unit ?? 0),
      status:
        (f.stock ?? 0) <= (f.reorder_level ?? 0) ? ("low" as const) : ("ok" as const),
    })),
    ...rawMedicine.map((m) => ({
      category: "Medicine" as const,
      item: m.name,
      qty: `${m.quantity?.toLocaleString() ?? 0}`,
      value: 0, // medicine table has no price column
      status: expiryStatus(m.expiry_date),
    })),
  ];

  return {
    dailyProduction,
    weeklySummary,
    monthlyPL,
    feedConsumption,
    mortality,
    customerLedger,
    inventory,
  };
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("daily-production");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const active = reportTypes.find((r) => r.id === activeReport)!;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAllReports()
      .then((d) => setData(d))
      .catch((e) => setError(e?.message ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header title="Reports" />
      <main className="flex-1 p-6">
        <div className="flex gap-6 h-full">
          {/* Left: Report Selector */}
          <aside className="w-56 shrink-0">
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Report Types
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-0.5">
                {reportTypes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveReport(r.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs transition-colors ${
                      activeReport === r.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <r.icon className="h-3.5 w-3.5 shrink-0" />
                    {r.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Right: Report Content */}
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <active.icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">{active.label}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{active.description}</span>
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Download className="h-3 w-3" />
                      Export
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading report data…
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div className="flex items-center justify-center py-16 text-red-500 text-xs">
                    {error}
                  </div>
                )}

                {/* ── DAILY PRODUCTION ── */}
                {!loading && !error && activeReport === "daily-production" && (
                  <>
                    {data?.dailyProduction.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total Eggs</TableHead>
                            <TableHead className="text-right">Broken</TableHead>
                            <TableHead className="text-right">Dirty</TableHead>
                            <TableHead className="text-right">Mortality</TableHead>
                            <TableHead className="text-right">Feed (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.dailyProduction.map((row) => (
                            <TableRow key={row.date}>
                              <TableCell className="text-xs font-mono">{row.date}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">
                                {row.eggs.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-xs text-red-500">
                                {row.broken}
                              </TableCell>
                              <TableCell className="text-right text-xs text-yellow-600 dark:text-yellow-400">
                                {row.dirty}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`text-xs font-semibold ${
                                    row.mortality <= 2
                                      ? "text-green-600 dark:text-green-400"
                                      : row.mortality <= 4
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {row.mortality}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {row.feed.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── WEEKLY SUMMARY ── */}
                {!loading && !error && activeReport === "weekly-summary" && (
                  <>
                    {data?.weeklySummary.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Week</TableHead>
                            <TableHead className="text-right">Total Eggs</TableHead>
                            <TableHead className="text-right">Broken</TableHead>
                            <TableHead className="text-right">Mortality</TableHead>
                            <TableHead className="text-right">Feed (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.weeklySummary.map((row) => (
                            <TableRow key={row.isoWeek}>
                              <TableCell className="text-xs font-medium">{row.weekLabel}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">
                                {row.eggs.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-xs text-red-500">
                                {row.broken}
                              </TableCell>
                              <TableCell className="text-right text-xs text-red-500 font-semibold">
                                {row.mortality}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {row.feed.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── MONTHLY P&L ── */}
                {!loading && !error && activeReport === "monthly-pl" && (
                  <>
                    {data?.monthlyPL.every((r) => r.income === 0 && r.expenses === 0) ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Income</TableHead>
                            <TableHead className="text-right">Expenses</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.monthlyPL.map((row) => {
                            const profit = row.income - row.expenses;
                            const margin =
                              row.income > 0
                                ? Math.round((profit / row.income) * 100)
                                : 0;
                            return (
                              <TableRow key={row.monthKey}>
                                <TableCell className="text-xs font-medium">{row.month}</TableCell>
                                <TableCell className="text-right text-xs text-green-600 dark:text-green-400">
                                  {fmt(row.income)}
                                </TableCell>
                                <TableCell className="text-right text-xs text-red-500">
                                  {fmt(row.expenses)}
                                </TableCell>
                                <TableCell
                                  className={`text-right text-xs font-bold ${
                                    profit >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {fmt(profit)}
                                </TableCell>
                                <TableCell
                                  className={`text-right text-xs font-semibold ${
                                    margin >= 20
                                      ? "text-blue-500"
                                      : margin >= 0
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {margin}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── FEED CONSUMPTION ── */}
                {!loading && !error && activeReport === "feed-consumption" && (
                  <>
                    {data?.feedConsumption.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Shed</TableHead>
                            <TableHead className="text-right">Total Feed Used (kg)</TableHead>
                            <TableHead className="text-right">Avg / Day (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.feedConsumption.map((row) => (
                            <TableRow key={row.shedName}>
                              <TableCell className="text-xs font-medium">{row.shedName}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">
                                {row.totalFeed.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {(row.totalFeed / 30).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── MORTALITY REPORT ── */}
                {!loading && !error && activeReport === "mortality" && (
                  <>
                    {data?.mortality.length === 0 ? (
                      <EmptyState label="No mortality recorded in the last 30 days" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Shed</TableHead>
                            <TableHead className="text-right">Birds Dead</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.mortality.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{row.date}</TableCell>
                              <TableCell className="text-xs font-medium">{row.shedName}</TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`text-xs font-bold ${
                                    row.mortality <= 2
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {row.mortality}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── CUSTOMER LEDGER ── */}
                {!loading && !error && activeReport === "customer-ledger" && (
                  <>
                    {data?.customerLedger.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Total Business</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead>Last Sale</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.customerLedger.map((row) => (
                            <TableRow key={row.customer}>
                              <TableCell className="text-xs font-semibold">
                                {row.customer}
                              </TableCell>
                              <TableCell className="text-right text-xs">{fmt(row.total)}</TableCell>
                              <TableCell className="text-right text-xs text-green-600 dark:text-green-400">
                                {fmt(row.paid)}
                              </TableCell>
                              <TableCell className="text-right text-xs text-red-500 font-semibold">
                                {fmt(row.outstanding)}
                              </TableCell>
                              <TableCell className="text-xs font-mono">{row.lastSale}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    row.status === "clear"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                  }
                                >
                                  {row.status === "clear" ? "Clear" : "Overdue"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}

                {/* ── INVENTORY REPORT ── */}
                {!loading && !error && activeReport === "inventory" && (
                  <>
                    {data?.inventory.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="text-right">Est. Value</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.inventory.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs text-muted-foreground">
                                {row.category}
                              </TableCell>
                              <TableCell className="text-xs font-medium">{row.item}</TableCell>
                              <TableCell className="text-xs">{row.qty}</TableCell>
                              <TableCell className="text-right text-xs font-semibold">
                                {row.value > 0 ? fmt(row.value) : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    row.status === "ok"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                      : row.status === "low"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                                      : row.status === "expiring"
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                  }
                                >
                                  {row.status === "ok"
                                    ? "OK"
                                    : row.status === "low"
                                    ? "Low Stock"
                                    : row.status === "expiring"
                                    ? "Expiring"
                                    : "Expired"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
      {label}
    </div>
  );
}
