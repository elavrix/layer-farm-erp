"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Wheat, FlaskConical, Package, X } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// Current month in YYYY-MM format
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

interface Purchase {
  id: string;
  item_name: string;
  category: "feed" | "medicine" | "equipment" | "other";
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  supplier: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
}

const categoryStyle: Record<string, string> = {
  feed:      "border-green-500  text-green-600  dark:text-green-400",
  medicine:  "border-purple-500 text-purple-600 dark:text-purple-400",
  equipment: "border-blue-500   text-blue-600   dark:text-blue-400",
  other:     "border-gray-400   text-gray-500   dark:text-gray-400",
};

export default function PurchasesPage() {
  const supabase = createClient();

  // ── data ──────────────────────────────────────────────────────────────────
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  // ── form visibility ───────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);

  // ── form fields ───────────────────────────────────────────────────────────
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [category,     setCategory]     = useState("feed");
  const [itemName,     setItemName]     = useState("");
  const [quantity,     setQuantity]     = useState("");
  const [unit,         setUnit]         = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [supplier,     setSupplier]     = useState("");
  const [notes,        setNotes]        = useState("");

  // ── live calc ─────────────────────────────────────────────────────────────
  const qtyNum   = parseFloat(quantity) || 0;
  const priceNum = parseFloat(pricePerUnit) || 0;
  const total    = +(qtyNum * priceNum).toFixed(2);

  // ── derived stats ─────────────────────────────────────────────────────────
  const month = currentMonth();
  const thisMonthPurchases = purchases.filter((p) => p.purchase_date.startsWith(month));
  const thisMonthTotal     = thisMonthPurchases.reduce((s, p) => s + p.total_amount, 0);
  const feedTotal          = purchases.filter((p) => p.category === "feed").reduce((s, p) => s + p.total_amount, 0);
  const medicineTotal      = purchases.filter((p) => p.category === "medicine").reduce((s, p) => s + p.total_amount, 0);
  const equipmentTotal     = purchases.filter((p) => p.category === "equipment").reduce((s, p) => s + p.total_amount, 0);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchases")
      .select("id, item_name, category, quantity, unit, price_per_unit, total_amount, supplier, purchase_date, notes, created_at")
      .order("purchase_date", { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }
    setPurchases(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!itemName.trim())  { setError("Item name is required."); return; }
    if (qtyNum <= 0)       { setError("Quantity must be greater than 0."); return; }
    if (priceNum <= 0)     { setError("Price per unit must be greater than 0."); return; }
    if (!unit.trim())      { setError("Unit is required."); return; }

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("purchases").insert({
      item_name:     itemName.trim(),
      category,
      quantity:      qtyNum,
      unit:          unit.trim(),
      price_per_unit: priceNum,
      total_amount:  total,
      supplier:      supplier.trim() || null,
      purchase_date: purchaseDate,
      notes:         notes.trim() || null,
    });

    setSaving(false);
    if (error) { setError(error.message); return; }

    setSaved(true);
    // reset form fields
    setItemName("");
    setQuantity("");
    setUnit("");
    setPricePerUnit("");
    setSupplier("");
    setNotes("");
    setCategory("feed");
    setPurchaseDate(todayISO());
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1800);
    await fetchPurchases();
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase record?")) return;
    setDeleting(id);
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    setDeleting(null);
    if (error) { setError(error.message); return; }
    await fetchPurchases();
  }

  return (
    <>
      <Header title="Purchases" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-0.5 text-blue-500"><ShoppingBag className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">This Month Total</p>
                <p className="text-lg font-bold mt-0.5 leading-tight">
                  {loading ? "—" : `₨ ${thisMonthTotal.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-0.5 text-green-500"><Wheat className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Feed Total</p>
                <p className="text-lg font-bold mt-0.5 leading-tight">
                  {loading ? "—" : `₨ ${feedTotal.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-0.5 text-purple-500"><FlaskConical className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Medicine Total</p>
                <p className="text-lg font-bold mt-0.5 leading-tight">
                  {loading ? "—" : `₨ ${medicineTotal.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="mt-0.5 text-orange-500"><Package className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Equipment Total</p>
                <p className="text-lg font-bold mt-0.5 leading-tight">
                  {loading ? "—" : `₨ ${equipmentTotal.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Purchase Orders</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + New Purchase
            </button>
          )}
        </div>

        {/* New Purchase Form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> New Purchase
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Row 1: Date + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Item Name + Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Item Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Layer Mash 50kg"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Supplier</Label>
                  <Input
                    type="text"
                    placeholder="Supplier name (optional)"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Quantity + Unit + Price/Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    type="text"
                    placeholder="bags / kg / L"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price / Unit (₨)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Live total */}
              {qtyNum > 0 && priceNum > 0 && (
                <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {qtyNum} {unit || "units"} × ₨{priceNum.toLocaleString()} =
                  </span>
                  <span className="text-base font-black text-primary">
                    ₨ {total.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Notes */}
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

              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {saving ? "Saving…" : saved ? "✓ Saved!" : "Add Purchase"}
              </button>

            </CardContent>
          </Card>
        )}

        {/* Purchases Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Loading…</p>
            ) : purchases.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-8 text-center">
                No purchases yet. Click <strong>New Purchase</strong> to add.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price/Unit (₨)</TableHead>
                    <TableHead className="text-right">Total (₨)</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs whitespace-nowrap">{p.purchase_date}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${categoryStyle[p.category] ?? ""}`}
                        >
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{p.item_name}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{p.quantity}</TableCell>
                      <TableCell className="text-xs">{p.unit}</TableCell>
                      <TableCell className="text-right text-xs">
                        {Number(p.price_per_unit).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {Number(p.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.supplier ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {p.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="text-xs text-red-500 hover:underline disabled:opacity-40"
                        >
                          {deleting === p.id ? "…" : "Delete"}
                        </button>
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
