"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { default as dynamicImport } from "next/dynamic";
import { getCustomerFlipbooks, updateFlipbookProgress } from "@/app/actions/flipbooks";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

const FlipbookViewer = dynamicImport(() => import("@/components/flipbook/FlipbookViewer").then(mod => ({ default: mod.FlipbookViewer })), { ssr: false });

const PAGE_SIZE = 8;

export default function CustomerFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [filteredFlipbooks, setFilteredFlipbooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [dateType, setDateType] = useState<"day" | "month" | "year">("month");
  const [selectedFlipbook, setSelectedFlipbook] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadFlipbooks();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [flipbooks, categoryFilter, dateFilter, dateType]);

  async function loadFlipbooks() {
    try {
      setLoading(true);
      const data = await getCustomerFlipbooks();
      setFlipbooks(data.flipbooks);
      setHasSubscription(data.hasSubscription);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data.flipbooks.map((f: any) => f.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to load flipbooks:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...flipbooks];

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(f => {
        const flipbookDate = new Date(f.createdAt);
        const filterDate = new Date(dateFilter);
        
        if (dateType === "day") {
          return flipbookDate.toDateString() === filterDate.toDateString();
        } else if (dateType === "month") {
          return flipbookDate.getMonth() === filterDate.getMonth() && 
                 flipbookDate.getFullYear() === filterDate.getFullYear();
        } else if (dateType === "year") {
          return flipbookDate.getFullYear() === filterDate.getFullYear();
        }
        return true;
      });
    }

    setFilteredFlipbooks(filtered);
  }

  function handleReadNow(flipbook: any) {
    setSelectedFlipbook(flipbook);
    setViewerOpen(true);
  }

  async function handlePageChange(page: number) {
    if (!selectedFlipbook) return;
    
    console.log("Page changed to:", page); // Debug log
    
    try {
      await updateFlipbookProgress({
        flipbookId: selectedFlipbook.id,
        lastPageRead: page,
        completed: false
      });
      console.log("Progress saved successfully"); // Debug log
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  async function handleComplete() {
    if (!selectedFlipbook) return;
    
    console.log("Marking flipbook as complete"); // Debug log
    
    try {
      // Close the viewer first
      setViewerOpen(false);
      
      await updateFlipbookProgress({
        flipbookId: selectedFlipbook.id,
        lastPageRead: selectedFlipbook.totalPages || 999,
        completed: true
      });
      
      // Show success message
      toast.success(`"${selectedFlipbook.title}" marked as complete!`);
      
      // Reload flipbooks to show updated status
      await loadFlipbooks();
      
      console.log("Marked as complete"); // Debug log
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flipbook Library</h1>
        {!hasSubscription && (
          <p className="text-sm text-muted-foreground mt-2">
            Subscribe to a plan to access all flipbooks. Currently showing free flipbooks only.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Type Filter */}
          <div className="w-full sm:w-[120px]">
            <Select value={dateType} onValueChange={(v: any) => setDateType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">By Day</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="year">By Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex-1">
            <Input
              type={dateType === "day" ? "date" : "month"}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date..."
            />
          </div>

          {/* Clear Filters */}
          {(categoryFilter !== "all" || dateFilter) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setCategoryFilter("all");
                setDateFilter("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Paginated grid */}
      {(() => {
        const totalPages = Math.ceil(filteredFlipbooks.length / PAGE_SIZE);
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const paginatedFlipbooks = filteredFlipbooks.slice(startIndex, startIndex + PAGE_SIZE);

        return (
          <>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedFlipbooks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No flipbooks found matching your filters</p>
                </div>
              ) : (
                paginatedFlipbooks.map((book) => {
                  const progress = book.progress;
                  const hasProgress = progress && progress.lastPageRead > 0;
                  
                  return (
                    <Card key={book.id} className="flex flex-col">
                        <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400 relative">
                            {book.coverImageUrl ? (
                              <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                            ) : (
                              <BookOpen size={48} />
                      )}
                      {book.isFree && (
                        <Badge className="absolute top-2.5 right-2" variant="secondary">Free</Badge>
                      )}
                      {hasProgress && (
                        <Badge className="absolute bottom-2.5 left-2" variant="default">
                          {progress.completed ? "Completed" : `Page ${progress.lastPageRead}`}
                        </Badge>
                      )}
                  </div>
                  <CardHeader>
                      <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
                      {book.category && (
                        <Badge variant="outline" className="w-fit">{book.category}</Badge>
                      )}
                  </CardHeader>
                  <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">{book.description}</p>
                  </CardContent>
                  <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handleReadNow(book)}
                      >
                        {hasProgress && !progress.completed ? "Continue Reading" : "Read Now"}
                      </Button>
                  </CardFooter>
              </Card>
                  );
                })
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredFlipbooks.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        );
      })()}

      {/* Flipbook Viewer */}
      {viewerOpen && selectedFlipbook && (
        <FlipbookViewer
          pdfUrl={selectedFlipbook.pdfUrl}
          title={selectedFlipbook.title}
          initialPage={selectedFlipbook.progress?.lastPageRead || 0}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFlipbook(null);
          }}
          onPageChange={handlePageChange}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
