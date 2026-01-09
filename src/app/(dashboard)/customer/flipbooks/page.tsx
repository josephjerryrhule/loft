import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import Link from "next/link"; // Assuming we'll make a reader page later

export default async function CustomerFlipbooksPage() {
  const session = await auth();
  
  // Get user's active subscription
  const activeSubscription = session?.user?.id 
    ? await prisma.subscription.findFirst({
        where: { 
          customerId: session.user.id,
          status: "ACTIVE"
        },
        include: { plan: true }
      })
    : null;

  // If user has no subscription, only show free flipbooks
  // If user has a subscription, show all flipbooks
  const flipbooks = await prisma.flipbook.findMany({
      where: { 
        isPublished: true,
        ...(activeSubscription ? {} : { isFree: true })
      }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flipbook Library</h1>
        {!activeSubscription && (
          <p className="text-sm text-muted-foreground mt-2">
            Subscribe to a plan to access all flipbooks. Currently showing free flipbooks only.
          </p>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {flipbooks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No flipbooks available</p>
          </div>
        ) : (
          flipbooks.map((book) => (
             <Card key={book.id} className="flex flex-col">
                <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400 relative">
                    {/* Placeholder for cover image */}
                    {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" /> : <BookOpen size={48} />}
                    {book.isFree && (
                      <Badge className="absolute top-2 right-2" variant="secondary">Free</Badge>
                    )}
                </div>
                <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">{book.description}</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Read Now</Button>
                </CardFooter>
             </Card>
          ))
        )}
      </div>
    </div>
  );
}
