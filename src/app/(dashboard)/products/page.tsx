import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ProductCard } from "@/components/product/ProductCard";

export default async function ShopsPage() {
  const session = await auth();
  const products = await prisma.product.findMany({
      where: { isActive: true }
  });

  // Serialize products to plain objects
  const serializedProducts = products.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price.toNumber(),
    featuredImageUrl: p.featuredImageUrl,
    productType: p.productType,
    stockQuantity: p.stockQuantity,
    requiresCustomization: p.requiresCustomization,
    customizationFields: p.customizationFields
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold">Shop Products</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {serializedProducts.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            userEmail={session?.user?.email || undefined}
            userId={session?.user?.id || undefined}
          />
        ))}
      </div>
    </div>
  );
}
