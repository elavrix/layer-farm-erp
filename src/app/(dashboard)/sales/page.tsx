"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EggQuantityInput } from "@/components/ui/EggQuantityInput";
import { useEggRate } from "@/hooks/useEggRate";
import { ShoppingCart, TrendingUp, Clock, Users, X, Tag, Percent } from "lucide-react";

// ── Past sales data ──────────────────────────────────────────
const sales = [
  { invoice: "INV-2026-087", date: "2026-07-31", customer: "Ali Traders",        trays: 40,  rate: 1050, discount: 0,    amount: 42000,   payment: "Cash",          status: "paid" },
  { invoice: "INV-2026-086", date: "2026-07-31", customer: "Bismillah Mart",      trays: 60,  rate: 1050, discount: 1500, amount: 61500,   payment: "Credit",        status: "pending" },
  { invoice: "INV-2026-085", date: "2026-07-30", customer: "Rehman Grocery",      trays: 120, rate: 1040, discount: 0,    amount: 124800,  payment: "Bank Transfer", status: "paid" },
  { invoice: "INV-2026-084", date: "2026-07-29", customer: "City Superstore",     trays: 200, rate: 1035, discount: 5000, amount: 202000,  payment: "Cheque",        status: "paid" },
  { invoice: "INV-2026-083", date: "2026-07-28", customer: "Khan Poultry Supply", trays: 150, rate: 1040, discount: 0,    amount: 156000,  payment: "Credit",        status: "overdue" },
];

function trayLabel(trays: number) {
  const p = Math.floor(trays / 12);
  const t = trays % 12;
  const parts = [];
  if (p) parts.push(`${p} patti`);
  if (t) parts.push(`${t} tray`);
  return parts.join(" + ") || "0";
}

const statusStyle: Record<string, string> = {
  paid:    "border-emerald-500 text-emerald-600 dark:text-emerald-400",
  pending: "border-yellow-500  text-yellow-600  dark:text-yellow-400",
  overdue: "border-red-500     text-red-600     dark:text-red-400",
};

