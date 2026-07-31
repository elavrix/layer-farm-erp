"use client";

import { useState } from "react";
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
} from "lucide-react";

type ReportType =
  | "daily-production"
  | "weekly-summary"
  | "monthly-pl"
  | "feed-consumption"
  | "mortality"
  | "customer-ledger"
  | "inventory";

const reportTypes: { id: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { id: "daily-production", label: "Daily Production", icon: ClipboardList, description: "Egg collection, mortality & feed per shed per day" },
  { id: "weekly-summary", label: "Weekly Summary", icon: Calendar, description: "7-day overview across all farms" },
  { id: "monthly-pl", label: "Monthly P&L", icon: TrendingUp, description: "Income, expenses and net profit by month" },
  { id: "feed-consumption", label: "Feed Consumption", icon: Wheat, description: "Feed used per shed/flock with cost analysis" },
  { id: "mortality", label: "Mortality Report", icon: AlertTriangle, description: "Bird deaths by date, cause and flock batch" },
  { id: "customer-ledger", label: "Customer Ledger", icon: Users, description: "Sales history and outstanding balance per customer" },
  { id: "inventory", label: "Inventory Report", icon: Package, description: "Current stock levels for feed, medicine and eggs" },
];

const dailyProductionData = [
  { date: "2026-07-31", eggs: 42050, broken: 45, mortality: 3, feed: 3480, production: 87.3 },
  { date: "2026-07-30", eggs: 42150, broken: 38, mortality: 2, feed: 3460, production: 87.5 },
  { date: "2026-07-29", eggs: 41900, broken: 52, mortality: 4, feed: 3490, production: 86.9 },
  { date: "2026-07-28", eggs: 42300, broken: 41, mortality: 1, feed: 3470, production: 87.7 },
  { date: "2026-07-27", eggs: 41800, broken: 60, mortality: 5, feed: 3510, production: 86.7 },
  { date: "2026-07-26", eggs: 42400, broken: 35, mortality: 2, feed: 3455, production: 87.9 },
  { date: "2026-07-25", eggs: 41650, broken: 47, mortality: 3, feed: 3500, production: 86.4 },
];

const weeklyData = [
  { week: "Week 30 (Jul 21-27)", farm: "Green Valley Farm", eggs: 294350, mortality: 18, feed: 24430 },
  { week: "Week 30 (Jul 21-27)", farm: "Sunrise Poultry", eggs: 219050, mortality: 14, feed: 18200 },
  { week: "Week 31 (Jul 28-31)", farm: "Green Valley Farm", eggs: 168500, mortality: 10, feed: 13900 },
  { week: "Week 31 (Jul 28-31)", farm: "Sunrise Poultry", eggs: 122400, mortality: 8, feed: 10800 },
];

const feedConsumptionData = [
  { flock: "FL-2024-01", shed: "Shed A", birds: 12800, feedType: "Layer Mash", consumed: 890, costPerBird: "₨ 0.07" },
  { flock: "FL-2024-02", shed: "Shed B", birds: 11200, feedType: "Layer Pellet", consumed: 780, costPerBird: "₨ 0.07" },
  { flock: "FL-2024-03", shed: "Shed C", birds: 12800, feedType: "Layer Mash", consumed: 900, costPerBird: "₨ 0.07" },
  { flock: "FL-2024-04", shed: "Shed D", birds: 11400, feedType: "Layer Pellet", consumed: 810, costPerBird: "₨ 0.07" },
  { flock: "FL-2024-05", shed: "Shed 1", birds: 10500, feedType: "Layer Mash", consumed: 740, costPerBird: "₨ 0.07" },
];

