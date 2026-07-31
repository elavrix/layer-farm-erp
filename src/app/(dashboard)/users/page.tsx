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
import { Users, ShieldCheck, UserCog, Monitor } from "lucide-react";

const stats = [
  { label: "Total Users", value: "8", icon: Users, color: "text-blue-500" },
  { label: "Owners", value: "1", icon: ShieldCheck, color: "text-purple-500" },
  { label: "Managers", value: "2", icon: UserCog, color: "text-green-500" },
  { label: "Active Sessions", value: "3", icon: Monitor, color: "text-orange-500" },
];

const roleConfig: Record<string, { label: string; class: string }> = {
  owner: { label: "Owner", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" },
  admin: { label: "Admin", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  manager: { label: "Manager", class: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  operator: { label: "Operator", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" },
  viewer: { label: "Viewer", class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const users = [
  {
    name: "Muhammad Faisal",
    email: "faisal@greenvallyfarm.pk",
    role: "owner",
    farmAccess: "All Farms",
    lastLogin: "Today, 08:30 AM",
    status: "active",
  },
  {
    name: "Ali Hassan",
    email: "ali.hassan@greenvallyfarm.pk",
    role: "manager",
    farmAccess: "Green Valley Farm",
    lastLogin: "Today, 07:45 AM",
    status: "active",
  },
  {
    name: "Usman Khan",
    email: "usman.khan@sunrisepoultry.pk",
    role: "manager",
    farmAccess: "Sunrise Poultry",
    lastLogin: "Yesterday, 06:00 PM",
    status: "active",
  },
  {
    name: "Tariq Mehmood",
    email: "tariq.m@alnoor.pk",
    role: "operator",
    farmAccess: "Al-Noor Farm",
    lastLogin: "2026-07-25, 10:15 AM",
    status: "inactive",
  },
  {
    name: "Rizwan Ahmed",
    email: "rizwan@greenvallyfarm.pk",
    role: "operator",
    farmAccess: "Green Valley Farm",
    lastLogin: "Today, 09:00 AM",
    status: "active",
  },
  {
    name: "Asif Iqbal",
    email: "asif.iqbal@greenvallyfarm.pk",
    role: "viewer",
    farmAccess: "Green Valley Farm",
    lastLogin: "2026-07-28, 02:30 PM",
    status: "inactive",
  },
];

export default function UsersPage() {
  return (
    <>
      <Header title="User Management" />
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
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Users</h2>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Invite User
          </button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              User Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Farm Access</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const role = roleConfig[u.role];
                  return (
                    <TableRow key={u.email}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={`${role.class} text-[10px]`}>{role.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{u.farmAccess}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.lastLogin}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            u.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px]"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
                          }
                        >
                          {u.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3">
                          <button className="text-xs text-primary hover:underline">Edit</button>
                          <button className="text-xs text-muted-foreground hover:underline hover:text-destructive transition-colors">
                            {u.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { role: "owner", perms: "Full access — all farms, settings, financials" },
                { role: "admin", perms: "All modules except billing & ownership" },
                { role: "manager", perms: "Daily ops, inventory, reports for assigned farm" },
                { role: "operator", perms: "Daily ops entry and inventory updates only" },
                { role: "viewer", perms: "Read-only access to reports and dashboards" },
              ].map((r) => {
                const cfg = roleConfig[r.role];
                return (
                  <div key={r.role} className="rounded-md border border-border p-3 space-y-1">
                    <Badge className={`${cfg.class} text-[10px]`}>{cfg.label}</Badge>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{r.perms}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
