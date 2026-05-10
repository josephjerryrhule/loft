"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserSubscription } from "@/app/actions/plans";
import { getParentDashboardData } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Users, Baby } from "lucide-react";

export default function ParentDashboardPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [childProfiles, setChildProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  async function loadDashboardData() {
    try {
      if (!loading) setRefreshing(true);
      else setLoading(true);

      const data = await getParentDashboardData();
      setSubscription(data.subscription);
      setReadingProgress(data.completedBooks);
      setChildProfiles(data.childProfiles || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

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
          onClick={loadDashboardData}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Subscription Card */}
        <Card className={subscription ? "border-green-500" : "border-amber-500"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {subscription ? subscription.plan.name : "Free Plan"}
            </CardTitle>
            <Badge variant={subscription ? "default" : "secondary"}>
              {subscription ? "Active" : "Free"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${subscription ? "text-green-600" : "text-amber-600"}`}>
              {subscription ? `GHS ${Number(subscription.plan.price).toFixed(2)}` : "GHS 0.00"}
            </div>
            {subscription ? (
              <p className="text-xs text-muted-foreground">
                Expires on {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            ) : (
              <Link href="/parent/plans">
                <Button size="sm" className="mt-2">Upgrade Plan</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Books Read */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readingProgress}</div>
            <p className="text-xs text-muted-foreground">Flipbooks completed</p>
          </CardContent>
        </Card>

        {/* My Children */}
        <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">My Children</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of reading progress and subscriptions
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
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No child profiles found.</p>
                <Link href="/parent/children">
                  <Button size="sm">Add Your First Child</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {childProfiles.map((child) => (
                  <div key={child.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                    >
                      {child.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{child.name}</h4>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <BookOpen className="h-3 w-3" />
                        {child.completedBooks} books read
                      </div>
                      <div className="mt-2">
                        {child.activeSubscription ? (
                          <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                            Active: {child.activeSubscription.plan.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider text-amber-600 bg-amber-100 hover:bg-amber-100">
                            No Active Subscription
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browse Flipbooks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Browse</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/parent/flipbooks">
              <Button variant="outline" size="sm">View All Flipbooks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
