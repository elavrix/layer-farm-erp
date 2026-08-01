"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────

type NotifLevel = "alert" | "warning" | "info";
type FilterTab = "all" | NotifLevel;

interface Notification {
  id: string;
  level: NotifLevel;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

// ─── Level config ─────────────────────────────────────────────

const levelConfig: Record<
  NotifLevel,
  {
    icon: React.ElementType;
    badgeClass: string;
    iconClass: string;
    label: string;
  }
> = {
  alert: {
    icon: AlertCircle,
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    iconClass: "text-red-500",
    label: "Alert",
  },
  warning: {
    icon: AlertTriangle,
    badgeClass:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    iconClass: "text-yellow-500",
    label: "Warning",
  },
  info: {
    icon: Info,
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    iconClass: "text-blue-500",
    label: "Info",
  },
};

// ─── Helpers ──────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }
  return `${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}, ${timeStr}`;
}

// ─── Data fetching ────────────────────────────────────────────

async function fetchNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const notifications: Notification[] = [];
  const today = todayISO();

  // ── 1. Low feed stock (warning) ───────────────────────────
  {
    // Supabase JS client doesn't support column-to-column comparisons,
    // so we fetch all rows with reorder_level > 0 and filter in JS.
    const { data: feedRows } = await supabase
      .from("inventory_feed")
      .select("id, name, stock, reorder_level, unit")
      .gt("reorder_level", 0);

    if (feedRows) {
      for (const row of feedRows) {
        if (row.stock <= row.reorder_level) {
          notifications.push({
            id: `feed-low-${row.id}`,
            level: "warning",
            title: `Low Feed Stock — ${row.name}`,
            description: `${row.name} stock is at or below the reorder level. Current: ${row.stock} ${row.unit ?? "units"}, Reorder point: ${row.reorder_level} ${row.unit ?? "units"}.`,
            time: formatDate(new Date().toISOString()),
            read: false,
          });
        }
      }
    }
  }

  // ── 2a. Expired medicine (alert) ──────────────────────────
  {
    const { data: expiredMeds } = await supabase
      .from("inventory_medicine")
      .select("id, name, qty, expiry_date")
      .lte("expiry_date", today);

    if (expiredMeds) {
      for (const med of expiredMeds) {
        notifications.push({
          id: `med-expired-${med.id}`,
          level: "alert",
          title: `Medicine Expired — ${med.name}`,
          description: `${med.name} (${med.qty ?? "unknown qty"}) expired on ${med.expiry_date}. Please dispose of safely and reorder.`,
          time: formatDate(new Date(med.expiry_date).toISOString()),
          read: false,
        });
      }
    }
  }

  // ── 2b. Medicine expiring within 30 days (warning) ────────
  {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysISO = thirtyDaysFromNow.toISOString().split("T")[0];

    const { data: expiringMeds } = await supabase
      .from("inventory_medicine")
      .select("id, name, qty, expiry_date")
      .gt("expiry_date", today)
      .lte("expiry_date", thirtyDaysISO);

    if (expiringMeds) {
      for (const med of expiringMeds) {
        const daysLeft = Math.ceil(
          (new Date(med.expiry_date).getTime() - Date.now()) / 86_400_000
        );
        notifications.push({
          id: `med-expiring-${med.id}`,
          level: "warning",
          title: `Medicine Expiring Soon — ${med.name}`,
          description: `${med.name} (${med.qty ?? "unknown qty"}) expires on ${med.expiry_date} — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining. Consider reordering.`,
          time: formatDate(new Date().toISOString()),
          read: false,
        });
      }
    }
  }

  // ── 3. High mortality today (alert) ───────────────────────
  {
    const { data: mortalityRows } = await supabase
      .from("daily_entries")
      .select("id, entry_date, mortality, sheds(name, capacity)")
      .eq("entry_date", today)
      .gte("mortality", 5);

    if (mortalityRows) {
      for (const row of mortalityRows) {
        const shedName =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (row.sheds as any)?.name ?? "Unknown Shed";
        notifications.push({
          id: `mortality-${row.id}`,
          level: "alert",
          title: `High Mortality — ${shedName}`,
          description: `${row.mortality} bird${row.mortality === 1 ? "" : "s"} died in ${shedName} today (${today}). Immediate inspection recommended.`,
          time: formatDate(new Date().toISOString()),
          read: false,
        });
      }
    }
  }

  // ── 4. Outstanding payments > 7 days (info) ───────────────
  {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString().split("T")[0];

    const { data: pendingSales } = await supabase
      .from("sales")
      .select("id, customer_name, payment_status, sale_date, total_amount")
      .eq("payment_status", "pending")
      .lte("sale_date", sevenDaysAgoISO);

    if (pendingSales) {
      for (const sale of pendingSales) {
        const amount =
          sale.total_amount != null
            ? `₨ ${Number(sale.total_amount).toLocaleString("en-PK")}`
            : "amount unknown";
        notifications.push({
          id: `payment-${sale.id}`,
          level: "info",
          title: `Outstanding Payment — ${sale.customer_name}`,
          description: `${sale.customer_name} has a pending payment of ${amount} from ${sale.sale_date}. More than 7 days overdue.`,
          time: formatDate(new Date(sale.sale_date).toISOString()),
          read: false,
        });
      }
    }
  }

  // ── 5. Low production today (warning) ─────────────────────
  {
    const { data: productionRows } = await supabase
      .from("daily_entries")
      .select("id, entry_date, eggs_collected, sheds(name, capacity)")
      .eq("entry_date", today);

    if (productionRows) {
      for (const row of productionRows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shed = row.sheds as any;
        const capacity: number | null = shed?.capacity ?? null;
        const shedName: string = shed?.name ?? "Unknown Shed";

        if (capacity && capacity > 0 && row.eggs_collected != null) {
          const pct = (row.eggs_collected / capacity) * 100;
          if (pct < 80) {
            notifications.push({
              id: `production-${row.id}`,
              level: "warning",
              title: `Low Production — ${shedName}`,
              description: `${shedName} production is at ${pct.toFixed(1)}% today (${row.eggs_collected.toLocaleString()} eggs out of ${capacity.toLocaleString()} capacity). Below the 80% threshold.`,
              time: formatDate(new Date().toISOString()),
              read: false,
            });
          }
        }
      }
    }
  }

  return notifications;
}

