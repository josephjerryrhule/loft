"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { PurchaseProductDialog } from "@/components/payment/PurchaseProductDialog";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number | string;
    featuredImageUrl: string | null;
    productType: string;
    stockQuantity: number | null;
    requiresCustomization: boolean;
    customizationFields: string | null;
  };
  userEmail?: string;
  userId?: string;
}

export function ProductCard({ product, userEmail, userId }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currency, setCurrency] = useState("GHS");

  useEffect(() => {
    async function loadCurrency() {
      const settings = await getSystemSettings();
      setCurrency(settings.currency || "GHS");
    }
    loadCurrency();
  }, []);

  const price = Number(product.price);

  return (
    <>
      <Card className="flex flex-col">
        <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
          {product.featuredImageUrl ? (
            <img
              src={product.featuredImageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingBag size={48} />
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
          <div className="text-xl font-bold text-green-600">
            {getCurrencySymbol(currency)}{price.toLocaleString()}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {product.description}
          </p>
          <div className="mt-2 text-xs bg-slate-100 p-1 rounded inline-block">
            {product.productType}
          </div>
        </CardContent>
        <CardFooter>
          {userEmail && userId ? (
            <Button className="w-full" onClick={() => setDialogOpen(true)}>
              Buy Now
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">Login to purchase</div>
          )}
        </CardFooter>
      </Card>

      {userEmail && userId && (
        <PurchaseProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={product}
          userEmail={userEmail}
          userId={userId}
        />
      )}
    </>
  );
}
