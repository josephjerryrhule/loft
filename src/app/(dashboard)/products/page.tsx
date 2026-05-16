"use client";

import { useState, useEffect } from "react";
import { getActiveProducts } from "@/app/actions/products";
import { ProductCard } from "@/components/product/ProductCard";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, ShoppingBag, Search, Filter, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 8;

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  featuredImageUrl: string | null;
  productType: string;
  stockQuantity: number | null;
  requiresCustomization: boolean;
  customizationFields: string | null;
}


export default function ShopsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { getSession } = await import("@/app/actions/auth");
      const session = await getSession();
      setUserEmail(session?.user?.email || undefined);
      setUserId(session?.user?.id || undefined);

      const data = await getActiveProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="LOFT Store"
        subtitle="Explore our curated collection of digital learning tools and physical merchandise."
        actions={
            <div className="flex items-center gap-3 px-5 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner border-none">
                <ShoppingBag className="h-4 w-4 text-[#E87154]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{products.length} Products Available</span>
            </div>
        }
      />

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search products by title or keywords..." 
                className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner w-full" 
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <Button variant="ghost" className="bg-slate-50 dark:bg-slate-800 h-12 px-5 rounded-xl text-slate-500 font-bold border-none shadow-inner gap-2 hover:bg-slate-100 transition-all shrink-0">
                    <Filter size={16} /> Filters
                </Button>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden lg:block" />
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner border-none h-12 shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Display:</span>
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 border-none shadow-sm text-[9px] font-black tracking-widest h-7 px-3">GRID VIEW</Badge>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {paginatedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                <ShoppingBag className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">No products found</h3>
            <p className="text-slate-500 font-medium max-w-xs mt-2">Adjust your search or filter to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
            <ProductCard 
                key={product.id}
                product={product}
                userEmail={userEmail}
                userId={userId}
            />
            ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-8">
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={() => {}} // Controlled PAGE_SIZE for now
            />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 py-10 opacity-50">
          <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#E87154]" />
              <span>Premium Marketplace</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3">
              <span>Secure Checkout Verified</span>
          </div>
      </div>
    </div>
  );
}
