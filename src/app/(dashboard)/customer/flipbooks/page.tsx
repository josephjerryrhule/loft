import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link"; // Assuming we'll make a reader page later

export default async function CustomerFlipbooksPage() {
  const flipbooks = await prisma.flipbook.findMany({
      where: { isPublished: true }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Flipbook Library</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {flipbooks.map((book) => (
             <Card key={book.id} className="flex flex-col">
                <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    {/* Placeholder for cover image */}
                    {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" /> : <BookOpen size={48} />}
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
        ))}
      </div>
    </div>
  );
}
