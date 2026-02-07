"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Filter, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { default as dynamicImport } from "next/dynamic";
import { getCustomerFlipbooks, updateFlipbookProgress } from "@/app/actions/flipbooks";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ReliableFlipbookViewer = dynamicImport(() => import("@/components/flipbook/ReliableFlipbookViewer").then(mod => ({ default: mod.ReliableFlipbookViewer })), { ssr: false });

const PAGE_SIZE = 8;

export default function CustomerFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [filteredFlipbooks, setFilteredFlipbooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
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
        
        if (dateType === "day") {
          return flipbookDate.toDateString() === dateFilter.toDateString();
        } else if (dateType === "month") {
          return flipbookDate.getMonth() === dateFilter.getMonth() && 
                 flipbookDate.getFullYear() === dateFilter.getFullYear();
        } else if (dateType === "year") {
          return flipbookDate.getFullYear() === dateFilter.getFullYear();
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

  async function handleComplete() {
    if (!selectedFlipbook) return;
    
    try {
      await updateFlipbookProgress({
        flipbookId: selectedFlipbook.id,
        lastPageRead: 0, 
        completed: true
      });
      
      // Show success message
      toast.success(`"${selectedFlipbook.title}" marked as complete!`);
      
      // Update local state without reloading to prevent glitches
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
      
      // Update selected flipbook
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
          <div className="sm:w-30">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    dateType === "year" ? format(dateFilter, "yyyy") :
                    dateType === "month" ? format(dateFilter, "MMMM yyyy") :
                    format(dateFilter, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {(categoryFilter !== "all" || dateFilter) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setCategoryFilter("all");
                setDateFilter(undefined);
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
                      {hasProgress && progress.completed && (
                        <Badge className="absolute bottom-2.5 left-2" variant="default">
                          Completed
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
                        {hasProgress && progress.completed ? "Read Again" : "Read Now"}
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
        <ReliableFlipbookViewer
          pdfUrl={selectedFlipbook.pdfUrl}
          iframeContent={selectedFlipbook.iframeContent}
          title={selectedFlipbook.title}
          initialPage={0}
          onClose={() => {
            setViewerOpen(false);
            setSelectedFlipbook(null);
          }}
          onComplete={() => {
            handleComplete();
          }}
        />
      )}
    </div>
  );
}
