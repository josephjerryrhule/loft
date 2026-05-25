"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, User, CreditCard, Calendar, FileText, Download, Hash, ShoppingBag, UserCircle, MapPin, Truck, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ViewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  currency?: string;
}

function getFileExtension(url: string) {
    if (!url) return '';
    return url.split('.').pop()?.toLowerCase() || '';
}

export function ViewOrderDialog({ open, onOpenChange, order, currency = "GHS" }: ViewOrderDialogProps) {
  if (!order) return null;

  let customizationData = null;
  try {
    if (order.customizationData) {
      customizationData = typeof order.customizationData === 'string'
        ? JSON.parse(order.customizationData)
        : order.customizationData;
    }
  } catch (e) {
    console.error("Failed to parse customizationData:", e);
  }

  const handleDownload = (url: string) => {
    if (url.startsWith('/uploads/')) {
        const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
        window.open(downloadUrl, '_blank');
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-x-hidden">
        <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                <Package className="w-32 h-32 sm:w-40 sm:h-40 text-stone-900" />
            </div>
            <DialogHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <Hash size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Order Information</span>
                </div>
                <DialogTitle className="text-2xl sm:text-4xl font-black text-slate-900 leading-none tracking-tight">{order.orderNumber}</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-4 text-sm sm:text-base max-w-lg">
                    Tracking and details for this order.
                </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-wrap gap-3 sm:gap-5 mt-8 sm:mt-10">
                <div className="flex items-center gap-2 sm:gap-3 bg-white border border-stone-100 rounded-xl sm:rounded-2xl py-2 px-3 sm:px-5 shadow-sm">
                    <Calendar size={14} className="text-[#E87154]" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-2 sm:gap-3 border-none rounded-xl sm:rounded-2xl py-2 px-3 sm:px-5 shadow-sm",
                    order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  <CreditCard size={14} />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{order.paymentStatus}</span>
                </div>
                <div className={cn(
                    "flex items-center gap-2 sm:gap-3 border-none rounded-xl sm:rounded-2xl py-2 px-3 sm:px-5 shadow-sm",
                    order.status === "COMPLETED" ? "bg-[#E87154]/10 text-[#E87154]" : 
                    order.status === "PROCESSING" ? "bg-blue-100 text-blue-700" : 
                    "bg-stone-100 text-stone-600"
                )}>
                  <Truck size={14} />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{order.status}</span>
                </div>
            </div>
        </div>

        <div className="p-6 sm:p-10 space-y-10 sm:space-y-12 bg-white overflow-x-hidden">
          {/* Customer & Shipping Section */}
          <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2">
            {order.customer && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-[#E87154] shadow-sm">
                    <User size={16} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Personal Info</h4>
                </div>
                <div className="bg-stone-50 rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-6 space-y-3 border border-stone-100 shadow-sm">
                  <p className="text-sm sm:text-base font-black text-slate-900">
                    {order.customer.firstName ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest User'}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-3 group cursor-pointer hover:text-[#E87154] transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-[#E87154]" /> {order.customer.email}
                    </p>
                    {order.customer.phoneNumber && (
                        <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-3 group cursor-pointer hover:text-emerald-500 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-emerald-500" /> {order.customer.phoneNumber}
                        </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(order.shippingAddress || order.shippingCity) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-blue-500 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Shipping Info</h4>
                </div>
                <div className="bg-stone-50 rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-6 space-y-2 border border-stone-100 shadow-sm min-h-[100px]">
                  <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">{order.shippingAddress}</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                    {order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ""}
                    {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
                  </p>
                  {order.shippingCountry && (
                    <div className="pt-2">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-2 py-1 rounded-lg border border-stone-100">{order.shippingCountry}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Items */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-500 shadow-sm">
                    <ShoppingBag size={16} />
                </div>
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Items Ordered</h4>
            </div>
            <div className="bg-stone-50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-stone-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 scale-125 sm:scale-150 rotate-6 group-hover:rotate-12 transition-transform duration-700">
                  <ShoppingBag className="w-24 h-24 sm:w-32 sm:h-32 text-stone-900" />
              </div>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative z-10">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[1.5rem] bg-white border border-stone-100 overflow-hidden shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {order.product.featuredImageUrl ? (
                    <img
                        src={order.product.featuredImageUrl}
                        alt={order.product.title}
                        className="w-full h-full object-cover"
                    />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-200">
                            <Package size={40} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="space-y-2 text-center sm:text-left">
                    <h5 className="text-lg sm:text-xl font-black text-slate-900 truncate tracking-tight">{order.product.title}</h5>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{order.product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200">
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] bg-white border-none shadow-sm px-2 sm:px-3 py-1">
                      {order.product.productType}
                    </Badge>
                    <div className="text-right">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Qty: {order.quantity} ×</span>
                        <span className="text-base sm:text-lg font-black text-slate-900">{getCurrencySymbol(currency)}{order.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Assets */}
          {(order.customerUploadUrl || (order.status === "COMPLETED" && order.completedFileUrl)) && (
            <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2">
                {order.customerUploadUrl && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-purple-500 shadow-sm">
                                <FileText size={16} />
                            </div>
                            <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Customer Source</h4>
                        </div>
                        <div className="bg-purple-50/50 rounded-[1.5rem] p-5 sm:p-6 space-y-5 border border-purple-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border border-purple-100 overflow-hidden flex items-center justify-center shadow-sm">
                                    {getFileExtension(order.customerUploadUrl) === 'pdf' ? (
                                        <FileText size={24} className="text-red-500" />
                                    ) : (
                                        <img src={order.customerUploadUrl} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">Upload Receipt</p>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-600 truncate">{order.customerUploadUrl.split('/').pop()}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-11 sm:h-12 rounded-xl bg-white border-purple-200 text-purple-700 font-black hover:bg-purple-50 transition-all shadow-sm text-xs sm:text-sm"
                                onClick={() => handleDownload(order.customerUploadUrl)}
                            >
                                <Download size={16} className="mr-2" /> Download Original
                            </Button>
                        </div>
                    </div>
                )}

                {order.status === "COMPLETED" && order.completedFileUrl && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-[#E87154] shadow-sm">
                                <Download size={16} />
                            </div>
                            <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Project Result</h4>
                        </div>
                        <div className="bg-[#E87154]/5 rounded-[1.5rem] p-5 sm:p-6 space-y-5 border border-[#E87154]/20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#E87154] flex items-center justify-center text-white shadow-sm">
                                    <CheckCircle2 size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#E87154] mb-1">Process Complete</p>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tighter">Ready for Collection</p>
                                </div>
                            </div>
                            <Button
                                className="w-full h-11 sm:h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-sm transition-all active:scale-95 text-white text-xs sm:text-sm"
                                onClick={() => handleDownload(order.completedFileUrl)}
                            >
                                <Download size={16} className="mr-2" /> Download Final Item
                            </Button>
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* Customization Details */}
          {order.product.requiresCustomization && (
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-amber-500 shadow-sm">
                        <Sparkles size={16} />
                    </div>
                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Book Customization</h4>
                </div>
                
                {(() => {
                  let submitted = false;
                  try {
                    if (order.customizationData) {
                      const parsed = JSON.parse(order.customizationData);
                      if (parsed?.personalizationStatus === "SUBMITTED") {
                        submitted = true;
                      }
                    }
                  } catch (e) {}

                  if (submitted) {
                    return (
                      <div className="space-y-6">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          <div className="bg-stone-50 rounded-[1.5rem] p-6 border border-stone-100 shadow-sm space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E87154]">Order Placed By</p>
                            <div className="space-y-1.5 text-xs text-slate-700">
                              <p><span className="text-slate-400 font-medium">Purchaser:</span> <span className="font-bold">{customizationData?.purchaser?.fullName}</span></p>
                              <p><span className="text-slate-400 font-medium">Email:</span> <span className="font-bold">{customizationData?.purchaser?.email}</span></p>
                              <p><span className="text-slate-400 font-medium">Contact:</span> <span className="font-bold">{customizationData?.purchaser?.contact || "N/A"}</span></p>
                            </div>
                          </div>

                          <div className="bg-stone-50 rounded-[1.5rem] p-6 border border-stone-100 shadow-sm space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E87154]">Child Information</p>
                            <div className="space-y-1.5 text-xs text-slate-700">
                              <p><span className="text-slate-400 font-medium">Full Name:</span> <span className="font-bold">{customizationData?.child?.fullName}</span></p>
                              <p><span className="text-slate-400 font-medium">Date of Birth:</span> <span className="font-bold">{customizationData?.child?.dob ? new Date(customizationData.child.dob).toLocaleDateString() : "N/A"}</span></p>
                              <p><span className="text-slate-400 font-medium">Gender:</span> <span className="font-bold uppercase tracking-wider">{customizationData?.child?.gender}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-stone-50 rounded-[1.5rem] p-6 border border-stone-100 shadow-sm space-y-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E87154]">Story Preferences</p>
                          <div className="grid gap-6 grid-cols-2 text-xs">
                            <div>
                              <span className="text-slate-400 font-medium">Favorite Color</span>
                              <p className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: customizationData?.preferences?.favColor || "transparent" }} />
                                {customizationData?.preferences?.favColor}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Favorite Food</span>
                              <p className="font-bold text-slate-900 mt-1">{customizationData?.preferences?.favFood}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-6 grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Child Headshot</p>
                            <div className="border border-stone-100 rounded-2xl overflow-hidden aspect-square bg-slate-50 relative max-h-48 flex items-center justify-center shadow-inner">
                              {customizationData?.photos?.headshot ? (
                                <img src={customizationData.photos.headshot} alt="Child headshot" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-slate-400">Not Uploaded</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Child Full Body</p>
                            <div className="border border-stone-100 rounded-2xl overflow-hidden aspect-square bg-slate-50 relative max-h-48 flex items-center justify-center shadow-inner">
                              {customizationData?.photos?.fullBody ? (
                                <img src={customizationData.photos.fullBody} alt="Child full body" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-slate-400">Not Uploaded</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {customizationData?.additionalCharacters && customizationData.additionalCharacters.length > 0 && (
                          <div className="bg-stone-50 rounded-[1.5rem] p-6 border border-stone-100 shadow-sm space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E87154]">Additional Featured Characters</p>
                            <div className="divide-y divide-stone-100">
                              {customizationData.additionalCharacters.map((char: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2.5 text-xs text-slate-700">
                                  <span className="font-bold">{char.fullName}</span>
                                  <span className="text-slate-400 font-bold bg-white border px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">{char.relationship}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-[#FFF8F6] p-6 rounded-[2rem] border border-[#E87154]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[#E87154]">
                            <Sparkles size={16} className="animate-pulse" />
                            <h4 className="font-black text-sm uppercase tracking-wider leading-none">Personalization Required</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                            We need child specifications and photos to start printing and handcrafting your book. Submit these details now to start production!
                          </p>
                        </div>
                        <a href={`/customer/orders/personalize?orderId=${order.id}`} className="shrink-0 w-full sm:w-auto">
                          <Button className="w-full sm:w-auto bg-[#E87154] hover:bg-[#D66144] font-black text-white h-12 rounded-xl px-6 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border-none">
                            <Sparkles size={14} /> Personalize Now
                          </Button>
                        </a>
                      </div>
                    );
                  }
                })()}
             </div>
          )}
          {/* Financial Summary */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-indigo-500 shadow-sm">
                    <CreditCard size={16} />
                </div>
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Summary</h4>
            </div>
            <div className="bg-stone-100 rounded-[2rem] p-6 sm:p-8 text-slate-900 shadow-sm border border-stone-200 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Subtotal</span>
                  <span className="font-black text-xs sm:text-sm tracking-wide">{getCurrencySymbol(currency)}{(order.unitPrice * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Fees</span>
                  <span className="font-black text-xs sm:text-sm tracking-wide">{getCurrencySymbol(currency)}0.00</span>
                </div>
                <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
                  <div className="text-center sm:text-left">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#E87154] mb-2">Total</p>
                      <span className="text-3xl sm:text-4xl font-black tracking-tighter italic">{getCurrencySymbol(currency)}{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {order.paymentReference && (
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Payment ID</p>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                            <span className="text-[9px] sm:text-[10px] font-mono text-slate-600 truncate max-w-[120px] sm:max-w-none">{order.paymentReference}</span>
                            <ExternalLink size={10} className="text-slate-400 shrink-0" />
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Referral Footer */}
          {order.referredBy && (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-5 sm:p-6 bg-indigo-50/50 rounded-2xl sm:rounded-[1.5rem] border border-indigo-100 shadow-sm animate-in fade-in zoom-in-95 duration-700">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                    <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="text-center sm:text-left">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] leading-none mb-2">Referral Info</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        {order.referredBy.firstName} {order.referredBy.lastName}
                        <span className="hidden sm:inline text-slate-300 font-normal">|</span>
                        <span className="text-slate-500 font-bold text-xs sm:text-sm">{order.referredBy.email}</span>
                    </p>
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

  );
}
