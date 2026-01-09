"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  BookOpen, 
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  FileText,
  UserPlus,
  Menu
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  userRole?: string;
}

// Shared Navigation Logic
function getLinks(userRole?: string) {
  const commonLinks = [
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/flipbooks", label: "Flipbooks", icon: BookOpen },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: FileText },
    { href: "/admin/plans", label: "Plans", icon: CreditCard },
    { href: "/admin/finance", label: "Finance & Payouts", icon: CreditCard },
  ];

  const managerLinks = [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/manager/team", label: "My Team", icon: Users },
    { href: "/manager/commissions", label: "Commissions", icon: CreditCard },
  ];

  const affiliateLinks = [
     { href: "/affiliate", label: "Dashboard", icon: LayoutDashboard },
     { href: "/affiliate/commissions", label: "My Earnings", icon: CreditCard },
  ];

  const customerLinks = [
    { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customer/flipbooks", label: "My Flipbooks", icon: BookOpen },
    { href: "/customer/plans", label: "Plans", icon: CreditCard },
    { href: "/customer/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/products", label: "Shop Products", icon: ShoppingBag },
  ];

  if (userRole === Role.ADMIN) return [...adminLinks, ...commonLinks];
  if (userRole === Role.MANAGER) return [...managerLinks, ...commonLinks];
  if (userRole === Role.AFFILIATE) return [...affiliateLinks, ...commonLinks];
  if (userRole === Role.CUSTOMER) return [...customerLinks, ...commonLinks];
  
  return commonLinks;
}

function NavContent({ userRole, setOpen }: { userRole?: string, setOpen?: (open: boolean) => void }) {
    const pathname = usePathname();
    const links = getLinks(userRole);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-full p-4">
          <div className="mb-8 px-4">
            <h1 className="text-2xl font-bold tracking-tight">Loft</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{userRole || "Guest"}</p>
          </div>
    
          <nav className="flex-1 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              // Precise active state: Exact match OR sub-path match (but exclude root dashboards from matching sub-paths of other items if they share prefix, though here they don't share prefix with other items, BUT /admin is prefix of /admin/users)
              // We want /admin to match ONLY /admin. 
              // We want /admin/users to match /admin/users AND /admin/users/123.
              
              const isRootDashboard = ["/admin", "/manager", "/affiliate", "/customer"].includes(link.href);
              const isActive = pathname === link.href || (!isRootDashboard && pathname.startsWith(`${link.href}/`));

              return (
                <Link key={link.href} href={link.href} onClick={() => setOpen && setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 mb-1",
                      isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
    
          <div className="pt-4 border-t border-slate-800">
            <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
                <LogOut size={18} />
                Sign Out
            </Button>
          </div>
        </div>
    );
}

export function Sidebar({ userRole }: SidebarProps) {
  return (
    <div className="hidden md:flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800">
         <NavContent userRole={userRole} />
    </div>
  );
}

export function MobileNav({ userRole }: SidebarProps) {
    const [open, setOpen] = useState(false);
    
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 bg-slate-900 w-72 text-white">
                 <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                 <NavContent userRole={userRole} setOpen={setOpen} />
            </SheetContent>
        </Sheet>
    )
}
