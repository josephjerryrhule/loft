"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, getAllProducts } from "@/app/actions/products";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { ProductActions } from "@/components/product/ProductActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog>
          {/* ... existing code ... */}
          <DialogTrigger asChild>
            <Button>+ Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form action={createProduct} className="space-y-4">
               <div>
                  <Label>Title</Label>
                  <Input name="title" placeholder="My Product" required />
               </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Product details..." />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <Label>Price (GHS)</Label>
                        <Input name="price" type="number" step="0.01" placeholder="100.00" required />
                   </div>
                   <div>
                        <Label>Commission (GHS)</Label>
                        <Input name="affiliateCommission" type="number" step="0.01" placeholder="10.00" required />
                   </div>
               </div>
               
               <div>
                   <Label>Type</Label>
                   <Select name="type" defaultValue="PHYSICAL">
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
                />
               
               <Button type="submit" className="w-full">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {paginatedProducts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No products available.
                    </TableCell>
                </TableRow>
            )}
            {paginatedProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.productType}</TableCell>
                <TableCell>GHS {p.price.toString()}</TableCell>
                <TableCell>GHS {p.affiliateCommissionAmount.toString()}</TableCell>
                <TableCell>{p.isActive ? "Active" : "Archived"}</TableCell>
                <TableCell className="text-right">
                    <ProductActions product={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={products.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
