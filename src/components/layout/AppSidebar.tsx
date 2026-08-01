"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Bird, ClipboardList,
  Package, ShoppingCart, ShoppingBag, DollarSign, BarChart3,
  Bell, Users, Settings, LogOut, Egg, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { title: "Dashboard",        href: "/",              icon: LayoutDashboard },
  { title: "Farms",            href: "/farms",          icon: Building2 },
  { title: "Flocks",           href: "/flocks",         icon: Bird },
  { title: "Daily Operations", href: "/daily-ops",      icon: ClipboardList },
  { title: "Inventory",        href: "/inventory",      icon: Package },
  { title: "Sales",            href: "/sales",          icon: ShoppingCart },
  { title: "Purchases",        href: "/purchases",      icon: ShoppingBag },
  { title: "Finance",          href: "/finance",        icon: DollarSign },
  { title: "Reports",          href: "/reports",        icon: BarChart3 },
];

const systemItems = [
  { title: "Notifications",    href: "/notifications",  icon: Bell },
  { title: "Users",            href: "/users",          icon: Users },
  { title: "Settings",         href: "/settings",       icon: Settings },
];

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMenuClick: () => void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={onMobileClose}
        title={collapsed ? item.title : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed md:relative inset-y-0 left-0 z-40 flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
        // Desktop: always visible, collapsible
        collapsed ? "md:w-[56px]" : "md:w-[220px]",
        // Mobile: slide in/out as drawer (always full width when open)
        "w-[220px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center gap-3 h-14 px-3 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Egg className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden flex-1">
            <span className="text-sm font-bold text-sidebar-foreground truncate">Al Rehman</span>
            <span className="text-[11px] text-muted-foreground">Poultry Farm ERP</span>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-[52px] z-10 h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {!collapsed && (
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Main
          </p>
        )}
        {navItems.map((item) => <NavLink key={item.href} item={item} />)}

        <div className="my-2 border-t border-sidebar-border" />

        {!collapsed && (
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            System
          </p>
        )}
        {systemItems.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <button
          title={collapsed ? "Logout" : undefined}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
