"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, User, CreditCard, Calendar, FileText, Download } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";

interface ViewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  currency?: string;
}

export function ViewOrderDialog({ open, onOpenChange, order, currency = "GHS" }: ViewOrderDialogProps) {
  if (!order) return null;

  const customizationData = order.customizationData ? JSON.parse(order.customizationData) : null;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
            </div>
            
            {/* Status Badges with Labels */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Payment Status</p>
                <Badge 
                  variant={
                    order.paymentStatus === "PAID" ? "default" : 
                    order.paymentStatus === "FAILED" ? "destructive" : "outline"
                  }
                  className="w-fit"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {order.paymentStatus}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Order Status</p>
                <Badge 
                  variant={
                    order.status === "COMPLETED" ? "default" :
                    order.status === "PROCESSING" ? "secondary" :
                    order.status === "CANCELLED" ? "destructive" : "outline"
                  }
                  className="w-fit"
                >
                  <Package className="h-3 w-3 mr-1" />
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Info (for admin view) */}
          {order.customer && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  <span>Customer Information</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-sm"><span className="font-medium">Email:</span> {order.customer.email}</p>
                  {order.customer.firstName && (
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {order.customer.firstName} {order.customer.lastName}
                    </p>
                  )}
                  {order.customer.phoneNumber && (
                    <p className="text-sm"><span className="font-medium">Phone:</span> {order.customer.phoneNumber}</p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Shipping Address */}
          {(order.shippingAddress || order.shippingCity || order.shippingCountry) && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4" />
                  <span>Shipping Address</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  {order.shippingAddress && <p className="text-sm">{order.shippingAddress}</p>}
                  <p className="text-sm">
                    {order.shippingCity && <span>{order.shippingCity}</span>}
                    {order.shippingCity && order.shippingState && <span>, </span>}
                    {order.shippingState && <span>{order.shippingState}</span>}
                    {order.shippingPostalCode && <span> {order.shippingPostalCode}</span>}
                  </p>
                  {order.shippingCountry && <p className="text-sm">{order.shippingCountry}</p>}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              <span>Product Information</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex gap-4">
                {order.product.featuredImageUrl && (
                  <img
                    src={order.product.featuredImageUrl}
                    alt={order.product.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-semibold">{order.product.title}</p>
                    {order.product.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{order.product.productType}</Badge>
                    <span className="text-muted-foreground">
                      Unit Price: {getCurrencySymbol(currency)}{order.unitPrice.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Quantity: {order.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section for Completed Digital Orders */}
          {order.status === "COMPLETED" && order.completedFileUrl && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  <span>Download Files</span>
                </div>
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    ✓ Your order is complete! Download your file below:
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(
                      order.completedFileUrl,
                      `${order.orderNumber}-${order.product.title}.${order.completedFileUrl.split('.').pop()}`
                    )}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Customization Data */}
          {customizationData && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  <span>Order Notes & Details</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {customizationData.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                      <p className="text-sm">{customizationData.notes}</p>
                    </div>
                  )}
                  {Object.entries(customizationData)
                    .filter(([key]) => key !== 'notes')
                    .map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground font-medium mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {/* Payment Info */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              <span>Payment Information</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="text-sm font-medium">Paystack</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium">
                  {getCurrencySymbol(currency)}{(order.unitPrice * order.quantity).toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold">
                  {getCurrencySymbol(currency)}{order.totalAmount.toLocaleString()}
                </span>
              </div>
              {order.paymentReference && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Payment Reference: {order.paymentReference}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Referral Info */}
          {order.referredBy && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Referred By</div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    {order.referredBy.firstName} {order.referredBy.lastName} ({order.referredBy.email})
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
