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
import { Users, ShieldCheck, UserCog, Eye, X, Copy, Check } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "manager" | "worker" | "viewer";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

// ── Role config ──────────────────────────────────────────────────────────────

const roleConfig: Record<Role, { label: string; badgeClass: string; description: string }> = {
  admin: {
    label: "Admin",
    badgeClass: "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
    description: "Full access, manage users",
  },
  manager: {
    label: "Manager",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    description: "Daily ops, sales, inventory",
  },
  worker: {
    label: "Worker",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    description: "Daily ops only",
  },
  viewer: {
    label: "Viewer",
    badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    description: "Read only",
  },
};

const ALL_ROLES: Role[] = ["admin", "manager", "worker", "viewer"];

// ── Helper ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Invite form state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("worker");
  const [invitePassword, setInvitePassword] = useState(() => generateTempPassword());
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Row-level update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Fetch users ────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setUsers((data as UserProfile[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Stats derived from live data ───────────────────────────────────────────

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const activeCount = users.filter((u) => u.is_active).length;

  // ── Change role inline ─────────────────────────────────────────────────────

  async function handleRoleChange(userId: string, newRole: Role) {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setUpdatingId(null);
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function handleToggleActive(userId: string, current: boolean) {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_active: !current })
      .eq("id", userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !current } : u))
      );
    }
    setUpdatingId(null);
  }

  // ── Invite user ────────────────────────────────────────────────────────────

  function openInvite() {
    setShowInvite(true);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("worker");
    setInvitePassword(generateTempPassword());
    setInviteError(null);
    setInviteSuccess(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    const { error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: invitePassword,
      options: {
        data: { name: inviteName, role: inviteRole },
      },
    });

    if (error) {
      setInviteError(error.message);
      setInviteLoading(false);
      return;
    }

    setInviteSuccess({ name: inviteName, email: inviteEmail, password: invitePassword });
    setInviteLoading(false);
    // Refresh the user list after a brief pause so the DB trigger has time to insert
    setTimeout(fetchUsers, 1000);
  }

  function handleCopyPassword() {
    if (!inviteSuccess) return;
    navigator.clipboard.writeText(inviteSuccess.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Header title="User Management" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users",    value: String(totalUsers),   icon: Users,      color: "text-blue-500" },
            { label: "Admins",         value: String(adminCount),   icon: ShieldCheck, color: "text-gray-700 dark:text-gray-300" },
            { label: "Managers",       value: String(managerCount), icon: UserCog,    color: "text-blue-500" },
            { label: "Active",         value: String(activeCount),  icon: Eye,        color: "text-green-500" },
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

        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">All Users</h2>
          {!showInvite && (
            <button
              onClick={openInvite}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Invite User
            </button>
          )}
        </div>

        {/* ── Invite form ─────────────────────────────────────────────────── */}
        {showInvite && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Invite New User
              </CardTitle>
              <button
                onClick={() => { setShowInvite(false); setInviteSuccess(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {inviteSuccess ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-400/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      User invited successfully!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Share the following temporary password with{" "}
                      <span className="font-semibold text-foreground">{inviteSuccess.name}</span>{" "}
                      ({inviteSuccess.email}). They should change it after first login.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono font-bold tracking-wider">
                        {inviteSuccess.password}
                      </code>
                      <button
                        onClick={handleCopyPassword}
                        className="flex items-center gap-1 rounded-md border border-border px-2.5 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openInvite}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Invite Another
                    </button>
                    <button
                      onClick={() => { setShowInvite(false); setInviteSuccess(null); }}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Invite form */
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Ali Hassan"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Role</Label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="admin">Admin — Full access, manage users</option>
                        <option value="manager">Manager — Daily ops, sales, inventory</option>
                        <option value="worker">Worker — Daily ops only</option>
                        <option value="viewer">Viewer — Read only</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Temporary Password</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          required
                          className="h-8 text-xs font-mono flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setInvitePassword(generateTempPassword())}
                          className="rounded-md border border-border px-2.5 text-xs hover:bg-muted transition-colors whitespace-nowrap"
                        >
                          Regenerate
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Share this with the user — they must change it after first login.
                      </p>
                    </div>
                  </div>

                  {inviteError && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                      {inviteError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {inviteLoading ? "Inviting..." : "Send Invite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="rounded-md border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── User table ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> User Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Loading users...
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-destructive">
                <p>Failed to load users: {fetchError}</p>
                <button
                  onClick={fetchUsers}
                  className="text-xs text-primary underline"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Users className="h-8 w-8 opacity-30" />
                <p>No users yet.</p>
                <button
                  onClick={openInvite}
                  className="text-xs text-primary underline"
                >
                  Invite your first user
                </button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const role = roleConfig[u.role] ?? roleConfig.viewer;
                    const busy = updatingId === u.id;
                    return (
                      <TableRow key={u.id} className={busy ? "opacity-60" : undefined}>
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                              {initials(u.name)}
                            </div>
                            <span className="text-xs font-semibold">{u.name}</span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-xs text-muted-foreground">
                          {u.email}
                        </TableCell>

                        {/* Role — inline dropdown */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge className={`${role.badgeClass} text-[10px] pointer-events-none`}>
                              {role.label}
                            </Badge>
                            <select
                              value={u.role}
                              disabled={busy}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                              className="rounded border border-input bg-background px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {roleConfig[r].label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            className={
                              u.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px]"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
                            }
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <button
                            disabled={busy}
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            className={`text-xs hover:underline transition-colors ${
                              u.is_active
                                ? "text-muted-foreground hover:text-destructive"
                                : "text-green-600 hover:text-green-700"
                            }`}
                          >
                            {busy ? "Saving..." : u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ── Role legend ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_ROLES.map((r) => {
                const cfg = roleConfig[r];
                return (
                  <div key={r} className="rounded-md border border-border p-3 space-y-1.5">
                    <Badge className={`${cfg.badgeClass} text-[10px]`}>{cfg.label}</Badge>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {cfg.description}
                    </p>
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
