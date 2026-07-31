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
import { Bird } from "lucide-react";

const stats = [
  { label: "Active Flocks", value: "4" },
  { label: "Total Birds", value: "48,200" },
  { label: "Avg Age (weeks)", value: "42" },
  { label: "Avg Production", value: "87%" },
];

const flocks = [
  {
    batch: "FL-2024-01",
    breed: "Hy-Line Brown",
    arrival: "2024-02-10",
    age: 44,
    birds: 12800,
    shed: "Shed A",
    farm: "Green Valley",
    supplier: "Pak Breeders Ltd.",
    status: "active",
    production: 89,
  },
  {
    batch: "FL-2024-02",
    breed: "Lohmann LSL",
    arrival: "2024-03-01",
    age: 42,
    birds: 11200,
    shed: "Shed B",
    farm: "Green Valley",
    supplier: "Punjab Poultry House",
    status: "active",
    production: 86,
  },
  {
    batch: "FL-2024-03",
    breed: "Hy-Line Brown",
    arrival: "2024-03-15",
    age: 41,
    birds: 12800,
    shed: "Shed C",
    farm: "Green Valley",
    supplier: "Pak Breeders Ltd.",
    status: "active",
    production: 88,
  },
  {
    batch: "FL-2024-04",
    breed: "Babcock B-380",
    arrival: "2024-03-22",
    age: 40,
    birds: 11400,
    shed: "Shed D",
    farm: "Green Valley",
    supplier: "Al-Raheem Hatchery",
    status: "active",
    production: 85,
  },
  {
    batch: "FL-2024-05",
    breed: "Lohmann Brown",
    arrival: "2024-04-05",
    age: 38,
    birds: 10500,
    shed: "Shed 1",
    farm: "Sunrise Poultry",
    supplier: "Punjab Poultry House",
    status: "active",
    production: 84,
  },
  {
    batch: "FL-2023-08",
    breed: "Hy-Line W-36",
    arrival: "2023-08-12",
    age: 72,
    birds: 9800,
    shed: "Shed 2",
    farm: "Sunrise Poultry",
    supplier: "Pak Breeders Ltd.",
    status: "retiring",
    production: 62,
  },
];

export default function FlocksPage() {
  return (
    <>
      <Header title="Flocks" />
      <main className="flex-1 p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Flock Batches</h2>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Add Flock
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bird className="h-4 w-4 text-primary" />
              Flock Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch No</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Arrival Date</TableHead>
                  <TableHead className="text-right">Age (wks)</TableHead>
                  <TableHead className="text-right">Bird Count</TableHead>
                  <TableHead>Shed</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Prod %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flocks.map((f) => (
                  <TableRow key={f.batch}>
                    <TableCell className="font-mono text-xs font-semibold">{f.batch}</TableCell>
                    <TableCell className="text-xs">{f.breed}</TableCell>
                    <TableCell className="text-xs">{f.arrival}</TableCell>
                    <TableCell className="text-right text-xs">{f.age}</TableCell>
                    <TableCell className="text-right text-xs">{f.birds.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{f.shed}</TableCell>
                    <TableCell className="text-xs">{f.farm}</TableCell>
                    <TableCell className="text-xs">{f.supplier}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs font-semibold ${
                          f.production >= 80
                            ? "text-green-600 dark:text-green-400"
                            : f.production >= 70
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {f.production}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          f.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                        }
                      >
                        {f.status === "active" ? "Active" : "Retiring"}
                      </Badge>
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
