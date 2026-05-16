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
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toast } from "sonner";
import { getAgeGroupLabel } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, CheckCircle2, Plus } from "lucide-react";


export default function AdminFlipbooksPage() {
  const [flipbooks, setFlipbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      setSchedulePublish(false);
      setPublishDate(undefined);
      loadFlipbooks();
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Flipbooks"
        subtitle="Manage and schedule digital flipbooks for various age groups"
        actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2">
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
        }
      />

      <div className="rounded-xl border-none shadow-md overflow-hidden bg-white">
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
                        <span className="font-bold text-sm text-slate-900">{book.title}</span>
                        <span className="text-[11px] text-slate-500">Created {new Date(book.createdAt).toLocaleDateString()}</span>
                    </div>
                </TableCell>
                <TableCell>
                    {book.ageGroup ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-none">
                            {getAgeGroupLabel(book.ageGroup)}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-none">
                            All Ages
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                  {book.publishedAt && new Date(book.publishedAt) > new Date() ? (
                    <Badge className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border-none">
                      <Clock size={10} className="mr-1" /> Scheduled
                    </Badge>
                  ) : book.isPublished ? (
                    <Badge className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border-none">
                      <CheckCircle2 size={10} className="mr-1" /> Published
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border-none">
                      Draft
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {book.publishedAt ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{new Date(book.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-[10px] text-slate-400">{new Date(book.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
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
        <div className="p-4 border-t border-slate-50">
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
      </div>
    </div>
  );
}
