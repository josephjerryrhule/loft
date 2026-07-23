"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlipbook, getAllFlipbooks, deleteFlipbook, resyncFlipbookCovers } from "@/app/actions/flipbooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FlipbookActions } from "@/components/flipbook/FlipbookActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { 
  Loader2, Plus, BookOpen, Clock, CheckCircle2, LayoutGrid, List, Search, 
  Eye, Pencil, Trash2, Library, Filter, Tag, Folder, Layers, X, RefreshCw, ArrowLeft
} from "lucide-react";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toast } from "sonner";
import { getAgeGroupLabel } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EditFlipbookDialog } from "@/components/flipbook/EditFlipbookDialog";
import { default as dynamicImport } from "next/dynamic";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ReliableFlipbookViewer = dynamicImport(
  () => import("@/components/flipbook/ReliableFlipbookViewer").then((mod) => mod.ReliableFlipbookViewer),
  { ssr: false }
);

export default function AdminFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resyncing, setResyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // View Modes & Categorized Dropdown States
  const [viewMode, setViewMode] = useState<"bookshelves" | "grid" | "table">("bookshelves");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadFlipbooks();
  }, []);

  const loadFlipbooks = async () => {
    try {
      setLoading(true);
      const data = await getAllFlipbooks();
      setFlipbooks(data);
    } catch (error) {
      console.error("Failed to load flipbooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResyncCovers = async () => {
    try {
      setResyncing(true);
      toast.info("Resyncing Heyzine flipbook cover URLs...");
      const result = await resyncFlipbookCovers();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Resynced ${result.updatedCount} cover images from Heyzine!`);
        loadFlipbooks();
      }
    } catch (err) {
      toast.error("Failed to resync covers.");
    } finally {
      setResyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (schedulePublish && publishDate) {
      formData.set("publishedAt", publishDate.toISOString());
    }
    
    const result = await createFlipbook(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Flipbook created successfully");
      setDialogOpen(false);
      setSchedulePublish(false);
      setPublishDate(undefined);
      loadFlipbooks();
    }
  };

  // Collect unique categories dynamically from loaded flipbooks
  const existingCategories = useMemo(() => {
    const cats = flipbooks
      .map((f) => f.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set(cats)).sort();
  }, [flipbooks]);

  // Filter flipbooks dynamically based on search, age group, and shelf category
  const filteredFlipbooks = useMemo(() => {
    return flipbooks.filter((f) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          f.title.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (f.category && f.category.toLowerCase().includes(q)) ||
          (f.ageGroup && f.ageGroup.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Age Group filter
      if (selectedAgeGroup !== "all") {
        if (selectedAgeGroup === "UNASSIGNED") {
          if (f.ageGroup) return false;
        } else if (f.ageGroup !== selectedAgeGroup) {
          return false;
        }
      }

      // Category / Shelf filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "UNASSIGNED") {
          if (f.category) return false;
        } else if (f.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [flipbooks, searchQuery, selectedAgeGroup, selectedCategory]);

  // Group filtered flipbooks into Bookshelf cards (Heyzine style)
  const groupedBookshelves = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredFlipbooks.forEach((book) => {
      const shelfName = book.category?.trim() || "Uncategorized Shelves";
      if (!groups[shelfName]) {
        groups[shelfName] = [];
      }
      groups[shelfName].push(book);
    });
    return groups;
  }, [filteredFlipbooks]);

  const hasActiveFilters = searchQuery !== "" || selectedAgeGroup !== "all" || selectedCategory !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAgeGroup("all");
    setSelectedCategory("all");
  };

  const openShelfGrid = (shelfName: string) => {
    setSelectedCategory(shelfName);
    setViewMode("grid");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredFlipbooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFlipbooks = filteredFlipbooks.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Flipbooks"
        subtitle="Manage, categorize, and schedule digital flipbooks across age brackets and bookshelves"
        actions={
          <div className="flex items-center gap-3">
            {/* Re-sync Covers Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResyncCovers}
              disabled={resyncing}
              className="h-9 px-3 gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Re-sync cover images from Heyzine API"
            >
              <RefreshCw size={14} className={cn(resyncing && "animate-spin")} />
              {resyncing ? "Syncing..." : "Re-sync Covers"}
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mr-2">
              <Button
                variant={viewMode === "bookshelves" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("bookshelves")}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-bold gap-1.5 cursor-pointer transition-all",
                  viewMode === "bookshelves" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-850 dark:text-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
                title="Bookshelves View (Heyzine style)"
              >
                <Library size={14} /> Shelves
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-bold gap-1.5 cursor-pointer transition-all",
                  viewMode === "grid" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-850 dark:text-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
                title="Grid View"
              >
                <LayoutGrid size={14} /> Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-bold gap-1.5 cursor-pointer transition-all",
                  viewMode === "table" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-850 dark:text-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
                title="Table View"
              >
                <List size={14} /> Table
              </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2 cursor-pointer text-white">
                    <Plus size={18} /> Add Flipbook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Flipbook</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                   <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input name="title" placeholder="E.g. Monthly Gazette" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Age Group / Bracket</Label>
                            <select 
                                name="ageGroup" 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">All Ages (Default)</option>
                                <option value="LITTLE_LOFTERS">{getAgeGroupLabel("LITTLE_LOFTERS")}</option>
                                <option value="LOFT_365">{getAgeGroupLabel("LOFT_365")}</option>
                                <option value="BIG_READERS">{getAgeGroupLabel("BIG_READERS")}</option>
                            </select>
                        </div>
                   </div>

                   <div className="space-y-2">
                      <Label>Category / Bookshelf Name</Label>
                      <Input 
                        name="category" 
                        placeholder="E.g. LOFT 365 SERIES, Series 1, Children's Classics..." 
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                      <p className="text-[11px] text-muted-foreground">
                        Group this book into a bookshelf or series folder.
                      </p>
                   </div>

                   <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea name="description" placeholder="Short description..." className="min-h-[100px]" />
                   </div>
                   
                   <div className="space-y-2">
                      <Label>Heyzine Flipbook URL</Label>
                      <Input 
                        name="heyzineUrl" 
                        placeholder="https://heyzine.com/flip-book/..." 
                        required 
                        type="url"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        The cover image and content will be fetched automatically.
                      </p>
                   </div>

                   <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <input type="checkbox" id="isFree" name="isFree" className="h-4 w-4 rounded border-slate-300 text-[#E87154] focus:ring-[#E87154]" />
                      <Label htmlFor="isFree" className="text-sm font-medium cursor-pointer">Free Access (available to all users)</Label>
                   </div>

                   <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                         <input 
                            type="checkbox" 
                            id="schedulePublish" 
                            name="schedulePublish" 
                            className="h-4 w-4 rounded border-slate-300 text-[#E87154] focus:ring-[#E87154]"
                            checked={schedulePublish}
                            onChange={(e) => setSchedulePublish(e.target.checked)}
                         />
                         <Label htmlFor="schedulePublish" className="text-sm font-medium cursor-pointer">Schedule publication</Label>
                      </div>

                      {schedulePublish && (
                         <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <Label>Publish Date & Time</Label>
                            <DateTimePicker
                               value={publishDate}
                               onChange={setPublishDate}
                               placeholder="Select publish date and time"
                            />
                         </div>
                      )}
                   </div>

                   <Button type="submit" className="w-full bg-[#E87154] hover:bg-[#D66144] h-11 text-white">Create Flipbook</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Categorized Filter & Dropdown Toolbar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative group w-full md:w-80">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, shelf, description..."
              className="pl-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-[#E87154]/20 focus-visible:border-[#E87154]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#E87154]" />
          </div>

          {/* Categorized Dropdown Grouping Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Shelf / Category Dropdown */}
            <div className="flex items-center gap-2">
              <Folder size={15} className="text-[#E87154] shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val);
                  if (val !== "all" && viewMode === "bookshelves") {
                    setViewMode("grid");
                  }
                }}
                className="h-10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E87154]"
              >
                <option value="all">All Bookshelves / Categories</option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    📚 {cat}
                  </option>
                ))}
                <option value="UNASSIGNED">📂 Uncategorized Shelves</option>
              </select>
            </div>

            {/* Age Bracket Dropdown */}
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-[#E87154] shrink-0" />
              <select
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                className="h-10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E87154]"
              >
                <option value="all">All Age Brackets</option>
                <option value="LITTLE_LOFTERS">👶 Little Lofters (0-3 yrs)</option>
                <option value="LOFT_365">👧 Loft 365 Readers (4-7 yrs)</option>
                <option value="BIG_READERS">🧒 Big Readers (8+ yrs)</option>
                <option value="UNASSIGNED">Default / All Ages</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 text-xs font-bold text-slate-500 hover:text-red-600 gap-1"
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Shelf Filter Banner when in Grid or Table View */}
      {selectedCategory !== "all" && viewMode !== "bookshelves" && (
        <div className="flex items-center justify-between p-3.5 px-5 bg-[#E87154]/10 rounded-2xl border border-[#E87154]/20 text-[#E87154]">
          <div className="flex items-center gap-2">
            <Folder size={18} className="shrink-0" />
            <span className="font-extrabold text-sm">
              Viewing Shelf: <span className="underline">{selectedCategory === "UNASSIGNED" ? "Uncategorized" : selectedCategory}</span> ({filteredFlipbooks.length} {filteredFlipbooks.length === 1 ? "book" : "books"})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory("all");
              setViewMode("bookshelves");
            }}
            className="text-xs font-bold hover:bg-[#E87154]/20 text-[#E87154] cursor-pointer gap-1"
          >
            <ArrowLeft size={14} /> All Bookshelves
          </Button>
        </div>
      )}

      {/* Conditional Layout Containers based on View Mode */}
      {viewMode === "bookshelves" ? (
        <div className="space-y-10">
          {Object.keys(groupedBookshelves).length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center gap-2">
                <Library className="h-12 w-12 opacity-20" />
                <p className="font-bold text-base">No flipbook bookshelves found.</p>
                <p className="text-xs text-slate-400">Try adjusting your age bracket or category dropdown filters.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {Object.entries(groupedBookshelves).map(([shelfName, books]) => (
                <div
                  key={shelfName}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Bookshelf Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight group-hover:text-[#E87154] transition-colors">
                          {shelfName}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                          Updated {new Date(books[0]?.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-[#E87154]/10 text-[#E87154] font-extrabold text-[10px] rounded-full px-2.5">
                        {books.length} {books.length === 1 ? "Book" : "Books"}
                      </Badge>
                    </div>

                    {/* Heyzine Style Bookshelf Preview Box */}
                    <div 
                      onClick={() => openShelfGrid(shelfName)}
                      className="bg-slate-100 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200/40 dark:border-slate-800 min-h-[160px] flex items-center justify-center cursor-pointer hover:bg-slate-200/50 transition-colors relative overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] items-center justify-center">
                        {books.slice(0, 3).map((b, i) => (
                          <div
                            key={b.id}
                            className="aspect-[3/4] bg-white rounded shadow-md overflow-hidden border border-black/5 transition-transform duration-300 group-hover:scale-105"
                            style={{ transform: `rotate(${(i - 1) * 3}deg)` }}
                          >
                            <BookshelfPreviewThumb book={b} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bookshelf Card Footer Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {books.filter(b => b.ageGroup).length} Tagged Brackets
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openShelfGrid(shelfName)}
                      className="text-xs font-black text-[#E87154] hover:bg-[#E87154]/10 p-0 h-auto px-2 py-1 rounded-lg cursor-pointer"
                    >
                      View Shelf →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border rounded-lg overflow-hidden border-slate-100 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Flipbook</TableHead>
                  <TableHead>Bookshelf / Category</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFlipbooks.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <BookOpen className="h-10 w-10 opacity-20" />
                                <p>No flipbooks found matching current filters.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                {paginatedFlipbooks.map((book) => (
                  <TableRow key={book.id} className="group transition-colors">
                    <TableCell className="pl-6">
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{book.title}</span>
                            <span className="text-[11px] text-slate-500">Created {new Date(book.createdAt).toLocaleDateString()}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      {book.category ? (
                        <Badge 
                          variant="outline" 
                          onClick={() => openShelfGrid(book.category)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#E87154] border-[#E87154]/20 cursor-pointer hover:bg-orange-100"
                        >
                          📚 {book.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                        {book.ageGroup ? (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-none">
                                {getAgeGroupLabel(book.ageGroup)}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-none">
                                All Ages
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell>
                      {book.publishedAt && new Date(book.publishedAt) > new Date() ? (
                        <Badge className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-none">
                          <Clock size={10} className="mr-1" /> Scheduled
                        </Badge>
                      ) : book.isPublished ? (
                        <Badge className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-none">
                          <CheckCircle2 size={10} className="mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {book.publishedAt ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(book.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-[10px] text-slate-400">{new Date(book.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        {/* @ts-ignore */}
                        <FlipbookActions flipbook={book} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t border-slate-50 dark:border-slate-800">
              <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredFlipbooks.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
              />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Grid Layout */}
          <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {paginatedFlipbooks.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-10 w-10 opacity-20" />
                  <p>No flipbooks found matching current filters.</p>
                </div>
              </div>
            )}
            {paginatedFlipbooks.map((book) => (
              <AdminBookItem key={book.id} book={book} loadFlipbooks={loadFlipbooks} onSelectShelf={openShelfGrid} />
            ))}
          </div>

          {/* Pagination directly on page background */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
              <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredFlipbooks.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
              />
          </div>
        </div>
      )}
    </div>
  );
}

function BookshelfPreviewThumb({ book }: { book: any }) {
  const [error, setError] = useState(false);
  if (book.coverImageUrl && !error) {
    return <img src={book.coverImageUrl} alt={book.title} onError={() => setError(true)} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFFAF5] p-1 text-[8px] font-bold text-center leading-tight">
      <BookOpen className="h-3 w-3 text-[#E87154] mb-0.5" />
      <span className="line-clamp-2">{book.title}</span>
    </div>
  );
}

function AdminBookItem({ book, loadFlipbooks, onSelectShelf }: { book: any; loadFlipbooks: () => void; onSelectShelf?: (shelf: string) => void }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const aspect = dimensions ? dimensions.width / dimensions.height : 0.75;
  const cappedAspect = Math.max(0.5, Math.min(2.0, aspect));

  const isScheduled = book.publishedAt && new Date(book.publishedAt) > new Date();
  const isPublished = book.isPublished && !isScheduled;

  async function confirmDelete() {
    const result = await deleteFlipbook(book.id);
    if (result.success) {
      toast.success("Flipbook deleted.");
      loadFlipbooks();
    } else {
      toast.error(result.error || "Failed to delete.");
    }
    setDeleteOpen(false);
  }

  return (
    <div className="group flex flex-col w-full">
      {/* Cover image wrapper: scales naturally with capped aspect ratio, max height, and horizontal centering */}
      <div className="w-full relative flex items-center justify-center">
        <div
          className="block w-full max-h-[280px] transition-all duration-300 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1.5 text-left shadow-[0_12px_24px_-8px_rgba(0,0,0,0.25)] group-hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.35)] rounded-[4px] relative mx-auto overflow-hidden bg-[#FFFAF5] border border-black/5"
          style={{ aspectRatio: `${cappedAspect}` }}
        >
          {book.coverImageUrl && !imgError ? (
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
              onError={() => {
                setImgError(true);
              }}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFFAF5] p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E87154]/10 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-[#E87154]" />
              </div>
              <span className="text-stone-850 font-bold text-xs sm:text-sm leading-tight line-clamp-3 px-2">
                {book.title}
              </span>
            </div>
          )}
          
          {/* Spine binding highlight crease for premium look */}
          <div className="absolute inset-y-0 left-0 w-[8px] bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 left-[8px] w-[1px] bg-white/10 pointer-events-none z-20" />
          
          {/* Badges on cover */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {book.isFree && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit" variant="default">Free</Badge>
            )}
            {book.category && (
              <Badge 
                onClick={() => onSelectShelf && onSelectShelf(book.category)}
                className="bg-[#E87154] text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit truncate max-w-[100px] cursor-pointer hover:bg-[#D66144]" 
                variant="default"
              >
                📚 {book.category}
              </Badge>
            )}
            {book.ageGroup ? (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit" variant="default">
                {getAgeGroupLabel(book.ageGroup)}
              </Badge>
            ) : (
              <Badge className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit" variant="default">
                All Ages
              </Badge>
            )}
          </div>

          <div className="absolute bottom-2 right-2 z-20">
            {isScheduled ? (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide flex items-center gap-0.5" variant="default">
                <Clock size={8} /> Scheduled
              </Badge>
            ) : isPublished ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide flex items-center gap-0.5" variant="default">
                <CheckCircle2 size={8} /> Published
              </Badge>
            ) : (
              <Badge className="bg-slate-400 hover:bg-slate-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide" variant="default">
                Draft
              </Badge>
            )}
          </div>

          {/* Hover Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-30">
            <div className="flex items-center justify-center p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100/10 dark:border-slate-800/10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewOpen(true)} 
                title="View Flipbook"
                className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 p-0 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditOpen(true)} 
                title="Edit"
                className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 p-0 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0 cursor-pointer" 
                onClick={() => setDeleteOpen(true)} 
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Render Modals */}
      <EditFlipbookDialog 
          flipbook={book} 
          open={editOpen} 
          onOpenChange={setEditOpen} 
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete "{book.title}".
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {viewOpen && (
           <ReliableFlipbookViewer 
              pdfUrl={book.pdfUrl || ""} 
              iframeContent={book.iframeContent}
              onClose={() => setViewOpen(false)} 
              title={book.title}
           />
      )}

      {/* Book Metadata */}
      <div className="text-left w-full mt-2.5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 text-sm sm:text-base leading-tight">
          {book.title}
        </h3>
        <div className="flex items-center justify-between gap-1 mt-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            {new Date(book.createdAt).toLocaleDateString()}
          </span>
          {book.category && (
            <span 
              onClick={() => onSelectShelf && onSelectShelf(book.category)}
              className="text-[10px] font-bold text-[#E87154] truncate max-w-[120px] cursor-pointer hover:underline"
            >
              📚 {book.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
