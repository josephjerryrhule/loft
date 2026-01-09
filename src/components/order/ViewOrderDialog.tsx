"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, User, CreditCard, Calendar, FileText } from "lucide-react";
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={
                  order.paymentStatus === "PAID" ? "default" : 
                  order.paymentStatus === "FAILED" ? "destructive" : "outline"
                }>
                  {order.paymentStatus}
                </Badge>
                <Badge variant={
                  order.status === "COMPLETED" ? "default" :
                  order.status === "PROCESSING" ? "secondary" :
                  order.status === "CANCELLED" ? "destructive" : "outline"
                }>
                  {order.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
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

          {/* Customization Data */}
          {customizationData && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  <span>Customization Details</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {JSON.stringify(customizationData, null, 2)}
                  </pre>
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
