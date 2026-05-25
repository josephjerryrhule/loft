"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Tag, 
  Percent, 
  ShoppingBag, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductViewerProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductViewer({ product, open, onOpenChange }: ProductViewerProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[46rem] w-[95vw] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-x-hidden">
        
        {/* Header Bar */}
        <div className="bg-[#FFFAF5] p-6 sm:p-8 border-b border-stone-100 relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
            <ShoppingBag className="w-28 h-28 text-stone-900" />
          </div>
          <DialogHeader className="relative z-10 text-left">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                <Tag size={12} className="text-[#E87154]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 font-sans">Product Details</span>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {product.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
              ID: {product.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900">
          
          {/* Image Display Card */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center p-4 aspect-square relative overflow-hidden shadow-inner group">
              {product.featuredImageUrl ? (
                <img 
                  src={product.featuredImageUrl} 
                  alt={product.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <ShoppingBag size={48} className="opacity-40" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Image Uploaded</span>
                </div>
              )}
              
              <div className="absolute top-4 right-4">
                <Badge className="bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-900 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md backdrop-blur-sm">
                  {product.productType}
                </Badge>
              </div>
            </div>
            
            {/* Status indicator row */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inventory Status</span>
              <Badge 
                className={cn(
                  "text-[9px] font-black uppercase tracking-wider border-none shadow-sm",
                  product.isActive 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {product.isActive ? "Active" : "Archived"}
              </Badge>
            </div>
          </div>

          {/* Text Information Panel */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Description</Label>
                <div className="bg-stone-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-stone-100 dark:border-slate-800 min-h-[80px]">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {product.description || "No description provided for this item."}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-stone-100 dark:border-slate-800 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Tag size={10} /> Retail Price</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    <span className="text-xs font-bold text-slate-400 mr-0.5">GHS</span>
                    {Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/10 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Percent size={10} /> Commission</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    <span className="text-xs font-bold opacity-75 mr-0.5">GHS</span>
                    {Number(product.affiliateCommissionAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Personalization Setup status */}
              <div className="bg-stone-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-stone-100 dark:border-slate-800 space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Sparkles size={10} /> Customization Setup</span>
                {product.requiresCustomization ? (
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Personalization Form Enabled</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                        Purchasers are redirected immediately to complete the Birthday Book onboarding flow after payment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-slate-500">
                    <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">No Customization Required</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                        Standard fulfillment item. No post-purchase questionnaire is requested from the buyer.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button 
                onClick={() => onOpenChange(false)} 
                className="bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 font-black h-11 px-6 rounded-xl transition-all active:scale-95 text-white"
              >
                Close View
              </Button>
            </div>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
