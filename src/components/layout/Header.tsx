"use client";

import { Separator } from "@/components/ui/separator";
import { Bell, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useMobileMenu } from "@/app/(dashboard)/layout";

interface HeaderProps { title: string }

export function Header({ title }: HeaderProps) {
  const openMenu = useMobileMenu();

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

      <ThemeToggle />

      {/* Alerts bell */}
      <div className="relative">
        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white pointer-events-none">
          3
        </span>
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            FM
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium leading-tight">Farm Manager</span>
            <span className="text-[10px] text-muted-foreground leading-tight">manager</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
