"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserSubscription } from "@/app/actions/plans";
import { getCustomerDashboardData } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw } from "lucide-react";

export default function CustomerDashboardPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh when window gains focus
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function loadDashboardData() {
    try {
      if (!loading) setRefreshing(true);
      else setLoading(true);
      
      const data = await getCustomerDashboardData();
      setSubscription(data.subscription);
      setReadingProgress(data.completedBooks);
      setInProgress(data.inProgress);
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
        <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadDashboardData}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
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
              <Link href="/customer/plans">
                <Button size="sm" className="mt-2">Upgrade Plan</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Books Read */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readingProgress}</div>
            <p className="text-xs text-muted-foreground">Flipbooks completed</p>
          </CardContent>
        </Card>

        {/* Reading In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground">Books being read</p>
          </CardContent>
        </Card>

        {/* Browse Flipbooks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Browse</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/customer/flipbooks">
              <Button variant="outline" size="sm">View All Flipbooks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Continue Reading Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Continue Reading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inProgress.length > 0 ? (
            inProgress.map((progress: any) => (
              <Link key={progress.id} href="/customer/flipbooks">
                <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer">
                  <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                    {progress.flipbook.coverImageUrl ? (
                      <img 
                        src={progress.flipbook.coverImageUrl} 
                        alt={progress.flipbook.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-slate-400" />
                    )}
                    <Badge className="absolute bottom-2 left-2" variant="secondary">
                      Page {progress.lastPageRead}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">{progress.flipbook.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((progress.lastPageRead / (progress.flipbook.totalPages || 100)) * 100)}% complete
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3 h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
              No active books. <Link href="/customer/flipbooks" className="ml-1 text-blue-500 underline">Browse flipbooks</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
