"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateFlipbook } from "@/app/actions/flipbooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAgeGroupLabel } from "@/lib/utils";
import { BookOpen, Save, Globe } from "lucide-react";

const editFlipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  heyzineUrl: z.string().url("Must be a valid URL").optional(),
  isFree: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

interface EditFlipbookDialogProps {
    flipbook: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories?: { id: string; name: string }[];
}

export function EditFlipbookDialog({ flipbook, open, onOpenChange, categories }: EditFlipbookDialogProps) {
  const form = useForm<z.infer<typeof editFlipbookSchema>>({
    resolver: zodResolver(editFlipbookSchema),
    defaultValues: {
      title: flipbook.title,
      description: flipbook.description || "",
      ageGroup: flipbook.ageGroup || "",
      heyzineUrl: flipbook.heyzineUrl || "",
      isFree: flipbook.isFree || false,
      categoryId: flipbook.categoryId ?? null,
    },
  });

  async function onSubmit(values: z.infer<typeof editFlipbookSchema>) {
    const result = await updateFlipbook(flipbook.id, {
      ...values,
      heyzineUrl: values.heyzineUrl || undefined,
    });
    if (result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Flipbook updated successfully!");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-x-hidden">
        <div className="bg-[#E87154] p-6 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 rotate-12">
                <BookOpen size={140} className="w-24 h-24 sm:w-36 sm:h-36" />
            </div>
            <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl sm:text-3xl font-black text-white leading-none">Edit Flipbook</DialogTitle>
                <DialogDescription className="text-white/80 font-medium mt-3 text-sm sm:text-base max-w-lg">
                    Update the book's content and who can read it.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 overflow-x-hidden">
                <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
                    <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Book Title</FormLabel>
                        <FormControl><Input placeholder="E.g. Monthly Gazette" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />

                    <FormField control={form.control} name="ageGroup" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Target Age Group</FormLabel>
                        <FormControl>
                        <select 
                            {...field}
                            className="flex h-11 sm:h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm sm:text-base font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87154] disabled:cursor-not-allowed disabled:opacity-50 border-none shadow-inner"
                        >
                            <option value="">All Ages (Default)</option>
                            <option value="LITTLE_LOFTERS">{getAgeGroupLabel("LITTLE_LOFTERS")}</option>
                            <option value="LOFT_365">{getAgeGroupLabel("LOFT_365")}</option>
                            <option value="BIG_READERS">{getAgeGroupLabel("BIG_READERS")}</option>
                        </select>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                </div>
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Description</FormLabel>
                    <FormControl><Textarea className="min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4" placeholder="Summarize the content..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Category</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                      value={field.value || "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4">
                          <SelectValue placeholder="Pick a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Uncategorized</SelectItem>
                        {(categories || []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-4 border-t pt-8">
                  <FormField control={form.control} name="heyzineUrl" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe size={14} className="text-[#E87154]" />
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Heyzine Flipbook URL</FormLabel>
                      </div>
                      <FormControl><Input placeholder="https://heyzine.com/flip-book/..." className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                      <FormMessage />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Updating this URL will automatically refresh the cover image and content across all viewers.
                      </p>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem className="flex items-center space-x-4 p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl sm:rounded-[2rem] border-none shadow-inner">
                    <FormControl>
                      <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={field.onChange} 
                            className="h-6 w-6 rounded-lg border-slate-300 text-[#E87154] focus:ring-[#E87154] transition-all cursor-pointer" 
                        />
                      </div>
                    </FormControl>
                    <div className="space-y-1">
                        <FormLabel className="text-base sm:text-lg font-black text-slate-900 dark:text-white cursor-pointer select-none leading-none">Global Free Access</FormLabel>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">If checked, this book bypasses all subscription requirements and is available to all users.</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

              <div className="flex justify-end pt-6">
                 <Button type="submit" className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base">
                    <Save className="mr-3 h-6 w-6" />
                    Save Flipbook Changes
                 </Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
