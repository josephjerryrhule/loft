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
import { Loader2, ShoppingBag, Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Products"
        subtitle="Manage physical and digital items available in the store"
        actions={
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2">
                    <Plus size={18} /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form action={createProduct} className="space-y-4 mt-4">
                   <div className="space-y-2">
                      <Label>Title</Label>
                      <Input name="title" placeholder="My Product" required />
                   </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea name="description" placeholder="Product details..." className="min-h-[80px]" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                            <Label>Price (GHS)</Label>
                            <Input name="price" type="number" step="0.01" placeholder="100.00" required />
                       </div>
                       <div className="space-y-2">
                            <Label>Commission (GHS)</Label>
                            <Input name="affiliateCommission" type="number" step="0.01" placeholder="10.00" required />
                       </div>
                   </div>
                   
                   <div className="space-y-2">
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
                   
                   <Button type="submit" className="w-full bg-[#E87154] hover:bg-[#D66144] h-11 mt-2">Create Product</Button>
                </form>
              </DialogContent>
            </Dialog>
        }
      />

      <div className="rounded-xl border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="pl-6">Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {paginatedProducts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                            <ShoppingBag className="h-10 w-10 opacity-20" />
                            <p>No products available.</p>
                        </div>
                    </TableCell>
                </TableRow>
            )}
            {paginatedProducts.map((p) => (
              <TableRow key={p.id} className="group transition-colors">
                <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                             {p.featuredImageUrl ? (
                                <img src={p.featuredImageUrl} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <Package size={20} />
                             )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">ID: {p.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                        {p.productType}
                    </Badge>
                </TableCell>
                <TableCell className="font-black text-slate-900 dark:text-white">
                    <span className="text-[10px] text-slate-400 mr-1">GHS</span>
                    {Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="font-medium text-emerald-600">
                    <span className="text-[10px] opacity-70 mr-1">GHS</span>
                    {Number(p.affiliateCommissionAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                    <Badge 
                        variant={p.isActive ? "default" : "outline"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            p.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none" : "bg-slate-100 text-slate-500 border-none"
                        )}
                    >
                        {p.isActive ? "Active" : "Archived"}
                    </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                    <ProductActions product={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-slate-50 dark:border-slate-800">
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
      </div>
    </div>
  );
}
