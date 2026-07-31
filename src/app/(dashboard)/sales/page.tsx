"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, TrendingUp, Clock, X } from "lucide-react";

// Today's ISO date (YYYY-MM-DD)
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

interface Sale {
  id: string;
  customer_name: string;
  sale_date: string;
  trays: number;
  rate_per_tray: number;
  gross_amount: number;
  net_amount: number;
  payment_status: string;
  notes: string | null;
}

const statusStyle: Record<string, string> = {
  paid:    "border-emerald-500 text-emerald-600 dark:text-emerald-400",
  pending: "border-yellow-500  text-yellow-600  dark:text-yellow-400",
  overdue: "border-red-500     text-red-600     dark:text-red-400",
};

export default function SalesPage() {
  const supabase = createClient();

  // ── data ──────────────────────────────────────────────────────
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [latestRate,  setLatestRate]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── form visibility ───────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);

  // ── form fields ───────────────────────────────────────────────
  const [customerName,   setCustomerName]   = useState("");
  const [saleDate,       setSaleDate]       = useState(todayISO());
  const [trays,          setTrays]          = useState("");
  const [ratePerTray,    setRatePerTray]    = useState("");
  const [paymentStatus,  setPaymentStatus]  = useState("pending");
  const [notes,          setNotes]          = useState("");

  // ── live calc ─────────────────────────────────────────────────
  const rate      = parseFloat(ratePerTray) || 0;
  const traysNum  = parseFloat(trays) || 0;
  const gross     = +(traysNum * rate).toFixed(0);
  const netAmount = gross;

  // ── derived stats ─────────────────────────────────────────────
  const todaySalesCount = sales.filter((s) => s.sale_date === todayISO()).length;
  const totalRevenue    = sales.reduce((sum, s) => sum + s.net_amount, 0);
  const pendingAmount   = sales
    .filter((s) => s.payment_status === "pending" || s.payment_status === "overdue")
    .reduce((sum, s) => sum + s.net_amount, 0);

  // ── fetch latest egg rate once ────────────────────────────────
  useEffect(() => {
    supabase
      .from("egg_rates")
      .select("rate")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const r = Number(data.rate);
          setLatestRate(r);
          setRatePerTray(String(r));
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── pre-fill rate when form opens ─────────────────────────────
  useEffect(() => {
    if (showForm && latestRate !== null) {
      setRatePerTray(String(latestRate));
    }
  }, [showForm, latestRate]);

  // ── fetch today's sales ───────────────────────────────────────
  const fetchSales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("id, customer_name, sale_date, trays, rate_per_tray, gross_amount, net_amount, payment_status, notes")
      .eq("sale_date", todayISO())
      .order("created_at", { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }
    setSales(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // ── submit ────────────────────────────────────────────────────
  async function handleSave() {
    if (!customerName.trim()) { setError("Customer name is required."); return; }
    if (traysNum <= 0)        { setError("Quantity must be greater than 0."); return; }
    if (rate <= 0)            { setError("Rate must be greater than 0."); return; }

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("sales").insert({
      customer_name:  customerName.trim(),
      sale_date:      saleDate,
      trays:          traysNum,
      rate_per_tray:  rate,
      gross_amount:   gross,
      net_amount:     netAmount,
      payment_status: paymentStatus,
      notes:          notes.trim() || null,
    });

    setSaving(false);
    if (error) { setError(error.message); return; }

    setSaved(true);
    // reset form
    setCustomerName("");
    setTrays("");
    setNotes("");
    setPaymentStatus("pending");
    if (latestRate !== null) setRatePerTray(String(latestRate));
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1800);
    await fetchSales();
  }

  // ── mark as paid ──────────────────────────────────────────────
  async function markPaid(id: string) {
    const { error } = await supabase
      .from("sales")
      .update({ payment_status: "paid" })
      .eq("id", id);
    if (error) { setError(error.message); return; }
    await fetchSales();
  }

  return (
    <>
      <Header title="Sales" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Sales</p>
                <p className="text-xl font-bold mt-0.5 text-blue-500">{todaySalesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Revenue</p>
                <p className="text-xl font-bold mt-0.5 text-emerald-500">
                  ₨ {totalRevenue.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Payments</p>
                <p className="text-xl font-bold mt-0.5 text-yellow-500">
                  ₨ {pendingAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate info bar + New Sale button */}
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400/30 px-4 py-2.5">
          <span className="text-lg">🥚</span>
          <div className="flex items-baseline gap-2 flex-1">
            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">Current Market Rate:</span>
            {latestRate !== null ? (
              <>
                <span className="text-base font-black text-yellow-700 dark:text-yellow-300">
                  ₨{latestRate.toLocaleString()}/tray
                </span>
                <span className="text-xs text-yellow-600/70 dark:text-yellow-500/70 font-mono">
                  · ₨{(latestRate / 30).toFixed(2)}/egg · ₨{(latestRate * 12).toLocaleString()}/patti
                </span>
              </>
            ) : (
              <span className="text-xs text-yellow-600/60">Loading…</span>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New Sale
          </button>
        </div>

        {/* New Sale Form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> New Sale
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Customer Name</Label>
                  <Input
                    type="text"
                    placeholder="Customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity (trays)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={trays}
                    onChange={(e) => setTrays(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rate per Tray (₨)</Label>
                  <Input
                    type="number"
                    value={ratePerTray}
                    onChange={(e) => setRatePerTray(e.target.value)}
                    className="h-8 text-xs font-bold"
                  />
                  {latestRate !== null && rate !== latestRate && rate > 0 && (
                    <p className={`text-[10px] font-semibold ${rate < latestRate ? "text-orange-500" : "text-emerald-500"}`}>
                      {rate < latestRate
                        ? `↓ ₨${latestRate - rate} below market`
                        : `↑ ₨${rate - latestRate} above market`}
                    </p>
                  )}
                </div>
              </div>

              {/* Live invoice summary */}
              {traysNum > 0 && rate > 0 && (
                <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Invoice Summary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Trays</p>
                      <p className="font-bold text-sm">{traysNum}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gross (₨)</p>
                      <p className="font-bold text-sm">{gross.toLocaleString()}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Net Amount (₨)</p>
                      <p className="font-black text-base text-primary">{netAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(v) => v && setPaymentStatus(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    type="text"
                    placeholder="Optional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {saving ? "Saving…" : saved ? "✓ Saved!" : "Create Sale"}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Sales Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today&apos;s Sales</CardTitle>
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
            {loading ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Loading…</p>
            ) : sales.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">No sales recorded today.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Trays</TableHead>
                    <TableHead className="text-right">Rate (₨)</TableHead>
                    <TableHead className="text-right">Amount (₨)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{s.customer_name}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{s.trays}</TableCell>
                      <TableCell className="text-right text-xs">₨{Number(s.rate_per_tray).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs font-bold">₨{Number(s.net_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusStyle[s.payment_status] ?? ""}`}
                        >
                          {s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.notes ?? "—"}</TableCell>
                      <TableCell>
                        {s.payment_status !== "paid" && (
                          <button
                            onClick={() => markPaid(s.id)}
                            className="text-[10px] text-emerald-500 hover:underline whitespace-nowrap font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </main>
    </>
  );
}
