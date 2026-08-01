"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Bell, Menu, LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useMobileMenu } from "@/app/(dashboard)/layout";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps { title: string }

export function Header({ title }: HeaderProps) {
  const openMenu = useMobileMenu();
  const router   = useRouter();
  const supabase = createClient();

  const [userName,  setUserName]  = useState("User");
  const [userRole,  setUserRole]  = useState("");
  const [initials,  setInitials]  = useState("U");
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function load() {
      // ── Current user ─────────────────────────────────────
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
      setInitials(
        name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
      );

      // ── Real alert count ──────────────────────────────────
      // 1. Low feed stock
      const { data: feedItems } = await supabase
        .from("inventory_feed")
        .select("stock, reorder_level")
        .gt("reorder_level", 0);
      const lowFeed = (feedItems ?? []).filter(f => f.stock <= f.reorder_level).length;

      // 2. Expired or expiring medicine
      const today    = new Date().toISOString().split("T")[0];
      const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const { count: medCount } = await supabase
        .from("inventory_medicine")
        .select("id", { count: "exact", head: true })
        .lte("expiry_date", in30days);

      // 3. High mortality today
      const { data: todayEntries } = await supabase
        .from("daily_entries")
        .select("mortality")
        .eq("entry_date", today)
        .gte("mortality", 5);

      const total = lowFeed + (medCount ?? 0) + (todayEntries?.length ?? 0);
      setAlertCount(total);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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

      {/* Notifications bell — links to /notifications */}
      <Link href="/notifications" className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
        <Bell className="h-4 w-4" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white pointer-events-none">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </Link>

      <Separator orientation="vertical" className="h-5" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium leading-tight truncate max-w-[100px]">{userName}</span>
            <span className="text-[10px] text-muted-foreground leading-tight capitalize">{userRole}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">
            <p className="font-semibold">{userName}</p>
            <p className="text-muted-foreground capitalize font-normal">{userRole}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onClick={() => router.push("/settings")}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