const mortalityData = [
  { date: "2026-07-31", flock: "FL-2024-03", shed: "Shed C", birds: 2, cause: "Heat Stress", farm: "Green Valley" },
  { date: "2026-07-31", flock: "FL-2024-05", shed: "Shed 1", birds: 1, cause: "Unknown", farm: "Sunrise Poultry" },
  { date: "2026-07-30", flock: "FL-2024-02", shed: "Shed B", birds: 1, cause: "Injury", farm: "Green Valley" },
  { date: "2026-07-30", flock: "FL-2024-01", shed: "Shed A", birds: 2, cause: "Respiratory", farm: "Green Valley" },
  { date: "2026-07-29", flock: "FL-2024-03", shed: "Shed C", birds: 3, cause: "Heat Stress", farm: "Green Valley" },
  { date: "2026-07-28", flock: "FL-2024-04", shed: "Shed D", birds: 1, cause: "Unknown", farm: "Green Valley" },
];

const customerLedger = [
  { customer: "Ali Traders", totalBusiness: "₨ 4,20,000", paid: "₨ 3,00,000", outstanding: "₨ 1,20,000", lastSale: "2026-07-31", status: "credit" },
  { customer: "Bismillah Mart", totalBusiness: "₨ 3,15,000", paid: "₨ 3,15,000", outstanding: "₨ 0", lastSale: "2026-07-31", status: "clear" },
  { customer: "Rehman Grocery", totalBusiness: "₨ 2,49,600", paid: "₨ 2,49,600", outstanding: "₨ 0", lastSale: "2026-07-30", status: "clear" },
  { customer: "City Superstore", totalBusiness: "₨ 6,21,000", paid: "₨ 6,21,000", outstanding: "₨ 0", lastSale: "2026-07-29", status: "clear" },
  { customer: "Khan Poultry Supply", totalBusiness: "₨ 4,68,000", paid: "₨ 3,12,000", outstanding: "₨ 1,56,000", lastSale: "2026-07-28", status: "overdue" },
];

