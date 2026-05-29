"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRole } from "@/lib/format-utils";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  FileText,
  Menu,
  BarChart3,
  TrendingUp,
  Wallet,
  Sparkles,
  HandCoins,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  userRole?: string;
  logoUrl?: string;
  platformName?: string;
  hasChildren?: boolean;
}

// Shared Navigation Logic
function getLinks(userRole?: string, hasChildren?: boolean) {
  const commonLinks = [
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const leaderboardLink = { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 };

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/ambassadors", label: "Ambassador Management", icon: Shield },
    { href: "/admin/flipbooks", label: "Flipbooks", icon: BookOpen },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: FileText },
    { href: "/admin/personalizations", label: "Book Customizations", icon: Sparkles },
    { href: "/admin/plans", label: "Plans", icon: CreditCard },
    { href: "/admin/finance", label: "Finance & Payouts", icon: CreditCard },
    { href: "/admin/payments", label: "Payment Tracker", icon: Wallet },
    { href: "/admin/manual-payments", label: "Manual Payments", icon: HandCoins },
    leaderboardLink,
  ];

  const operationsManagerLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/ambassadors", label: "Ambassador Management", icon: Shield },
    { href: "/admin/orders", label: "Orders", icon: FileText },
    { href: "/admin/personalizations", label: "Book Customizations", icon: Sparkles },
    { href: "/admin/finance", label: "System Revenue", icon: CreditCard },
    { href: "/admin/commissions", label: "My Earnings", icon: Wallet },
    { href: "/admin/payments", label: "Payment Tracker", icon: Wallet },
    { href: "/admin/manual-payments", label: "Manual Payments", icon: HandCoins },
    leaderboardLink,
  ];

  const managerLinks = [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/manager/team", label: "My Team", icon: Users },
    { href: "/manager/marketing", label: "Marketing Tools", icon: TrendingUp },
    { href: "/manager/commissions", label: "Commissions", icon: CreditCard },
    leaderboardLink,
  ];

  const teamLeaderLinks = [
    { href: "/affiliate", label: "Dashboard", icon: LayoutDashboard },
    { href: "/team-leader/team", label: "My Team", icon: Users },
    { href: "/affiliate/marketing", label: "Marketing Tools", icon: TrendingUp },
    { href: "/affiliate/commissions", label: "My Earnings", icon: CreditCard },
    leaderboardLink,
  ];

  const affiliateLinks = [
     { href: "/affiliate", label: "Dashboard", icon: LayoutDashboard },
     { href: "/affiliate/marketing", label: "Marketing Tools", icon: TrendingUp },
     { href: "/affiliate/commissions", label: "My Earnings", icon: CreditCard },
     leaderboardLink,
  ];

  const parentLinks = [
    { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parent/children", label: "My Children", icon: Users },
    { href: "/parent/plans", label: "Child Plans", icon: CreditCard },
    { href: "/parent/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/products", label: "Shop Products", icon: ShoppingBag },
  ];

  if (!hasChildren) {
    parentLinks.push({ href: "/parent/flipbooks", label: "Flipbooks", icon: BookOpen });
  }

  const customerLinks = [
    { href: "/customer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customer/flipbooks", label: "Flipbooks", icon: BookOpen },
    { href: "/customer/plans", label: "Plans", icon: CreditCard },
    { href: "/customer/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/products", label: "Shop Products", icon: ShoppingBag },
  ];

  const financeLinks = [
    { href: "/finance", label: "Ambassador Tracking", icon: Users },
    { href: "/finance/payments", label: "Payment Tracker", icon: Wallet },
    { href: "/finance/signups", label: "Daily Signups", icon: TrendingUp },
    { href: "/finance/payouts", label: "Payout Requests", icon: BarChart3 },
    { href: "/finance/manual-payments", label: "Manual Payments", icon: HandCoins },
    leaderboardLink,
  ];

  if (userRole === Role.ADMIN) return [...adminLinks, ...commonLinks];
  if (userRole === Role.OPERATIONS_MANAGER) return [...operationsManagerLinks, ...commonLinks];
  if (userRole === Role.MANAGER) return [...managerLinks, ...commonLinks];
  if (userRole === Role.TEAM_LEADER) return [...teamLeaderLinks, ...commonLinks];
  if (userRole === Role.AFFILIATE) return [...affiliateLinks, ...commonLinks];
  if (userRole === Role.PARENT) return [...parentLinks, ...commonLinks];
  if (userRole === Role.CUSTOMER) return [...customerLinks, ...commonLinks];
  if (userRole === Role.FINANCE) return [...financeLinks, ...commonLinks];

  return commonLinks;
}

function NavContent({ userRole, setOpen, logoUrl, platformName, hasChildren }: { userRole?: string, setOpen?: (open: boolean) => void, logoUrl?: string, platformName?: string, hasChildren?: boolean }) {
    const pathname = usePathname();
    const links = getLinks(userRole, hasChildren);

    return (
        <div className="flex flex-col h-full bg-[#1C1917] text-stone-300 w-full p-4 border-r border-white/5 shadow-md">
          <div className="mb-10 px-4">
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 p-1 bg-white/10 rounded-xl">
                  <img 
                    src={logoUrl} 
                    alt={platformName || "Logo"} 
                    className="absolute inset-0 w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black tracking-tight text-white leading-none mb-1">{platformName || "Loft"}</h1>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-[#E87154]/30 text-white bg-[#E87154]/20">
                    {userRole ? formatRole(userRole) : "Guest"}
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black tracking-tight text-white mb-1">{platformName || "Loft"}</h1>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-[#E87154]/30 text-white bg-[#E87154]/20">
                  {userRole ? formatRole(userRole) : "Guest"}
                </Badge>
              </>
            )}
          </div>
    
          <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 sidebar-scrollbar">
            {links.map((link) => {
              const Icon = link.icon;
              const isRootDashboard = ["/admin", "/manager", "/affiliate", "/parent", "/finance"].includes(link.href);
              const isActive = pathname === link.href || (!isRootDashboard && pathname.startsWith(`${link.href}/`));

              return (
                <Link key={link.href} href={link.href} onClick={() => setOpen && setOpen(false)} className="block group">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 relative overflow-hidden transition-all duration-300 h-11 px-4 rounded-lg",
                      isActive 
                        ? "bg-white/10 text-white font-bold border border-white/10" 
                        : "text-stone-400 hover:text-white hover:bg-white/5 font-medium"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#E87154] rounded-r-full z-10" />
                    )}
                    <Icon size={20} className={cn("transition-all duration-300 shrink-0", isActive ? "text-[#E87154] scale-110" : "text-stone-500 group-hover:text-white group-hover:scale-110")} />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
    
          <div className="pt-4 border-t border-white/5">
            <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
                <LogOut size={18} />
                <span className="text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
    );
}

export function Sidebar({ userRole, logoUrl, platformName, hasChildren }: SidebarProps) {
  return (
    <div className="hidden md:flex flex-col h-full bg-[#1C1917] text-stone-300 w-64 border-r border-white/5">
         <NavContent userRole={userRole} logoUrl={logoUrl} platformName={platformName} hasChildren={hasChildren} />
    </div>
  );
}

export function MobileNav({ userRole, logoUrl, platformName, hasChildren }: SidebarProps) {
    const [open, setOpen] = useState(false);
    
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-stone-300 hover:text-white">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 bg-[#1C1917] w-72 text-white">
                 <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                 <NavContent userRole={userRole} setOpen={setOpen} logoUrl={logoUrl} platformName={platformName} hasChildren={hasChildren} />
            </SheetContent>
        </Sheet>
    )
}
