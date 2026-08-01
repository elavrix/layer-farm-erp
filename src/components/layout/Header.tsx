"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Bell, Menu, LogOut, Settings, AlertCircle, AlertTriangle, Info, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useMobileMenu } from "@/app/(dashboard)/layout";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps { title: string }

interface NotifItem {
  id: string;
  level: "alert" | "warning" | "info";
  title: string;
  description: string;
}

export function Header({ title }: HeaderProps) {
  const openMenu = useMobileMenu();
  const router   = useRouter();
  const supabase = createClient();

  const [userName,   setUserName]   = useState("User");
  const [userRole,   setUserRole]   = useState("");
  const [initials,   setInitials]   = useState("U");
  const [notifs,     setNotifs]     = useState<NotifItem[]>([]);
  const [bellOpen,   setBellOpen]   = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      // ── Current user ──────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      const name = profile?.name || user.email?.split("@")[0] || "User";
      const role = profile?.role || "";
      setUserName(name);
      setUserRole(role);
      setInitials(name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));

      // ── Build notifications ───────────────────────────────
      const today    = new Date().toISOString().split("T")[0];
      const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const list: NotifItem[] = [];

      // 1. Low feed stock
      const { data: feedItems } = await supabase
        .from("inventory_feed")
        .select("name, stock, reorder_level")
        .gt("reorder_level", 0);
      (feedItems ?? []).filter(f => f.stock <= f.reorder_level).forEach(f => {
        list.push({
          id: `feed-${f.name}`,
          level: "warning",
          title: "Low Feed Stock",
          description: `${f.name} — only ${f.stock} left (reorder at ${f.reorder_level})`,
        });
      });

      // 2. Expired medicine
      const { data: expired } = await supabase
        .from("inventory_medicine")
        .select("name, expiry_date")
        .lt("expiry_date", today);
      (expired ?? []).forEach(m => {
        list.push({
          id: `exp-${m.name}`,
          level: "alert",
          title: "Medicine Expired",
          description: `${m.name} expired on ${m.expiry_date}`,
        });
      });

      // 3. Expiring soon (within 30 days)
      const { data: expiring } = await supabase
        .from("inventory_medicine")
        .select("name, expiry_date")
        .gte("expiry_date", today)
        .lte("expiry_date", in30days);
      (expiring ?? []).forEach(m => {
        const days = Math.round((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
        list.push({
          id: `soon-${m.name}`,
          level: "warning",
          title: "Medicine Expiring Soon",
          description: `${m.name} expires in ${days} day${days !== 1 ? "s" : ""}`,
        });
      });

      // 4. High mortality today
      const { data: mortality } = await supabase
        .from("daily_entries")
        .select("mortality, sheds(name)")
        .eq("entry_date", today)
        .gte("mortality", 5);
      (mortality ?? []).forEach((e) => {
        const shed = (e.sheds as unknown as { name: string } | null)?.name ?? "a shed";
        list.push({
          id: `mort-${shed}`,
          level: "alert",
          title: "High Mortality",
          description: `${e.mortality} birds died in ${shed} today`,
        });
      });

      // 5. Pending payments older than 7 days
      const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const { data: overdue } = await supabase
        .from("sales")
        .select("customer_name, net_amount, sale_date")
        .eq("payment_status", "pending")
        .lte("sale_date", cutoff)
        .limit(3);
      (overdue ?? []).forEach(s => {
        list.push({
          id: `pay-${s.customer_name}-${s.sale_date}`,
          level: "info",
          title: "Overdue Payment",
          description: `${s.customer_name} — ₨${Number(s.net_amount).toLocaleString()} pending since ${s.sale_date}`,
        });
      });

      setNotifs(list);
    }
    load();
  }, [supabase]);

  // Close popups on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const levelIcon = (level: NotifItem["level"]) => {
    if (level === "alert")   return <AlertCircle   className="h-4 w-4 shrink-0 text-red-500" />;
    if (level === "warning") return <AlertTriangle  className="h-4 w-4 shrink-0 text-yellow-500" />;
    return                          <Info           className="h-4 w-4 shrink-0 text-blue-500" />;
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">

      {/* Hamburger — mobile only */}
      <button
        onClick={openMenu}
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      <h1 className="text-sm font-semibold text-foreground flex-1 truncate">{title}</h1>

      {/* Dark mode toggle */}
      <ThemeToggle />

      {/* ── Notification Bell popup ── */}
      <div ref={bellRef} className="relative">
        <button
          onClick={() => setBellOpen(o => !o)}
          className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          {notifs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white pointer-events-none">
              {notifs.length > 9 ? "9+" : notifs.length}
            </span>
          )}
        </button>

        {/* Popup panel */}
        {bellOpen && (
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <button onClick={() => setBellOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Bell className="h-6 w-6 opacity-30" />
                  <p className="text-xs">All clear — no alerts</p>
                </div>
              ) : (
                notifs.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    {levelIcon(n.level)}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer — View All */}
            <div className="border-t border-border">
              <Link
                href="/notifications"
                onClick={() => setBellOpen(false)}
                className="flex items-center justify-center w-full py-2.5 text-xs font-medium text-primary hover:bg-muted transition-colors"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* User menu popup */}
      <div ref={userRef} className="relative">
        <button
          onClick={() => setUserOpen(o => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors outline-none"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium leading-tight truncate max-w-[100px]">{userName}</span>
            <span className="text-[10px] text-muted-foreground leading-tight capitalize">{userRole}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{userName}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { setUserOpen(false); router.push("/settings"); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Settings
              </button>
            </div>

            <div className="border-t border-border py-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
