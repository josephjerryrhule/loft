"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlipbook, getAllFlipbooks, getAllCategories } from "@/app/actions/flipbooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { FlipbookActions } from "@/components/flipbook/FlipbookActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2 } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toast } from "sonner";


export default function AdminFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadFlipbooks();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add category from state
    if (selectedCategory.length > 0) {
      formData.set("category", selectedCategory[0]);
    }
    
    // Add publish date if scheduled
    if (schedulePublish && publishDate) {
      formData.set("publishedAt", publishDate.toISOString());
    }
    
    // Debug: Log form data
    console.log("Form submission data:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    const result = await createFlipbook(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Flipbook created successfully");
      setDialogOpen(false);
      setSelectedCategory([]);
      setSchedulePublish(false);
      setPublishDate(undefined);
      loadFlipbooks();
      loadCategories(); // Refresh categories
    }
  };

  const totalPages = Math.ceil(flipbooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFlipbooks = flipbooks.slice(startIndex, startIndex + itemsPerPage);

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
        <h1 className="text-3xl font-bold">Flipbooks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Flipbook</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Flipbook</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <Label>Title</Label>
                  <Input name="title" placeholder="E.g. Monthly Gazette" required />
               </div>
               <div>
                  <Label>Category</Label>
                  <TagInput
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    suggestions={categories}
                    placeholder="Type to search or add new category..."
                    maxTags={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select from existing categories or type and press Enter to add a new one
                  </p>
               </div>
               <div>
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Short description..." />
               </div>
               
               <div>
                  <Label>Heyzine Flipbook URL</Label>
                  <Input 
                    name="heyzineUrl" 
                    placeholder="https://heyzine.com/flip-book/..." 
                    required 
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the Heyzine flipbook URL here. The cover image and content will be fetched automatically.
                  </p>
               </div>

               <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isFree" name="isFree" className="h-4 w-4" />
                  <Label htmlFor="isFree">Free Access (available to all users)</Label>
               </div>

               <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center space-x-2">
                     <input 
                        type="checkbox" 
                        id="schedulePublish" 
                        name="schedulePublish" 
                        className="h-4 w-4"
                        checked={schedulePublish}
                        onChange={(e) => setSchedulePublish(e.target.checked)}
                     />
                     <Label htmlFor="schedulePublish">Schedule publication</Label>
                  </div>

                  {schedulePublish && (
                     <div>
                        <Label>Publish Date & Time</Label>
                        <DateTimePicker
                           value={publishDate}
                           onChange={setPublishDate}
                           placeholder="Select publish date and time"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                           The flipbook will automatically be published at this date and time
                        </p>
                     </div>
                  )}
               </div>

               <Button type="submit" className="w-full">Create Flipbook</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters could go here */}

      <div className="border rounded-md bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publish Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlipbooks.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No flipbooks found.
                    </TableCell>
                </TableRow>
            )}
            {paginatedFlipbooks.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>
                    {book.category && (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {book.category}
                        </span>
                    )}
                </TableCell>
                <TableCell>{book.createdBy?.email}</TableCell>
                <TableCell>
                  {book.publishedAt && new Date(book.publishedAt) > new Date() ? (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Scheduled
                    </span>
                  ) : book.isPublished ? (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      Draft
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {book.publishedAt ? (
                    <div>
                      <div className="text-sm">{new Date(book.publishedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(book.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{new Date(book.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    {/* @ts-ignore */}
                    <FlipbookActions flipbook={book} />
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
        totalItems={flipbooks.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
