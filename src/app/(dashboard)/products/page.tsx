"use client";

import { useState, useEffect } from "react";
import { getActiveProducts } from "@/app/actions/products";
import { ProductCard } from "@/components/product/ProductCard";
import { TablePagination } from "@/components/ui/table-pagination";
import { 
  Loader2, 
  ShoppingBag, 
  Search, 
  Sparkles, 
  BookOpen, 
  Download, 
  X, 
  ArrowUpDown, 
  ChevronDown 
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

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

  // Calculate static counts for each category
  const countByCategory = {
    all: products.length,
    physical: products.filter(p => p.productType === "PHYSICAL").length,
    digital: products.filter(p => p.productType === "DIGITAL").length,
    custom: products.filter(p => p.requiresCustomization).length,
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      if (!matchesSearch) return false;

      if (activeCategory === "physical") {
        return p.productType === "PHYSICAL";
      }
      if (activeCategory === "digital") {
        return p.productType === "DIGITAL";
      }
      if (activeCategory === "custom") {
        return p.requiresCustomization === true;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }
      if (sortBy === "name-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "name-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0; // default (featured)
    });

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  // Spot light first customization-required product (like the Birthday Book)
  const featuredProduct = products.find(p => p.requiresCustomization);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="LOFT Store"
        subtitle="Explore our curated collection of digital learning tools and physical merchandise."
        actions={
          <div className="flex items-center gap-3 px-5 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <ShoppingBag className="h-4 w-4 text-[#E87154]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {products.length} Products Available
            </span>
          </div>
        }
      />

      {/* Featured Spotlight Banner */}
      {featuredProduct && (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FFF8F6] via-[#FFF3EF] to-[#FFEBE5] dark:from-slate-900 dark:via-stone-900/40 dark:to-slate-800/30 border border-[#E87154]/10 dark:border-slate-800 shadow-lg p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E87154]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-white/30 dark:bg-slate-800/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex-1 space-y-5 relative z-10 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E87154]/10 border border-[#E87154]/20 text-[#E87154] text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="h-3 w-3 animate-pulse" /> Personalized Spotlight
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {featuredProduct.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm font-medium max-w-xl leading-relaxed">
                {featuredProduct.description || "A magical personalized learning storybook built specifically for your child. Make them the star of their learning adventure!"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center pt-2">
              <div className="text-3xl font-black text-[#E87154] tracking-tighter">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 uppercase">GHS</span>
                {Number(featuredProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <button 
                onClick={() => {
                  setActiveCategory("custom");
                  setCurrentPage(1);
                  const el = document.getElementById("store-products-grid");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 font-black shadow-lg hover:shadow-xl transition-all active:scale-95 text-white text-xs uppercase tracking-wider"
              >
                Customize Now
              </button>
            </div>
          </div>
          
          {/* Mockup Frame */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-[1.03]">
            <div className="relative aspect-[4/5] bg-white dark:bg-slate-800 rounded-[2rem] p-4 shadow-xl border border-slate-100 dark:border-slate-700/50 transform rotate-2 hover:rotate-0 transition-transform duration-500 flex flex-col justify-between">
              <div className="relative w-full h-[80%] rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                {featuredProduct.featuredImageUrl ? (
                  <Image 
                    src={featuredProduct.featuredImageUrl} 
                    alt={featuredProduct.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-350">
                    <ShoppingBag size={48} className="opacity-25" />
                  </div>
                )}
              </div>
              
              <div className="h-[20%] flex items-center justify-between pt-2">
                <div className="text-left">
                  <p className="text-[9px] font-black text-[#E87154] uppercase tracking-wider">Bestseller</p>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[160px]">{featuredProduct.title}</h4>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#E87154] text-white flex items-center justify-center shadow-lg shadow-[#E87154]/25">
                  <Sparkles size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Navigation Section */}
      <div className="flex flex-col gap-6" id="store-products-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-md">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
            <button
              onClick={() => {
                setActiveCategory("all");
                setCurrentPage(1);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0",
                activeCategory === "all"
                  ? "bg-[#E87154] text-white shadow-lg shadow-[#E87154]/20 scale-105"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:scale-102"
              )}
            >
              <ShoppingBag size={14} />
              <span>All Products</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold",
                activeCategory === "all" ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-slate-700 text-slate-500"
              )}>
                {countByCategory.all}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory("physical");
                setCurrentPage(1);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0",
                activeCategory === "physical"
                  ? "bg-[#E87154] text-white shadow-lg shadow-[#E87154]/20 scale-105"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:scale-102"
              )}
            >
              <BookOpen size={14} />
              <span>Physical Books</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold",
                activeCategory === "physical" ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-slate-700 text-slate-500"
              )}>
                {countByCategory.physical}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory("digital");
                setCurrentPage(1);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0",
                activeCategory === "digital"
                  ? "bg-[#E87154] text-white shadow-lg shadow-[#E87154]/20 scale-105"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:scale-102"
              )}
            >
              <Download size={14} />
              <span>Digital Downloads</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold",
                activeCategory === "digital" ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-slate-700 text-slate-500"
              )}>
                {countByCategory.digital}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory("custom");
                setCurrentPage(1);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0",
                activeCategory === "custom"
                  ? "bg-[#E87154] text-white shadow-lg shadow-[#E87154]/20 scale-105"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:scale-102"
              )}
            >
              <Sparkles size={14} />
              <span>Personalized</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold",
                activeCategory === "custom" ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-slate-700 text-slate-500"
              )}>
                {countByCategory.custom}
              </span>
            </button>
          </div>

          {/* Search and Sort controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search products..." 
                className="pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner w-full" 
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sorting Select */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                <ArrowUpDown size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-350 outline-none focus:ring-2 focus:ring-[#E87154] cursor-pointer appearance-none shadow-inner w-full sm:w-48"
              >
                <option value="featured">Featured Sort</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                  <ShoppingBag className="h-8 w-8 text-slate-305 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">No products found</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mt-2 text-xs">
                We couldn't find matches under this filter or search phrase.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setSortBy("featured");
                  setCurrentPage(1);
                }}
                className="mt-6 h-10 px-6 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              >
                Reset Filters
              </Button>
          </div>
        ) : (
          <div 
            key={activeCategory + "-" + searchQuery + "-" + currentPage + "-" + sortBy} 
            className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500"
          >
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
      </div>

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

      {/* Footer Details */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 py-10 opacity-55">
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