export default function SalesPage() {
  const { current: todayRate, perEgg, perPatti, loaded } = useEggRate();

  const [showForm, setShowForm] = useState(false);
  const [payment,  setPayment]  = useState("cash");
  const [saleQty,  setSaleQty]  = useState({ pattis: 0, trays: 0, loose: 0, totalEggs: 0, totalTrays: 0 });

  // Rate fields — pre-filled with today's rate
  const [ratePerTray, setRatePerTray]   = useState("");
  const [discountAmt, setDiscountAmt]   = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [transport,   setTransport]     = useState("");
  const [saved,       setSaved]         = useState(false);

  // Pre-fill rate when today's rate loads or form opens
  useEffect(() => {
    if (todayRate) setRatePerTray(String(todayRate.rate));
  }, [todayRate, showForm]);

  const rate      = parseFloat(ratePerTray) || 0;
  const gross     = +(saleQty.totalTrays * rate).toFixed(0);
  const disc      = discountType === "percent"
    ? +(gross * (parseFloat(discountAmt) || 0) / 100).toFixed(0)
    : parseFloat(discountAmt) || 0;
  const transport_ = parseFloat(transport) || 0;
  const netAmount = gross - disc + transport_;
  const isDiscounted = rate < (todayRate?.rate ?? 0);

  function handleSave() {
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1800);
  }

  return (
    <>
      <Header title="Sales" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Today's Sales",      value: "2",            icon: ShoppingCart, color: "text-blue-500" },
            { label: "This Month Revenue", value: "₨ 8,40,000",  icon: TrendingUp,   color: "text-emerald-500" },
            { label: "Pending Payments",   value: "₨ 1,20,000",  icon: Clock,        color: "text-yellow-500" },
            { label: "Total Customers",    value: "14",           icon: Users,        color: "text-purple-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 shrink-0 ${s.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's rate info bar */}
        {loaded && todayRate && (
          <div className="flex items-center gap-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400/30 px-4 py-2.5">
            <span className="text-lg">🥚</span>
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">Today's Market Rate:</span>
              <span className="text-base font-black text-yellow-700 dark:text-yellow-300">₨{todayRate.rate.toLocaleString()}/tray</span>
              <span className="text-xs text-yellow-600/70 dark:text-yellow-500/70 font-mono">
                · ₨{perEgg}/egg · ₨{perPatti.toLocaleString()}/patti
              </span>
            </div>
            <span className="text-[10px] text-yellow-600/60 dark:text-yellow-500/60">
              by {todayRate.updatedBy}
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + New Sale
            </button>
          </div>
        )}

        {/* New Sale Form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> New Sale Invoice
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5">

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" defaultValue="2026-07-31" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Name</Label>
                  <Input type="text" placeholder="Customer name" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Farm</Label>
                  <Select defaultValue="green-valley">
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green-valley">Green Valley Farm</SelectItem>
                      <SelectItem value="sunrise">Sunrise Poultry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Egg quantity */}
              <EggQuantityInput label="Sale Quantity" onChange={setSaleQty} />

              {/* Rate + Discount row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Rate per tray */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Rate per Tray (₨)
                  </Label>
                  <div className="relative">
                    <input
                      type="number"
                      value={ratePerTray}
                      onChange={(e) => setRatePerTray(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {todayRate && rate !== todayRate.rate && (
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rate < todayRate.rate
                          ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                          : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {rate < todayRate.rate ? `↓ ₨${todayRate.rate - rate} below` : `↑ ₨${rate - todayRate.rate} above`}
                      </span>
                    )}
                    {todayRate && rate === todayRate.rate && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-semibold">
                        Market rate
                      </span>
                    )}
                  </div>
                  {ratePerTray && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      = ₨{(rate/30).toFixed(2)}/egg · ₨{(rate*12).toLocaleString()}/patti
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Percent className="h-3 w-3" /> Discount
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={discountAmt}
                      onChange={(e) => setDiscountAmt(e.target.value)}
                      placeholder="0"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "fixed" | "percent")}
                      className="rounded-md border border-input bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="fixed">₨ Fixed</option>
                      <option value="percent">% Percent</option>
                    </select>
                  </div>
                  {disc > 0 && (
                    <p className="text-[10px] text-orange-500 font-mono">- ₨{disc.toLocaleString()} discount</p>
                  )}
                </div>

                {/* Transport */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Transport Cost (₨)</Label>
                  <input
                    type="number"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Live invoice summary */}
              {saleQty.totalTrays > 0 && rate > 0 && (
                <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Invoice Summary</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Trays</p>
                      <p className="font-bold text-sm">{saleQty.totalTrays.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gross (₨)</p>
                      <p className="font-bold text-sm">{gross.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Discount (₨)</p>
                      <p className={`font-bold text-sm ${disc > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
                        {disc > 0 ? `- ${disc.toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Net Amount (₨)</p>
                      <p className="font-black text-base text-primary">{netAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  {isDiscounted && (
                    <p className="text-[10px] text-orange-500 flex items-center gap-1">
                      ⚠ Selling below today's market rate (₨{todayRate?.rate}/tray). Discount: ₨{((todayRate?.rate ?? 0) - rate) * saleQty.totalTrays} total.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Payment Mode</Label>
                <Select value={payment} onValueChange={(v) => v && setPayment(v)}>
                  <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {saved ? "✓ Invoice Created!" : "Create Invoice"}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Sales Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Sales Invoices</CardTitle>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                + New Sale
              </button>
            )}
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Trays</TableHead>
                  <TableHead className="text-right">Rate (₨)</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Amount (₨)</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => {
                  const belowMarket = todayRate && s.rate < todayRate.rate;
                  return (
                    <TableRow key={s.invoice}>
                      <TableCell className="font-mono text-xs font-semibold">{s.invoice}</TableCell>
                      <TableCell className="text-xs">{s.date}</TableCell>
                      <TableCell className="text-xs font-medium">{s.customer}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{trayLabel(s.trays)}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{s.trays}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={belowMarket ? "text-orange-500" : ""}>
                          ₨{s.rate.toLocaleString()}
                        </span>
                        {belowMarket && (
                          <span className="ml-1 text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-500 px-1 rounded">disc</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-orange-500">
                        {s.discount > 0 ? `₨${s.discount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">{s.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.payment}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusStyle[s.status]}`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </Badge>
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
