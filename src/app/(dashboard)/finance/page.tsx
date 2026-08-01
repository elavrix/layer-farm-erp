"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100000) return `₨ ${(n / 100000).toFixed(1)}L`;
  return `₨ ${n.toLocaleString()}`;
}

/** Return the first and last ISO date-string of a given month offset from today.
 *  offset 0 = current month, -1 = last month, etc. */
function monthRange(offset: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
  const label = d.toLocaleString("default", { month: "short", year: "numeric" });
  return { start, end, label };
}

/** Pretty-print "YYYY-MM-DD" → "Aug 2026" */
function dateToMonthLabel(iso: string) {
  const [y, m] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

/** Capitalise first letter */
function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface SaleRow {
  sale_date: string;
  net_amount: number;
}

interface PurchaseRow {
  purchase_date: string;
  category: string;
  total_amount: number;
}

interface MonthlyPL {
  label: string;
  income: number;
  expenses: number;
}

interface ExpenseCategory {
  label: string;
  amount: number;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  // Current month summary
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Breakdown
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Monthly P&L (last 7 months)
  const [monthlyPL, setMonthlyPL] = useState<MonthlyPL[]>([]);

  // Current month label
  const currentMonthLabel = monthRange(0).label;

  useEffect(() => {
    async function load() {
      setLoading(true);

      // ── build date ranges for last 7 months (index 0 = current month) ──
      const ranges = Array.from({ length: 7 }, (_, i) => monthRange(-i));
      const oldest = ranges[ranges.length - 1].start;
      const newest = ranges[0].end;

      // ── fetch sales (last 7 months) ──────────────────────────────────
      const { data: salesData } = await supabase
        .from("sales")
        .select("sale_date, net_amount")
        .gte("sale_date", oldest)
        .lte("sale_date", newest)
        .order("sale_date", { ascending: true });

      const sales: SaleRow[] = salesData ?? [];

      // ── fetch purchases (last 7 months) ──────────────────────────────
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("purchase_date, category, total_amount")
        .gte("purchase_date", oldest)
        .lte("purchase_date", newest)
        .order("purchase_date", { ascending: true });

      const purchases: PurchaseRow[] = purchasesData ?? [];

      // ── current month totals ──────────────────────────────────────────
      const { start: cmStart, end: cmEnd } = ranges[0];

      const cmIncome = sales
        .filter((s) => s.sale_date >= cmStart && s.sale_date <= cmEnd)
        .reduce((sum, s) => sum + Number(s.net_amount), 0);

      const cmExpenses = purchases
        .filter((p) => p.purchase_date >= cmStart && p.purchase_date <= cmEnd)
        .reduce((sum, p) => sum + Number(p.total_amount), 0);

      setTotalIncome(cmIncome);
      setTotalExpenses(cmExpenses);

      // ── expense breakdown by category (current month) ─────────────────
      const catMap: Record<string, number> = {};
      purchases
        .filter((p) => p.purchase_date >= cmStart && p.purchase_date <= cmEnd)
        .forEach((p) => {
          const cat = p.category ?? "other";
          catMap[cat] = (catMap[cat] ?? 0) + Number(p.total_amount);
        });

      const catList: ExpenseCategory[] = Object.entries(catMap)
        .map(([k, v]) => ({ label: cap(k), amount: v }))
        .sort((a, b) => b.amount - a.amount);

      setExpenseCategories(catList);

      // ── monthly P&L (7 months, newest first for display) ─────────────
      const plRows: MonthlyPL[] = ranges.reverse().map((r) => {
        const inc = sales
          .filter((s) => s.sale_date >= r.start && s.sale_date <= r.end)
          .reduce((sum, s) => sum + Number(s.net_amount), 0);
        const exp = purchases
          .filter((p) => p.purchase_date >= r.start && p.purchase_date <= r.end)
          .reduce((sum, p) => sum + Number(p.total_amount), 0);
        return { label: r.label, income: inc, expenses: exp };
      });

      setMonthlyPL(plRows);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const netProfit = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // Income breakdown: single line — Egg Sales
  const incomeBreakdown = [{ label: "Egg Sales", amount: totalIncome }];

  return (
    <>
      <Header title="Finance" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading financial data…</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(totalIncome)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentMonthLabel}</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{fmt(totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentMonthLabel}</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  </div>
                  <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                    {fmt(netProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Margin: {margin}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Income & Expense Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Income Breakdown — {currentMonthLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {totalIncome === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No sales recorded this month.
                    </p>
                  ) : (
                    incomeBreakdown.map((item) => {
                      const pct = totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{item.label}</span>
                            <span className="text-muted-foreground">{fmt(item.amount)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-green-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                    <span>Total Income</span>
                    <span className="text-green-600 dark:text-green-400">{fmt(totalIncome)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Expense Breakdown — {currentMonthLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expenseCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No purchases recorded this month.
                    </p>
                  ) : (
                    expenseCategories.map((item) => {
                      const pct = totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{item.label}</span>
                            <span className="text-muted-foreground">{fmt(item.amount)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-red-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                    <span>Total Expenses</span>
                    <span className="text-red-600 dark:text-red-400">{fmt(totalExpenses)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly P&L Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Monthly Profit & Loss — Last 7 Months</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {monthlyPL.every((r) => r.income === 0 && r.expenses === 0) ? (
                  <p className="text-xs text-muted-foreground px-4 py-6 text-center">
                    No data found for the last 7 months.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Income (₨)</TableHead>
                        <TableHead className="text-right">Expenses (₨)</TableHead>
                        <TableHead className="text-right">Net Profit (₨)</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyPL.map((row) => {
                        const profit = row.income - row.expenses;
                        const m = row.income > 0 ? Math.round((profit / row.income) * 100) : 0;
                        return (
                          <TableRow key={row.label}>
                            <TableCell className="text-xs font-medium">{row.label}</TableCell>
                            <TableCell className="text-right text-xs text-green-600 dark:text-green-400 font-semibold">
                              {row.income.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs text-red-500 font-semibold">
                              {row.expenses.toLocaleString()}
                            </TableCell>
                            <TableCell className={`text-right text-xs font-bold ${profit >= 0 ? "text-foreground" : "text-red-500"}`}>
                              {profit.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`text-xs font-semibold ${
                                  m >= 30
                                    ? "text-green-600 dark:text-green-400"
                                    : m >= 20
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-red-500"
                                }`}
                              >
                                {row.income === 0 ? "—" : `${m}%`}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

      </main>
    </>
  );
}
