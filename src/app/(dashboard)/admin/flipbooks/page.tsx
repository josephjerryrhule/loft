"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlipbook, getAllFlipbooks } from "@/app/actions/flipbooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { FlipbookActions } from "@/components/flipbook/FlipbookActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2 } from "lucide-react";

export default function AdminFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Add Flipbook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Flipbook</DialogTitle>
            </DialogHeader>
            <form action={createFlipbook} className="space-y-4">
               <div>
                  <Label>Title</Label>
                  <Input name="title" placeholder="E.g. Monthly Gazette" required />
               </div>
               <div>
                  <Label>Category</Label>
                  <Input name="category" placeholder="e.g. Magazine, Catalog" />
               </div>
               <div>
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Short description..." />
               </div>
               
               <FileUpload 
                  label="PDF File" 
                  name="pdfUrl" 
                  accept=".pdf" 
                  required 
                />

               <FileUpload 
                  label="Cover Image" 
                  name="coverImageUrl" 
                  accept="image/*" 
                />

               <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isFree" name="isFree" className="h-4 w-4" />
                  <Label htmlFor="isFree">Free Access (available to all users)</Label>
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
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlipbooks.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                <TableCell>{book.isPublished ? "Published" : "Draft"}</TableCell>
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
