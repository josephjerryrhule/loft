"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/admin";
import { Upload, X, FileIcon, Loader2, Package, CheckCircle2, ShieldCheck, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    product?: {
      productType: string;
    };
    completedFileUrl?: string | null;
  };
  onSuccess?: () => void;
}

export function EditOrderDialog({ open, onOpenChange, order, onSuccess }: EditOrderDialogProps) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(order.completedFileUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDigitalProduct = order.product?.productType === "DIGITAL";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "orders");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedFileUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateOrderStatus(order.id, status, uploadedFileUrl || undefined);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Order updated successfully");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-[2rem]">
        <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                <Package size={140} className="text-stone-900" />
            </div>
            <DialogHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <Hash size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Order Management</span>
                </div>
                <DialogTitle className="text-3xl font-black text-slate-900 leading-none">Process Order</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-4 text-base">
                    Update fulfillment status and attach digital deliverables for order <span className="text-[#E87154] font-black">{order.orderNumber}</span>
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <div className="p-10 space-y-10 bg-white dark:bg-slate-900 w-full overflow-x-hidden">
          <div className="space-y-4 w-full">
            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Fulfillment Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="h-14 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-lg focus:ring-[#E87154] shadow-inner px-6">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="PENDING" className="font-bold py-3 rounded-xl">Pending Review</SelectItem>
                <SelectItem value="PROCESSING" className="font-bold py-3 rounded-xl text-blue-600">Processing / Preparing</SelectItem>
                <SelectItem value="COMPLETED" className="font-bold py-3 rounded-xl text-emerald-600">Mark as Completed</SelectItem>
                <SelectItem value="CANCELLED" className="font-bold py-3 rounded-xl text-red-600">Cancel Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isDigitalProduct && (
            <div className="space-y-4 border-t pt-10 w-full">
              <div className="flex items-center gap-2 mb-1">
                  <Upload size={14} className="text-[#E87154]" />
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Digital Deliverable</Label>
              </div>
              
              {uploadedFileUrl ? (
                <div className="flex items-center gap-5 p-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-[1.5rem] shadow-sm animate-in zoom-in-95 w-full">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    <CheckCircle2 size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 tracking-widest">Asset Ready</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Completed file attached successfully</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadedFileUrl("")}
                    className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={20} />
                  </Button>
                </div>
              ) : (
                <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={cn(
                        "relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-[#E87154]/30 w-full",
                        uploading && "opacity-60 cursor-not-allowed"
                    )}
                >
                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[#E87154] group-hover:bg-[#E87154]/10 transition-all shadow-inner">
                        {uploading ? <Loader2 size={36} className="animate-spin text-[#E87154]" /> : <Upload size={36} />}
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black text-slate-900 dark:text-white">
                            {uploading ? "Processing Asset..." : "Click to Upload Final File"}
                        </p>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">PDF, ZIP, or Images accepted</p>
                    </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.zip,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest px-10 leading-relaxed mt-4">
                Customers will be notified and granted immediate download access once the status is set to "Completed".
              </p>
            </div>
          )}

          <div className="pt-6 w-full">
              <div className="bg-stone-50 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-sm border border-stone-100 w-full">
                  <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-[#E87154] shrink-0 border border-stone-200 shadow-sm">
                          <CheckCircle2 size={28} />
                      </div>
                      <div className="text-center sm:text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Authorization Summary</p>
                          <p className="text-sm sm:text-base font-black text-slate-900">
                              Fulfillment Update → <span className={cn(
                                "font-black tracking-tighter",
                                status === "COMPLETED" ? "text-emerald-500" : status === "CANCELLED" ? "text-red-500" : "text-[#E87154]"
                              )}>{status}</span>
                          </p>
                      </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                      <Button 
                        variant="ghost" 
                        className="flex-1 sm:flex-none h-14 rounded-2xl text-stone-400 font-bold hover:text-slate-900 hover:bg-stone-100 transition-all text-base px-8" 
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                      >
                          Cancel
                      </Button>
                      <Button 
                          className="flex-1 sm:flex-none h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white px-10 text-base" 
                          onClick={handleSubmit} 
                          disabled={loading || uploading}
                      >
                          {loading ? (
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          ) : (
                              <ShieldCheck className="mr-3 h-5 w-5" />
                          )}
                          Save Status
                      </Button>
                  </div>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
