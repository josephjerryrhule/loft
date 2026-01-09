import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { getUserSubscription } from "@/app/actions/plans";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function CustomerDashboardPage() {
  const session = await auth();
  
  // Get active subscription
  const subscription = session?.user?.id 
    ? await getUserSubscription(session.user.id) 
    : null;

  // Get flipbook reading progress
  const readingProgress = session?.user?.id 
    ? await prisma.flipbookProgress.count({
        where: { customerId: session.user.id, completed: true }
      })
    : 0;

  // Get books in progress
  const inProgress = session?.user?.id 
    ? await prisma.flipbookProgress.findMany({
        where: { customerId: session.user.id, completed: false },
        include: { flipbook: true },
        orderBy: { lastAccessedAt: "desc" },
        take: 3
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <Card key={progress.id} className="overflow-hidden">
                <div className="h-32 bg-slate-100 flex items-center justify-center">
                  {progress.flipbook.coverImageUrl ? (
                    <img 
                      src={progress.flipbook.coverImageUrl} 
                      alt={progress.flipbook.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400">No Cover</span>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{progress.flipbook.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Page {progress.lastPageRead} of {progress.flipbook.totalPages || "?"}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
              No active books. <Link href="/customer/flipbooks" className="ml-1 text-blue-500 underline">Browse flipbooks</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