const inventorySnapshot = [
  { category: "Eggs (Trays)", item: "Sellable Stock", qty: "4,190 trays", value: "₨ 44,00,000", status: "ok" },
  { category: "Feed", item: "Layer Mash 50kg", qty: "240 bags", value: "₨ 2,16,000", status: "ok" },
  { category: "Feed", item: "Layer Pellet 50kg", qty: "180 bags", value: "₨ 1,71,000", status: "ok" },
  { category: "Feed", item: "Maize (Broken) 50kg", qty: "310 bags", value: "₨ 2,17,000", status: "ok" },
  { category: "Medicine", item: "Newcastle Vaccine", qty: "500 doses", value: "₨ 30,000", status: "ok" },
  { category: "Medicine", item: "Marek's Vaccine", qty: "200 doses", value: "₨ 12,000", status: "expiring" },
  { category: "Medicine", item: "Enrofloxacin 10%", qty: "1.5 L", value: "₨ 4,500", status: "expired" },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("daily-production");
  const active = reportTypes.find((r) => r.id === activeReport)!;

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
                {/* DAILY PRODUCTION */}
                {activeReport === "daily-production" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total Eggs</TableHead>
                        <TableHead className="text-right">Broken</TableHead>
                        <TableHead className="text-right">Mortality</TableHead>
                        <TableHead className="text-right">Feed (kg)</TableHead>
                        <TableHead className="text-right">Production %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyProductionData.map((row) => (
                        <TableRow key={row.date}>
                          <TableCell className="text-xs font-mono">{row.date}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{row.eggs.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs text-red-500">{row.broken}</TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-semibold ${row.mortality <= 2 ? "text-green-600 dark:text-green-400" : row.mortality <= 4 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500"}`}>
                              {row.mortality}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs">{row.feed.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-bold ${row.production >= 87 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                              {row.production}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* WEEKLY SUMMARY */}
                {activeReport === "weekly-summary" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Farm</TableHead>
                        <TableHead className="text-right">Total Eggs</TableHead>
                        <TableHead className="text-right">Mortality</TableHead>
                        <TableHead className="text-right">Feed (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{row.week}</TableCell>
                          <TableCell className="text-xs font-medium">{row.farm}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{row.eggs.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs text-red-500">{row.mortality}</TableCell>
                          <TableCell className="text-right text-xs">{row.feed.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* MONTHLY P&L */}
                {activeReport === "monthly-pl" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Income (₨)</TableHead>
                        <TableHead className="text-right">Expenses (₨)</TableHead>
                        <TableHead className="text-right">Profit (₨)</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { month: "Jan 2026", income: 740000, expenses: 510000 },
                        { month: "Feb 2026", income: 760000, expenses: 525000 },
                        { month: "Mar 2026", income: 790000, expenses: 540000 },
                        { month: "Apr 2026", income: 810000, expenses: 558000 },
                        { month: "May 2026", income: 825000, expenses: 545000 },
                        { month: "Jun 2026", income: 800000, expenses: 535000 },
                        { month: "Jul 2026", income: 820000, expenses: 530000 },
                      ].map((row) => {
                        const profit = row.income - row.expenses;
                        const m = Math.round((profit / row.income) * 100);
                        return (
                          <TableRow key={row.month}>
                            <TableCell className="text-xs font-medium">{row.month}</TableCell>
                            <TableCell className="text-right text-xs text-green-600 dark:text-green-400">{row.income.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-xs text-red-500">{row.expenses.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-xs font-bold">{profit.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-xs font-semibold text-blue-500">{m}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {/* FEED CONSUMPTION */}
                {activeReport === "feed-consumption" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flock Batch</TableHead>
                        <TableHead>Shed</TableHead>
                        <TableHead className="text-right">Birds</TableHead>
                        <TableHead>Feed Type</TableHead>
                        <TableHead className="text-right">Consumed (kg)</TableHead>
                        <TableHead className="text-right">Cost/Bird</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedConsumptionData.map((row) => (
                        <TableRow key={row.flock}>
                          <TableCell className="font-mono text-xs font-semibold">{row.flock}</TableCell>
                          <TableCell className="text-xs">{row.shed}</TableCell>
                          <TableCell className="text-right text-xs">{row.birds.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{row.feedType}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{row.consumed}</TableCell>
                          <TableCell className="text-right text-xs">{row.costPerBird}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* MORTALITY REPORT */}
                {activeReport === "mortality" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Flock</TableHead>
                        <TableHead>Shed</TableHead>
                        <TableHead>Farm</TableHead>
                        <TableHead className="text-right">Birds Dead</TableHead>
                        <TableHead>Cause</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mortalityData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{row.date}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{row.flock}</TableCell>
                          <TableCell className="text-xs">{row.shed}</TableCell>
                          <TableCell className="text-xs">{row.farm}</TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-bold ${row.birds <= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500"}`}>
                              {row.birds}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.cause}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* CUSTOMER LEDGER */}
                {activeReport === "customer-ledger" && (
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
                      {customerLedger.map((row) => (
                        <TableRow key={row.customer}>
                          <TableCell className="text-xs font-semibold">{row.customer}</TableCell>
                          <TableCell className="text-right text-xs">{row.totalBusiness}</TableCell>
                          <TableCell className="text-right text-xs text-green-600 dark:text-green-400">{row.paid}</TableCell>
                          <TableCell className="text-right text-xs text-red-500 font-semibold">{row.outstanding}</TableCell>
                          <TableCell className="text-xs font-mono">{row.lastSale}</TableCell>
                          <TableCell>
                            <Badge className={row.status === "clear" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : row.status === "credit" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}>
                              {row.status === "clear" ? "Clear" : row.status === "credit" ? "Credit" : "Overdue"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* INVENTORY REPORT */}
                {activeReport === "inventory" && (
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
                      {inventorySnapshot.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{row.category}</TableCell>
                          <TableCell className="text-xs font-medium">{row.item}</TableCell>
                          <TableCell className="text-xs">{row.qty}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{row.value}</TableCell>
                          <TableCell>
                            <Badge className={row.status === "ok" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : row.status === "expiring" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}>
                              {row.status === "ok" ? "OK" : row.status === "expiring" ? "Expiring" : "Expired"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
