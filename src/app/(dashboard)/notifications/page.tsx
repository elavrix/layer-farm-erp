"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
} from "lucide-react";

type NotifLevel = "alert" | "warning" | "info";
type FilterTab = "all" | NotifLevel;

interface Notification {
  id: number;
  level: NotifLevel;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    level: "alert",
    title: "High Mortality — Shed A",
    description: "5 birds died in Shed A (FL-2024-01) over the last 24 hours. Immediate inspection recommended.",
    time: "Today, 08:15 AM",
    read: false,
  },
  {
    id: 2,
    level: "warning",
    title: "Low Feed Stock",
    description: "Layer Mash (Starter) stock is below reorder level. Current: 240 bags, Reorder point: 100 bags.",
    time: "Today, 07:30 AM",
    read: false,
  },
  {
    id: 3,
    level: "alert",
    title: "Medicine Expiry — Enrofloxacin 10%",
    description: "Enrofloxacin 10% (1.5 L) expired on 2026-07-20. Please dispose of safely and reorder.",
    time: "Yesterday, 06:00 AM",
    read: false,
  },
  {
    id: 4,
    level: "warning",
    title: "Vaccination Due — FL-2024-03",
    description: "Flock batch FL-2024-03 (Shed C) is due for Newcastle Disease booster vaccination within 7 days.",
    time: "Yesterday, 10:00 AM",
    read: false,
  },
  {
    id: 5,
    level: "warning",
    title: "Low Production — Shed B",
    description: "Shed B production dropped to 82% today, below the 85% target. Check water supply and ventilation.",
    time: "2026-07-30, 04:00 PM",
    read: false,
  },
  {
    id: 6,
    level: "info",
    title: "Outstanding Payment — Ali Traders",
    description: "Ali Traders has an outstanding balance of ₨ 1,20,000. Last sale: INV-2026-087 dated 31 Jul 2026.",
    time: "2026-07-31, 09:00 AM",
    read: true,
  },
  {
    id: 7,
    level: "info",
    title: "New Sale Invoice — INV-2026-087",
    description: "Sale of 40 trays to Ali Traders for ₨ 42,000 recorded successfully. Payment: Cash.",
    time: "2026-07-31, 09:45 AM",
    read: true,
  },
  {
    id: 8,
    level: "info",
    title: "System Backup Completed",
    description: "Automatic daily backup completed successfully at 02:00 AM. All data is safe and up to date.",
    time: "Today, 02:00 AM",
    read: true,
  },
];

const levelConfig: Record<NotifLevel, { icon: React.ElementType; badgeClass: string; iconClass: string; label: string }> = {
  alert: {
    icon: AlertCircle,
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    iconClass: "text-red-500",
    label: "Alert",
  },
  warning: {
    icon: AlertTriangle,
    badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    iconClass: "text-yellow-500",
    label: "Warning",
  },
  info: {
    icon: Info,
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    iconClass: "text-blue-500",
    label: "Info",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.level === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: number) {
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
      <main className="flex-1 p-6 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[10px]">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
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
          <button className={tabClass("alert")} onClick={() => setFilter("alert")}>
            Alerts ({notifications.filter((n) => n.level === "alert").length})
          </button>
          <button className={tabClass("warning")} onClick={() => setFilter("warning")}>
            Warnings ({notifications.filter((n) => n.level === "warning").length})
          </button>
          <button className={tabClass("info")} onClick={() => setFilter("info")}>
            Info ({notifications.filter((n) => n.level === "info").length})
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No notifications in this category.
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
                        <p className={`text-sm font-semibold ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>
                          {notif.title}
                        </p>
                        <Badge className={`${cfg.badgeClass} text-[10px]`}>{cfg.label}</Badge>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
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
      </main>
    </>
  );
}
