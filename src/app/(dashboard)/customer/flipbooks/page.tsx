"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { default as dynamicImport } from "next/dynamic";
import { getCustomerFlipbooks, updateFlipbookProgress } from "@/app/actions/flipbooks";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const ReliableFlipbookViewer = dynamicImport(() => import("@/components/flipbook/ReliableFlipbookViewer").then(mod => ({ default: mod.ReliableFlipbookViewer })), { ssr: false });

const PAGE_SIZE = 12;

export default function CustomerFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [filteredFlipbooks, setFilteredFlipbooks] = useState<any[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
  const [selectedFlipbook, setSelectedFlipbook] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadFlipbooks();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [flipbooks, searchQuery, selectedCategory, sortBy]);

  async function loadFlipbooks() {
    try {
      setLoading(true);
      const data = await getCustomerFlipbooks();
      setFlipbooks(data.flipbooks);
      setHasSubscription(data.hasSubscription);
    } catch (error) {
      console.error("Failed to load flipbooks:", error);
    } finally {
      setLoading(false);
    }
  }

  // Collect unique categories dynamically from the loaded books
  const categories = useMemo(() => {
    const cats = flipbooks.map((b) => b.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [flipbooks]);

  function applyFilters() {
    let filtered = [...flipbooks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(q) || 
        (f.description && f.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    // Sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "title-asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "title-desc") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    setFilteredFlipbooks(filtered);
  }

  function handleReadNow(flipbook: any) {
    setSelectedFlipbook(flipbook);
    setViewerOpen(true);
  }

  async function handleComplete() {
    if (!selectedFlipbook) return;
    
    try {
      await updateFlipbookProgress({
        flipbookId: selectedFlipbook.id,
        lastPageRead: 0, 
        completed: true
      });
      
      toast.success(`"${selectedFlipbook.title}" marked as complete!`);
      
      const updatedFlipbooks = flipbooks.map(f => {
        if (f.id === selectedFlipbook.id) {
          return {
            ...f,
            progress: {
              ...(f.progress || {}),
              completed: true,
              lastPageRead: 0
            }
          };
        }
        return f;
      });
      
      setFlipbooks(updatedFlipbooks);
      setSelectedFlipbook({
        ...selectedFlipbook,
        progress: {
          ...(selectedFlipbook.progress || {}),
          completed: true,
        }
      });
      
    } catch (error) {
      console.error("Failed to mark as complete:", error);
      toast.error("Failed to mark book as complete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* Title & Subscription banner */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black font-nunito-sans tracking-tight text-slate-900 dark:text-white mt-4">
          Digital Library
        </h1>
        {!hasSubscription && (
          <p className="text-sm font-semibold text-[#E87154] max-w-lg mx-auto bg-[#E87154]/10 py-2.5 px-4 rounded-full">
            Currently showing free flipbooks only. Subscribe to a plan to access the full catalog.
          </p>
        )}
      </div>

      {/* Unified Search & Filters Interface */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Search bar */}
        <div className="relative group max-w-2xl mx-auto">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for books or authors..."
            className="w-full h-14 pl-6 pr-14 rounded-full border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-md font-medium text-base placeholder:text-slate-400 focus:border-[#E87154] focus-visible:ring-1 focus-visible:ring-[#E87154]/20 transition-all text-slate-800 dark:text-slate-100"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#E87154] transition-colors" />
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 gap-2 w-auto shadow-sm focus:ring-0 focus:ring-offset-0 h-10 border-none ring-1 ring-slate-200 dark:ring-slate-800 cursor-pointer">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 gap-2 w-auto shadow-sm focus:ring-0 focus:ring-offset-0 h-10 border-none ring-1 ring-slate-200 dark:ring-slate-800 cursor-pointer">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title-asc">Title: A to Z</SelectItem>
              <SelectItem value="title-desc">Title: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Book Grid */}
      {(() => {
        const totalPages = Math.ceil(filteredFlipbooks.length / PAGE_SIZE);
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const paginatedFlipbooks = filteredFlipbooks.slice(startIndex, startIndex + PAGE_SIZE);

        return (
          <div className="space-y-12">
            <div className="grid gap-x-8 gap-y-12 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {paginatedFlipbooks.length === 0 ? (
                <div className="col-span-full text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No flipbooks found matching your search</p>
                </div>
              ) : (
                paginatedFlipbooks.map((book) => (
                  <CustomerBookItem key={book.id} book={book} onRead={handleReadNow} />
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="pt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredFlipbooks.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* Flipbook Viewer */}
      {viewerOpen && selectedFlipbook && (
        <ReliableFlipbookViewer
          pdfUrl={selectedFlipbook.pdfUrl}
          iframeContent={selectedFlipbook.iframeContent}
          title={selectedFlipbook.title}
          initialPage={0}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFlipbook(null);
          }}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

function CustomerBookItem({ book, onRead }: { book: any; onRead: (book: any) => void }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const aspect = dimensions ? dimensions.width / dimensions.height : 0.75;
  const cappedAspect = Math.max(0.5, Math.min(2.0, aspect));

  const progress = book.progress;
  const hasProgress = progress && progress.lastPageRead > 0;

  return (
    <div className="group flex flex-col w-full">
      {/* Cover image button: scales naturally with aspect ratio, max height, and horizontal centering */}
      <div className="w-full relative flex items-center justify-center">
        <button
          onClick={() => onRead(book)}
          className="block w-full max-h-[280px] transition-all duration-300 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1.5 text-left shadow-[0_12px_24px_-8px_rgba(0,0,0,0.25)] group-hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.35)] rounded-[4px] relative mx-auto overflow-hidden bg-slate-50 border border-black/5"
          style={{ aspectRatio: `${cappedAspect}` }}
        >
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setDimensions({ width: naturalWidth, height: naturalHeight });
                }
                setLoaded(true);
              }}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFFAF5] p-4 text-center">
              <BookOpen className="h-8 w-8 text-[#E87154] mb-2" />
              <span className="text-stone-855 font-bold text-xs sm:text-sm leading-tight line-clamp-3">
                {book.title}
              </span>
            </div>
          )}
          
          {/* Spine binding highlight crease for premium look */}
          <div className="absolute inset-y-0 left-0 w-[8px] bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 left-[8px] w-[1px] bg-white/10 pointer-events-none z-20" />
          
          {/* Badges on cover */}
          {book.isFree && (
            <Badge className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded border-none tracking-wide" variant="default">Free</Badge>
          )}
          {hasProgress && progress.completed && (
            <Badge className="absolute bottom-2 left-2 bg-[#E87154] hover:bg-[#E87154] text-white font-bold text-[9px] px-1.5 py-0.5 rounded border-none tracking-wide" variant="default">
              Completed
            </Badge>
          )}
        </button>
      </div>

      {/* Book Metadata - left aligned below cover */}
      <div className="text-left w-full mt-2.5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 text-sm sm:text-base leading-tight group-hover:text-[#E87154] transition-colors cursor-pointer" onClick={() => onRead(book)}>
          {book.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wider">
          {book.category || "General"}
        </p>
      </div>
    </div>
  );
}
