"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlipbook, getAllFlipbooks, deleteFlipbook } from "@/app/actions/flipbooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FlipbookActions } from "@/components/flipbook/FlipbookActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, Plus, BookOpen, Clock, CheckCircle2, LayoutGrid, List, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Grid/Table View & Search States
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter flipbooks dynamically based on search query
  const filteredFlipbooks = useMemo(() => {
    if (!searchQuery.trim()) return flipbooks;
    const q = searchQuery.toLowerCase();
    return flipbooks.filter(f => 
      f.title.toLowerCase().includes(q) || 
      (f.description && f.description.toLowerCase().includes(q))
    );
  }, [flipbooks, searchQuery]);

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
        subtitle="Manage and schedule digital flipbooks for various age groups"
        actions={
          <div className="flex items-center gap-3">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mr-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-bold gap-1.5 cursor-pointer transition-all",
                  viewMode === "grid" ? "bg-white dark:bg-slate-950 shadow-sm text-slate-850 dark:text-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
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
                            <Label>Age Group</Label>
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

                   <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
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

                   <Button type="submit" className="w-full bg-[#E87154] hover:bg-[#D66144] h-11">Create Flipbook</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Conditional Layout Containers based on View Mode */}
      {viewMode === "table" ? (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 p-6 space-y-6">
          {/* Search Bar Input inside table container */}
          <div className="relative group w-full sm:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flipbooks..."
              className="pl-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-[#E87154]/20 focus-visible:border-[#E87154]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#E87154]" />
          </div>

          <div className="border rounded-lg overflow-hidden border-slate-100 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Flipbook</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFlipbooks.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <BookOpen className="h-10 w-10 opacity-20" />
                                <p>No flipbooks found.</p>
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
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                        {book.createdBy?.firstName || book.createdBy?.email.split('@')[0]}
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
          {/* Search Bar Input directly on page background in grid mode */}
          <div className="relative group w-full sm:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flipbooks..."
              className="pl-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-[#E87154]/20 focus-visible:border-[#E87154]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#E87154]" />
          </div>

          {/* Grid Layout without a background box container */}
          <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {paginatedFlipbooks.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-10 w-10 opacity-20" />
                  <p>No flipbooks found.</p>
                </div>
              </div>
            )}
            {paginatedFlipbooks.map((book) => (
              <AdminBookItem key={book.id} book={book} loadFlipbooks={loadFlipbooks} />
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

function AdminBookItem({ book, loadFlipbooks }: { book: any; loadFlipbooks: () => void }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
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
              <span className="text-stone-850 font-bold text-xs sm:text-sm leading-tight line-clamp-3">
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
            {/* Action pill is fully interactive and doesn't get hidden */}
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

      {/* Render Modals at Root of AdminBookItem to prevent them from inheriting hover opacity-0 */}
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

      {/* Book Metadata - left aligned below cover */}
      <div className="text-left w-full mt-2.5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 text-sm sm:text-base leading-tight">
          {book.title}
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">
          Created {new Date(book.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
