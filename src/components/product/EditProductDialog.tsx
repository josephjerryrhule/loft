"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { updateProduct } from "@/app/actions/products";
import { useState } from "react";
import { toast } from "sonner";

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
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                   <input type="hidden" name="id" value={product.id} />
                   
                   <div>
                      <Label>Title</Label>
                      <Input name="title" defaultValue={product.title} placeholder="My Product" required />
                   </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea name="description" defaultValue={product.description || ""} placeholder="Product details..." />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                            <Label>Price (GHS)</Label>
                            <Input name="price" type="number" step="0.01" defaultValue={product.price} required />
                       </div>
                       <div>
                            <Label>Commission (GHS)</Label>
                            <Input name="affiliateCommission" type="number" step="0.01" defaultValue={product.affiliateCommissionAmount} required />
                       </div>
                   </div>
                   
                   <div>
                       <Label>Type</Label>
                       <Select name="type" defaultValue={product.productType}>
                           <SelectTrigger>
                               <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="PHYSICAL">Physical Good</SelectItem>
                               <SelectItem value="DIGITAL">Digital Download</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>

                   <FileUpload 
                      label="Product Image" 
                      name="featuredImageUrl" 
                      accept="image/*"
                      // Note: FileUpload usually handles initial value differently, assuming standard input for now or just letting user upload new one content
                    />
                    {product.featuredImageUrl && (
                        <div className="text-sm text-gray-500">
                            Current Image: <a href={product.featuredImageUrl} target="_blank" className="underline">View</a>
                        </div>
                    )}
                   
                   <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                   </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
