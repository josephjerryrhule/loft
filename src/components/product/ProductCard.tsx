"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Sparkles, Eye } from "lucide-react";
import { PurchaseProductDialog } from "@/components/payment/PurchaseProductDialog";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ProductDetailsDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  userEmail?: string;
  userId?: string;
  onBuyClick: () => void;
}

function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
  currency,
  userEmail,
  userId,
  onBuyClick
}: ProductDetailsDialogProps) {
  const price = Number(product.price);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[46rem] w-[95vw] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-[2rem] overflow-x-hidden bg-white dark:bg-slate-900">
        
        {/* Header decoration */}
        <div className="bg-[#FFFAF5] dark:bg-slate-800/40 p-6 sm:p-8 border-b border-stone-100 dark:border-slate-800/60 relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
            <ShoppingBag className="w-24 h-24 text-stone-900 dark:text-white" />
          </div>
          <DialogHeader className="relative z-10 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E87154] font-sans">Product Details</span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {product.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Image & Type Badge Column */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 flex items-center justify-center p-4 aspect-square relative overflow-hidden shadow-inner">
              {product.featuredImageUrl ? (
                <Image 
                  src={product.featuredImageUrl} 
                  alt={product.title} 
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-350 dark:text-slate-650">
                  <ShoppingBag size={48} className="opacity-40" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                </div>
              )}
              
              <div className="absolute top-4 right-4">
                <Badge className={cn(
                  "font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md border backdrop-blur-md",
                  product.productType === "PHYSICAL"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                )}>
                  {product.productType}
                </Badge>
              </div>
            </div>

            {/* Customization Details Banner */}
            {product.requiresCustomization && (
              <div className="bg-gradient-to-r from-[#E87154]/10 to-[#F18D74]/10 dark:from-[#E87154]/5 dark:to-[#F18D74]/5 p-4 rounded-xl border border-[#E87154]/20 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#E87154] animate-pulse shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-black text-[#E87154] uppercase tracking-wider leading-none">Personalized Product</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1.5">Requires user specification after checkout</p>
                </div>
              </div>
            )}
          </div>

          {/* Description & Checkout details Column */}
          <div className="flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              {/* Price section */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Price</span>
                <div className="text-3xl font-black text-[#E87154] tracking-tighter mt-0.5">
                  <span className="text-sm font-bold text-slate-400 mr-1 uppercase">{getCurrencySymbol(currency)}</span>
                  {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Description section */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</span>
                <p className="text-xs text-slate-650 dark:text-slate-350 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850 min-h-[100px]">
                  {product.description || "No description available for this item."}
                </p>
              </div>

              {/* Customization Roadmap (if customizable) */}
              {product.requiresCustomization && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Personalization Steps</span>
                  <div className="space-y-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">1</div>
                      <span>Specify Child Details (Name, Birthday, Gender)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">2</div>
                      <span>Select Story Colors & Food Preferences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">3</div>
                      <span>Upload Child Portrait & Full Body Photos</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Go Back
              </Button>
              {userEmail && userId ? (
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    onBuyClick();
                  }}
                  className="h-12 flex-1 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black shadow-lg hover:bg-[#E87154] dark:hover:bg-[#E87154] hover:text-white dark:hover:text-white transition-all active:scale-95 gap-2"
                >
                  <ShoppingBag size={16} /> Order Now
                </Button>
              ) : (
                <div className="text-center py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Log in to purchase
                </div>
              )}
            </div>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}

export function ProductCard({ product, userEmail, userId }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      <div className="group flex flex-col border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(232,113,84,0.12)] hover:border-[#E87154]/30 dark:hover:border-[#E87154]/20 transition-all duration-500 rounded-[2.2rem] overflow-hidden bg-white dark:bg-slate-900 hover:-translate-y-1.5">
        
        {/* Image Container with Hover Zoom & Gradient Reveal */}
        <div 
          onClick={() => setDetailsOpen(true)}
          className="h-64 bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-200 relative overflow-hidden cursor-pointer"
        >
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

          {/* Transparent Gradient Hover Layer */}
          <div className="bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute inset-0 z-10" />
          
          {/* Customization Flow Badge */}
          {product.requiresCustomization && (
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-gradient-to-r from-[#E87154] to-[#F18D74] hover:from-[#E87154] hover:to-[#F18D74] text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md shadow-[#E87154]/20 flex items-center gap-1">
                <Sparkles size={8} className="animate-pulse" /> Personalized
              </Badge>
            </div>
          )}

          {/* Product Type Badge */}
          <div className="absolute top-4 right-4 z-20">
            <Badge className={cn(
              "font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md border backdrop-blur-md",
              product.productType === "PHYSICAL"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
            )}>
              {product.productType}
            </Badge>
          </div>

          {/* Hover overlay text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="flex items-center gap-1 px-4 py-2 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg border border-slate-200/20 backdrop-blur-sm">
              <Eye size={10} /> View details
            </span>
          </div>
        </div>

        {/* Card Header details */}
        <div className="p-6 pb-2 text-left flex-1 flex flex-col justify-between">
          <div>
            <h3 
              onClick={() => setDetailsOpen(true)}
              className="text-xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-[#E87154] transition-colors cursor-pointer"
            >
              {product.title}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mt-2">
              {product.description}
            </p>
          </div>

          {/* Pricing indicator */}
          <div className="text-2xl font-black text-[#E87154] tracking-tighter mt-4">
            <span className="text-xs font-bold text-slate-400 mr-0.5 uppercase">{getCurrencySymbol(currency)}</span>
            {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="p-6 pt-2">
          {userEmail && userId ? (
            <div className="flex gap-2">
              {/* Secondary Quick View button */}
              <button 
                onClick={() => setDetailsOpen(true)}
                className="h-12 w-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all border border-slate-100 dark:border-slate-800/85 shrink-0"
                title="Quick View"
              >
                <Eye size={18} />
              </button>
              
              {/* Primary Buy Now button */}
              <Button 
                className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-[#E87154] dark:hover:bg-[#E87154] hover:text-white dark:hover:text-white text-white font-black shadow-md hover:shadow-lg hover:shadow-[#E87154]/25 transition-all duration-300 active:scale-95 gap-2" 
                onClick={() => setDialogOpen(true)}
              >
                <ShoppingBag size={18} /> Buy Now
              </Button>
            </div>
          ) : (
            <div className="w-full text-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Log in to purchase
            </div>
          )}
        </div>

      </div>

      {/* Checkout / Purchase Portal */}
      {userEmail && userId && (
        <PurchaseProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={product}
          userEmail={userEmail}
          userId={userId}
        />
      )}

      {/* Customer Product Details View */}
      <ProductDetailsDialog
        product={product}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        currency={currency}
        userEmail={userEmail}
        userId={userId}
        onBuyClick={() => setDialogOpen(true)}
      />
    </>
  );
}

