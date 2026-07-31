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

const income = [
  { label: "Egg Sales", amount: 720000 },
  { label: "Bird Sales (Culls)", amount: 80000 },
  { label: "Manure Sales", amount: 15000 },
  { label: "Other Income", amount: 5000 },
];

const expenses = [
  { label: "Feed & Raw Material", amount: 310000 },
  { label: "Medicine & Vaccines", amount: 40000 },
  { label: "Electricity & Fuel", amount: 45000 },
  { label: "Salaries & Wages", amount: 120000 },
  { label: "Repairs & Maintenance", amount: 10000 },
  { label: "Miscellaneous", amount: 5000 },
];

const monthlyPL = [
  { month: "Jan 2026", income: 740000, expenses: 510000 },
  { month: "Feb 2026", income: 760000, expenses: 525000 },
  { month: "Mar 2026", income: 790000, expenses: 540000 },
  { month: "Apr 2026", income: 810000, expenses: 558000 },
  { month: "May 2026", income: 825000, expenses: 545000 },
  { month: "Jun 2026", income: 800000, expenses: 535000 },
  { month: "Jul 2026", income: 820000, expenses: 530000 },
];

function fmt(n: number) {
  if (n >= 100000) return `₨ ${(n / 100000).toFixed(1)}L`;
  return `₨ ${n.toLocaleString()}`;
}

const totalIncome = income.reduce((a, i) => a + i.amount, 0);
const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
const netProfit = totalIncome - totalExpenses;
const margin = Math.round((netProfit / totalIncome) * 100);

export default function FinancePage() {
  return (
    <>
      <Header title="Finance" />
      <main className="flex-1 p-6 space-y-6">
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
              <p className="text-xs text-muted-foreground mt-1">July 2026</p>
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
              <p className="text-xs text-muted-foreground mt-1">July 2026</p>
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
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{fmt(netProfit)}</p>
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
                Income Breakdown — July 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {income.map((item) => {
                const pct = Math.round((item.amount / totalIncome) * 100);
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
              })}
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
                Expense Breakdown — July 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.map((item) => {
                const pct = Math.round((item.amount / totalExpenses) * 100);
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
              })}
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
            <CardTitle className="text-sm font-semibold">Monthly Profit & Loss — 2026</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                  const m = Math.round((profit / row.income) * 100);
                  return (
                    <TableRow key={row.month}>
                      <TableCell className="text-xs font-medium">{row.month}</TableCell>
                      <TableCell className="text-right text-xs text-green-600 dark:text-green-400 font-semibold">
                        {row.income.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-red-500 font-semibold">
                        {row.expenses.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground">
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
                          {m}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
