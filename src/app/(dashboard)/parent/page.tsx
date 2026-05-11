"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getParentDashboardData } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Baby, CreditCard } from "lucide-react";

type ParentChildProfile = {
  id: string;
  name: string;
  avatarColor?: string | null;
  completedBooks: number;
  activeSubscription?: {
    plan: {
      name: string;
    };
  } | null;
};

export default function ParentDashboardPage() {
  const router = useRouter();
  const [childProfiles, setChildProfiles] = useState<ParentChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        if (!loading) setRefreshing(true);
        else setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getParentDashboardData();
      setChildProfiles(data.childProfiles || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      loadDashboardData();
    }, 0);

    // Re-fetch when window regains focus (e.g. returning from payment callback)
    const handleFocus = () => loadDashboardData(true);
    window.addEventListener("focus", handleFocus);

    // Also check for payment return via URL hash or query
    const url = new URL(window.location.href);
    if (url.searchParams.has("payment") || document.referrer.includes("/payment/callback")) {
      window.setTimeout(() => {
        loadDashboardData(true);
      }, 0);
    }

    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    router.refresh(); // Invalidate Next.js server cache
    await loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Children&apos;s Books Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {childProfiles.reduce((sum, child) => sum + (child.completedBooks || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Flipbooks completed by children</p>
          </CardContent>
        </Card>

        {/* Children overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Children</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {childProfiles.filter((c) => c.activeSubscription).length} with active plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Child Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href={childProfiles.length > 0 ? "/parent/plans" : "/parent/children"}>
              <Button variant="outline" size="sm" className="w-full">
                {childProfiles.length > 0 ? "Manage Plans" : "Add a Child"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* My Children Full Card */}
        <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">My Children</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Reading progress and subscription status
              </p>
            </div>
            <Link href="/parent/children">
              <Button variant="outline" size="sm">
                <Baby className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {childProfiles.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Baby className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No child profiles yet.</p>
                <Link href="/parent/children">
                  <Button size="sm">Add Your First Child</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {childProfiles.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                    >
                      {child.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{child.name}</h4>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {child.completedBooks} books read
                      </div>
                      <div className="mt-2">
                        {child.activeSubscription ? (
                          <Badge
                            className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20"
                          >
                            ✓ {child.activeSubscription.plan.name}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-50 dark:bg-amber-950"
                          >
                            No Active Plan
                          </Badge>
                        )}
                      </div>
                      {!child.activeSubscription && (
                        <Link href="/parent/plans" className="mt-2 block">
                          <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                            Get a Plan
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
