"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBag, CreditCard, Hash, FileText, Upload, X, CheckCircle2, Loader2, Info, ShieldCheck } from "lucide-react";
import { PaystackButton } from "@/components/payment/PaystackButton";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getFileExtension(url: string) {
  if (!url) return '';
  return url.split('.').pop()?.toLowerCase() || '';
}

interface PurchaseProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    description?: string | null;
    price: number | string;
    featuredImageUrl?: string | null;
    productType: string;
    stockQuantity?: number | null;
    requiresCustomization?: boolean;
    customizationFields?: string | null;
  };
  userEmail: string;
  userId: string;
}

export function PurchaseProductDialog({
  open,
  onOpenChange,
  product,
  userEmail,
  userId
}: PurchaseProductDialogProps) {
  const [currency, setCurrency] = useState("GHS");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSystemSettings();
      setCurrency(settings.currency || "GHS");
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes("");
      setCustomFields({});
      setUploadedImageUrl("");
    }
  }, [open]);

  // Parse customization fields if they exist
  const customizationFieldsList = product.customizationFields 
    ? JSON.parse(product.customizationFields) 
    : [];

  const price = Number(product.price);
  const totalAmount = price * quantity;
  const maxQuantity = product.stockQuantity || 999;

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "customer-uploads");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedImageUrl(data.url);
      toast.success("File attached successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const reference = `ORD-${userId}-${Date.now()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-x-hidden">
        <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                <ShoppingBag className="w-32 h-32 sm:w-40 sm:h-40 text-stone-900" />
            </div>
            <DialogHeader className="relative z-10 text-left">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <CreditCard size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 font-sans">Payment Portal</span>
                </div>
                <DialogTitle className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tracking-tight">Confirm Purchase</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-4 text-sm sm:text-base max-w-lg">
                    Review your items, customize your order, and complete the secure transaction.
                </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-6 sm:p-10 space-y-10 sm:space-y-12 bg-white dark:bg-slate-900 overflow-x-hidden">
          {/* Product Overview */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 sm:p-8 border-none shadow-inner relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-[1.5rem] bg-white border-2 border-slate-100 dark:bg-slate-900 dark:border-slate-700 overflow-hidden shadow-xl shrink-0">
                    {product.featuredImageUrl ? (
                    <img
                        src={product.featuredImageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                    />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <ShoppingBag size={48} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                  <div className="space-y-2">
                    <h5 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{product.title}</h5>
                    <p className="text-sm sm:text-base text-slate-500 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-center sm:justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] bg-white dark:bg-slate-900 border-none shadow-sm px-3 py-1 hidden sm:flex">
                      {product.productType}
                    </Badge>
                    <div className="text-center sm:text-right">
                        <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Unit Price:</span>
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{getCurrencySymbol(currency)}{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Quantity & Customization Column */}
            <div className="space-y-8">
              {/* Quantity Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154] shadow-sm">
                    <Plus size={16} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Order Quantity</h4>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl shadow-inner w-fit border-none">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 shadow-sm text-slate-500 hover:text-[#E87154]"
                    >
                        <Minus size={18} />
                    </Button>
                    <div className="w-16 text-center font-black text-2xl text-slate-900 dark:text-white">
                        {quantity}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleIncrement}
                        disabled={quantity >= maxQuantity}
                        className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 shadow-sm text-slate-500 hover:text-emerald-500"
                    >
                        <Plus size={18} />
                    </Button>
                </div>
                {product.stockQuantity && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 italic">
                        {product.stockQuantity} items currently in inventory
                    </p>
                )}
              </div>

              {/* Customization Fields */}
              {customizationFieldsList.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm">
                        <FileText size={16} />
                    </div>
                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Customization Data</h4>
                  </div>
                  <div className="grid gap-4">
                    {customizationFieldsList.map((field: { name: string; label: string; required?: boolean }) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                          {field.label}
                          {field.required && <span className="text-[#E87154] ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.name}
                          value={customFields[field.name] || ""}
                          onChange={(e) => setCustomFields(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-blue-500 shadow-inner px-4"
                          placeholder={`Specify ${field.label.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                        <Info size={16} />
                    </div>
                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Order Instructions</h4>
                </div>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for your lofter's gift or delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] font-medium focus-visible:ring-slate-400 shadow-inner p-5 leading-relaxed"
                />
              </div>
            </div>

            {/* Upload & Summary Column */}
            <div className="space-y-8">
              {/* Asset Upload */}
              {product.productType === "DIGITAL" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm">
                            <Upload size={16} />
                        </div>
                        <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Project Reference Media</h4>
                    </div>
                    
                    {uploadedImageUrl ? (
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-[1.5rem] shadow-sm animate-in zoom-in-95">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                                    <CheckCircle2 size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1 leading-none">Attachment Verified</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Asset anchored to order payload</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setUploadedImageUrl("")}
                                    className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={cn(
                                "relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-[#E87154]/30",
                                uploading && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[#E87154] group-hover:bg-[#E87154]/10 transition-all shadow-inner">
                                {uploading ? <Loader2 size={32} className="animate-spin text-[#E87154]" /> : <Upload size={32} />}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Upload Guide Material</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Images or PDFs accepted</p>
                            </div>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".png,.jpg,.jpeg,.pdf,.avif"
                    />
                </div>
              )}

              {/* Billing Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                        <Hash size={16} />
                    </div>
                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Transaction Breakdown</h4>
                </div>
                <div className="bg-stone-50 rounded-[2rem] p-8 text-slate-900 shadow-sm border border-stone-100 relative overflow-hidden">
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-stone-500">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Item Subtotal</span>
                            <span className="font-black text-sm tracking-wide">{getCurrencySymbol(currency)}{(price * quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-500">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Fee</span>
                            <span className="font-black text-sm tracking-wide">{getCurrencySymbol(currency)}0.00</span>
                        </div>
                        <div className="pt-6 border-t border-stone-200 flex flex-col items-center sm:items-end">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#E87154] mb-2">Grand Total</p>
                            <span className="text-4xl sm:text-5xl font-black tracking-tighter italic">{getCurrencySymbol(currency)}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment Footer */}
          <div className="pt-6 border-t">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-inner">
                  <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 shadow-lg border-2 border-emerald-50 dark:border-emerald-900/30 shrink-0">
                          <ShieldCheck size={32} />
                      </div>
                      <div className="text-center sm:text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Authorization Security</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[300px]">Your transaction is encrypted and verified through the Paystack Global Payment Network.</p>
                      </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                      <Button 
                        variant="ghost" 
                        className="flex-1 lg:flex-none h-14 rounded-2xl text-slate-400 font-bold hover:text-slate-900 hover:bg-slate-100 transition-all text-base px-8" 
                        onClick={() => onOpenChange(false)}
                      >
                          Cancel
                      </Button>
                      <PaystackButton
                        email={userEmail}
                        amount={totalAmount}
                        reference={reference}
                        metadata={{
                        type: "product",
                        productId: product.id,
                        userId: userId,
                        quantity: quantity,
                        customizationData: JSON.stringify({ notes, ...customFields }),
                        customerUploadUrl: uploadedImageUrl || undefined,
                        }}
                        className="flex-1 lg:flex-none h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white px-10 text-base"
                    >
                        Authorize & Pay
                    </PaystackButton>
                  </div>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
