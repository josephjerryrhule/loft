"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { ShoppingBag, Save, Image as ImageIcon, Package, CheckCircle2, Loader2 } from "lucide-react";

interface EditProductDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            await updateProduct(formData);
            toast.success("Product updated successfully");
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem]">
                <div className="bg-[#E87154] p-6 sm:p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 rotate-12">
                        <ShoppingBag size={140} className="w-24 h-24 sm:w-36 sm:h-36" />
                    </div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl sm:text-3xl font-black text-white leading-none">Edit Product</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-3 text-sm sm:text-base max-w-lg">
                            Update the details and pricing for this item.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form action={handleSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 overflow-x-hidden">
                   <input type="hidden" name="id" value={product.id} />
                   
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Product Title</Label>
                      <Input name="title" defaultValue={product.title} placeholder="E.g. Hardcover Journal" required className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                   </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Description</Label>
                      <Textarea name="description" defaultValue={product.description || ""} placeholder="Tell customers about this product..." className="min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4" />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                       <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Retail Price (GHS)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">GHS</span>
                                <Input name="price" type="number" step="0.01" defaultValue={product.price} required className="pl-14 h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-black focus-visible:ring-[#E87154] shadow-inner" />
                            </div>
                       </div>
                       <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Affiliate Comm. (GHS)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">GHS</span>
                                <Input name="affiliateCommission" type="number" step="0.01" defaultValue={product.affiliateCommissionAmount} required className="pl-14 h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-black text-emerald-600 focus-visible:ring-[#E87154] shadow-inner" />
                            </div>
                       </div>
                   </div>
                   
                   <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Product Category/Type</Label>
                       <Select name="type" defaultValue={product.productType}>
                           <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4">
                               <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                               <SelectItem value="PHYSICAL" className="font-bold py-2 sm:py-3 rounded-xl flex items-center gap-2"><Package size={14} className="mr-2 inline" /> Physical Good</SelectItem>
                               <SelectItem value="DIGITAL" className="font-bold py-2 sm:py-3 rounded-xl flex items-center gap-2"><ImageIcon size={14} className="mr-2 inline" /> Digital Download</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>

                   <div className="flex items-center space-x-2 py-3 border-t border-b border-slate-100 dark:border-slate-800">
                       <input 
                           type="checkbox" 
                           id="requiresCustomization" 
                           name="requiresCustomization"
                           defaultChecked={product.requiresCustomization}
                           className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-[#E87154] focus:ring-[#E87154] cursor-pointer"
                       />
                       <Label htmlFor="requiresCustomization" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                           Requires Personalization Flow (Post-Purchase Form)
                       </Label>
                   </div>

                   <div className="space-y-5 border-t pt-8">
                        <FileUpload 
                            label="Replace Product Image" 
                            name="featuredImageUrl" 
                            accept="image/*"
                            defaultValue={product.featuredImageUrl || ""}
                        />
                        {product.featuredImageUrl && (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none shadow-inner">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border shadow-sm shrink-0">
                                    <img src={product.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Current Media</span>
                                    <a href={product.featuredImageUrl} target="_blank" className="text-xs text-[#E87154] font-black hover:underline flex items-center gap-1.5">View full asset <CheckCircle2 size={10} /></a>
                                </div>
                            </div>
                        )}
                   </div>
                   
                   <div className="pt-4">
                        <Button 
                            type="submit" 
                            className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base" 
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            ) : (
                                <Save className="mr-3 h-6 w-6" />
                            )}
                            Update Product
                        </Button>
                   </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