// ─── Page Component ───────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    fetchNotifications()
      .then((data) => setNotifications(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.level === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const tabClass = (t: FilterTab) =>
    `px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
      filter === t
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <>
      <Header title="Notifications" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Notifications
            </h2>
            {!loading && unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[10px]">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {!loading && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <button className={tabClass("all")} onClick={() => setFilter("all")}>
            All ({notifications.length})
          </button>
          <button
            className={tabClass("alert")}
            onClick={() => setFilter("alert")}
          >
            Alerts ({notifications.filter((n) => n.level === "alert").length})
          </button>
          <button
            className={tabClass("warning")}
            onClick={() => setFilter("warning")}
          >
            Warnings (
            {notifications.filter((n) => n.level === "warning").length})
          </button>
          <button
            className={tabClass("info")}
            onClick={() => setFilter("info")}
          >
            Info ({notifications.filter((n) => n.level === "info").length})
          </button>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading notifications…
            </span>
          </div>
        )}

        {/* Notification List */}
        {!loading && (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {filter === "all"
                  ? "No new notifications. Everything looks good!"
                  : "No notifications in this category."}
              </div>
            )}
            {filtered.map((notif) => {
              const cfg = levelConfig[notif.level];
              const Icon = cfg.icon;
              return (
                <Card
                  key={notif.id}
                  className={`transition-all ${
                    notif.read
                      ? "opacity-70 bg-muted/30"
                      : "border-l-4 " +
                        (notif.level === "alert"
                          ? "border-l-red-500"
                          : notif.level === "warning"
                          ? "border-l-yellow-500"
                          : "border-l-blue-500")
                  }`}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold ${
                              notif.read
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {notif.title}
                          </p>
                          <Badge className={`${cfg.badgeClass} text-[10px]`}>
                            {cfg.label}
                          </Badge>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {/* Action */}
                    {!notif.read && (
                      <button
                        onClick={() => markRead(notif.id)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
