import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Home, Bird, User } from "lucide-react";

const stats = [
  { label: "Total Farms", value: "3" },
  { label: "Active", value: "2" },
  { label: "Total Sheds", value: "9" },
  { label: "Total Capacity", value: "1,25,000" },
];

const farms = [
  {
    id: 1,
    name: "Green Valley Farm",
    location: "Faisalabad",
    sheds: 4,
    birds: 48200,
    capacity: 60000,
    manager: "Ali Hassan",
    status: "active",
    code: "GVF-01",
  },
  {
    id: 2,
    name: "Sunrise Poultry",
    location: "Gujranwala",
    sheds: 3,
    birds: 31500,
    capacity: 45000,
    manager: "Usman Khan",
    status: "active",
    code: "SPF-02",
  },
  {
    id: 3,
    name: "Al-Noor Farm",
    location: "Lahore",
    sheds: 2,
    birds: 0,
    capacity: 20000,
    manager: "Tariq Mehmood",
    status: "inactive",
    code: "ANF-03",
  },
];

export default function FarmsPage() {
  return (
    <>
      <Header title="Farms" />
      <main className="flex-1 p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Farms</h2>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Add Farm
          </button>
        </div>

        {/* Farm Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{farm.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{farm.code}</p>
                    </div>
                  </div>
                  <Badge
                    variant={farm.status === "active" ? "default" : "secondary"}
                    className={
                      farm.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {farm.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{farm.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Home className="h-3.5 w-3.5" />
                      Sheds
                    </div>
                    <p className="text-sm font-semibold">{farm.sheds}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Bird className="h-3.5 w-3.5" />
                      Birds
                    </div>
                    <p className="text-sm font-semibold">{farm.birds.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {farm.manager}
                  </div>
                  <span className="text-muted-foreground">
                    Cap: {farm.capacity.toLocaleString()}
                  </span>
                </div>
                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Occupancy</span>
                    <span>{farm.capacity > 0 ? Math.round((farm.birds / farm.capacity) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${farm.capacity > 0 ? Math.min(100, Math.round((farm.birds / farm.capacity) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
