"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onMenuClick={() => setMobileOpen(true)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Pass toggle to children via a wrapper — Header is rendered inside each page */}
        {/* We clone children to inject onMenuClick — instead, use a context */}
        <MobileMenuContext.Provider value={() => setMobileOpen(true)}>
          {children}
        </MobileMenuContext.Provider>
      </div>
    </div>
  );
}

import { createContext, useContext } from "react";
export const MobileMenuContext = createContext<() => void>(() => {});
export function useMobileMenu() { return useContext(MobileMenuContext); }
