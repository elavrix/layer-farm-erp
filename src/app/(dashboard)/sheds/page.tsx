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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";

type Shed = { id: number; name: string; capacity: number; birds: number; batch: string; status: string };

const farmSheds: Record<string, Shed[]> = {
  "green-valley": [
    { id: 1, name: "Shed A", capacity: 15000, birds: 12800, batch: "FL-2024-01", status: "active" },
    { id: 2, name: "Shed B", capacity: 15000, birds: 11200, batch: "FL-2024-02", status: "active" },
    { id: 3, name: "Shed C", capacity: 15000, birds: 12800, batch: "FL-2024-03", status: "active" },
    { id: 4, name: "Shed D", capacity: 15000, birds: 11400, batch: "FL-2024-04", status: "active" },
  ],
  sunrise: [
    { id: 5, name: "Shed 1", capacity: 15000, birds: 10500, batch: "FL-2024-05", status: "active" },
    { id: 6, name: "Shed 2", capacity: 15000, birds: 11000, batch: "FL-2024-06", status: "active" },
    { id: 7, name: "Shed 3", capacity: 15000, birds: 10000, batch: "FL-2024-07", status: "active" },
  ],
  alnoor: [
    { id: 8, name: "Shed I", capacity: 10000, birds: 0, batch: "—", status: "inactive" },
    { id: 9, name: "Shed II", capacity: 10000, birds: 0, batch: "—", status: "inactive" },
  ],
};

const farmLabels: Record<string, string> = {
  "green-valley": "Green Valley Farm",
  sunrise: "Sunrise Poultry",
  alnoor: "Al-Noor Farm",
};

export default function ShedsPage() {
  const [selectedFarm, setSelectedFarm] = useState("green-valley");
  const rows = farmSheds[selectedFarm] ?? [];

  return (
    <>
      <Header title="Sheds" />
      <main className="flex-1 p-6 space-y-5">
        {/* Filter Row */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Farm</Label>
              <Select value={selectedFarm} onValueChange={(v) => v && setSelectedFarm(v)}>
                <SelectTrigger className="w-52 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green-valley">Green Valley Farm</SelectItem>
                  <SelectItem value="sunrise">Sunrise Poultry</SelectItem>
                  <SelectItem value="alnoor">Al-Noor Farm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                + Add Shed
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Sheds</p>
              <p className="text-2xl font-bold">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Active Sheds</p>
              <p className="text-2xl font-bold">{rows.filter((r) => r.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Birds</p>
              <p className="text-2xl font-bold">{rows.reduce((a, r) => a + r.birds, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">{rows.reduce((a, r) => a + r.capacity, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Home className="h-4 w-4 text-primary" />
              Sheds — {farmLabels[selectedFarm]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shed Name</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Current Birds</TableHead>
                  <TableHead>Flock Batch</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((shed) => {
                  const occ = shed.capacity > 0 ? Math.round((shed.birds / shed.capacity) * 100) : 0;
                  return (
                    <TableRow key={shed.id}>
                      <TableCell className="font-medium">{shed.name}</TableCell>
                      <TableCell className="text-right">{shed.capacity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{shed.birds.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{shed.batch}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${occ}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{occ}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            shed.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {shed.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button className="text-xs text-primary hover:underline">View</button>
                          <button className="text-xs text-muted-foreground hover:underline">Edit</button>
                        </div>
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
