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
import { ShoppingBag, Wheat, FlaskConical, Clock } from "lucide-react";

const stats = [
  { label: "This Month Total", value: "₨ 3,20,000", icon: ShoppingBag, color: "text-blue-500" },
  { label: "Feed Purchases", value: "₨ 2,40,000", icon: Wheat, color: "text-green-500" },
  { label: "Medicine Purchases", value: "₨ 48,000", icon: FlaskConical, color: "text-purple-500" },
  { label: "Pending Bills", value: "₨ 75,000", icon: Clock, color: "text-red-500" },
];

const purchases = [
  {
    date: "2026-07-30",
    type: "Feed",
    item: "Layer Mash (Starter) 50kg",
    qty: "80 bags",
    rate: "₨ 900",
    amount: 72000,
    supplier: "Aftab Feed Mills",
    status: "paid",
  },
  {
    date: "2026-07-29",
    type: "Feed",
    item: "Maize (Broken) 50kg",
    qty: "60 bags",
    rate: "₨ 700",
    amount: 42000,
    supplier: "Punjab Grain Co.",
    status: "paid",
  },
  {
    date: "2026-07-27",
    type: "Medicine",
    item: "Newcastle Disease Vaccine",
    qty: "500 doses",
    rate: "₨ 60",
    amount: 30000,
    supplier: "Ceva Pakistan",
    status: "paid",
  },
  {
    date: "2026-07-25",
    type: "Feed",
    item: "Layer Pellet (Grower) 50kg",
    qty: "100 bags",
    rate: "₨ 950",
    amount: 95000,
    supplier: "Aftab Feed Mills",
    status: "pending",
  },
  {
    date: "2026-07-22",
    type: "Medicine",
    item: "Vitamin AD3E Solution",
    qty: "5 L",
    rate: "₨ 3,600",
    amount: 18000,
    supplier: "Sanofi Pak Ltd.",
    status: "paid",
  },
  {
    date: "2026-07-20",
    type: "Equipment",
    item: "Water Nipple Drinkers (set)",
    qty: "4 sets",
    rate: "₨ 8,000",
    amount: 32000,
    supplier: "Agro Tools Lahore",
    status: "pending",
  },
];

export default function PurchasesPage() {
  return (
    <>
      <Header title="Purchases" />
      <main className="flex-1 p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold mt-0.5 leading-tight">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Purchase Orders</h2>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + New Purchase
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Amount (₨)</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{p.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{p.item}</TableCell>
                    <TableCell className="text-xs">{p.qty}</TableCell>
                    <TableCell className="text-xs">{p.rate}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{p.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.supplier}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        }
                      >
                        {p.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button className="text-xs text-primary hover:underline">View</button>
                        <button className="text-xs text-muted-foreground hover:underline">Edit</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
