"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ProductViewerProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductViewer({ product, open, onOpenChange }: ProductViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4 min-h-[300px]">
                {product.featuredImageUrl ? (
                    <img 
                        src={product.featuredImageUrl} 
                        alt={product.title} 
                        className="max-h-[400px] w-full object-contain rounded"
                    />
                ) : (
                    <div className="text-gray-400">No Image Available</div>
                )}
            </div>

            {/* Details Section */}
            <div className="space-y-4">
                <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm leading-relaxed">{product.description || "No description provided."}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground">Price</Label>
                        <p className="text-xl font-bold">GHS {Number(product.price).toFixed(2)}</p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Commission</Label>
                        <p className="text-lg font-medium text-green-600">GHS {Number(product.affiliateCommissionAmount).toFixed(2)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium">{product.productType}</p>
                    </div>
                    <div>
                         <Label className="text-muted-foreground">Status</Label>
                         <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                             {product.isActive ? "Active" : "Archived"}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
