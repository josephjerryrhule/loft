"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { PaystackButton } from "@/components/payment/PaystackButton";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";

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

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSystemSettings();
      setCurrency(settings.currency || "GHS");
    }
    if (open) {
      loadSettings();
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

  const [reference] = useState(() => `ORD-${userId}-${Date.now()}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Product
          </DialogTitle>
          <DialogDescription>
            Complete your purchase details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="flex gap-4">
            {product.featuredImageUrl && (
              <img
                src={product.featuredImageUrl}
                alt={product.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{product.title}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              <p className="text-lg font-bold mt-1">
                {getCurrencySymbol(currency)}{price.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {product.stockQuantity && (
                <span className="text-sm text-muted-foreground">
                  ({product.stockQuantity} available)
                </span>
              )}
            </div>
          </div>

          {/* Customization Fields */}
          {customizationFieldsList.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base">Customization Options</Label>
                {customizationFieldsList.map((field: { name: string; label: string; required?: boolean }) => (
                  <div key={field.name} className="space-y-1">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.name}
                      value={customFields[field.name] || ""}
                      onChange={(e) => setCustomFields(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload Image for Digital Products */}
          {product.productType === "DIGITAL" && (
            <div className="space-y-2">
              <Label htmlFor="customerUpload">Upload Image (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a picture if needed for your digital product order
              </p>
              <input
                type="file"
                id="customerUpload"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("folder", "customer-uploads");

                  try {
                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await response.json();
                    setUploadedImageUrl(data.url);
                  } catch (error) {
                    console.error("Upload failed:", error);
                  }
                }}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              {uploadedImageUrl && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Image uploaded successfully
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Unit Price</span>
              <span>{getCurrencySymbol(currency)}{price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity</span>
              <span>× {quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{getCurrencySymbol(currency)}{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
            className="w-full sm:w-auto"
          >
            Pay {getCurrencySymbol(currency)}{totalAmount.toLocaleString()}
          </PaystackButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
