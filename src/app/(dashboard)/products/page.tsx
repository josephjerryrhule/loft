import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import { PurchaseProductButton } from "@/components/payment/PurchaseProductButton";

export default async function ShopsPage() {
  const session = await auth();
  const products = await prisma.product.findMany({
      where: { isActive: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold">Shop Products</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
             <Card key={product.id} className="flex flex-col">
                <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    {product.featuredImageUrl ? <img src={product.featuredImageUrl} alt={product.title} className="h-full w-full object-cover" /> : <ShoppingBag size={48} />}
                </div>
                <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                    <div className="text-xl font-bold text-green-600">GHS {product.price.toString()}</div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                     <div className="mt-2 text-xs bg-slate-100 p-1 rounded inline-block">{product.productType}</div>
                </CardContent>
                <CardFooter>
                    {session?.user?.email ? (
                        <PurchaseProductButton 
                            product={product}
                            userEmail={session.user.email}
                            userId={session.user.id}
                        />
                    ) : (
                        <div className="text-sm text-muted-foreground">Login to purchase</div>
                    )}
                </CardFooter>
             </Card>
        ))}
      </div>
    </div>
  );
}
