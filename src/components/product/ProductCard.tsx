"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Sparkles } from "lucide-react";
import { PurchaseProductDialog } from "@/components/payment/PurchaseProductDialog";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import Image from "next/image";

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

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      <Card className="flex flex-col border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-[#E87154]/20 dark:hover:border-[#E87154]/20 transition-all duration-500 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 group">
        <div className="h-64 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 relative overflow-hidden">
          {product.featuredImageUrl ? (
            <Image
              src={product.featuredImageUrl}
              alt={product.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <ShoppingBag size={64} className="opacity-15 group-hover:scale-105 transition-transform duration-700" />
          )}
          
          {/* Customization Flow Badge */}
          {product.requiresCustomization && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-[#E87154] hover:bg-[#E87154] text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md shadow-[#E87154]/20 flex items-center gap-1">
                <Sparkles size={8} className="animate-pulse" /> Personalized
              </Badge>
            </div>
          )}

          <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-slate-950/70 text-white dark:bg-slate-900/90 border border-white/10 backdrop-blur-md font-black text-[9px] uppercase tracking-widest px-3 shadow-lg">
                  {product.productType}
              </Badge>
          </div>
        </div>
        <CardHeader className="p-6 pb-2 text-left">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-[#E87154] transition-colors">{product.title}</CardTitle>
          <div className="text-2xl font-black text-[#E87154] tracking-tighter mt-1">
            <span className="text-xs font-bold text-slate-400 mr-1 uppercase">{getCurrencySymbol(currency)}</span>
            {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-6 pt-2 text-left">
          <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-2">
          {userEmail && userId ? (
            <Button 
                className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black shadow-lg hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-95 gap-2" 
                onClick={() => setDialogOpen(true)}
            >
              <ShoppingBag size={18} /> Buy Now
            </Button>
          ) : (
            <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Log in to purchase
            </div>
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
