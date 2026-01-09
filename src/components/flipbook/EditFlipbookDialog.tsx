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
} from "@/components/ui/dialog";
import { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload"; 

const editFlipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  isFree: z.boolean().optional(),
});

interface EditFlipbookDialogProps {
    flipbook: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditFlipbookDialog({ flipbook, open, onOpenChange }: EditFlipbookDialogProps) {
  const form = useForm<z.infer<typeof editFlipbookSchema>>({
    resolver: zodResolver(editFlipbookSchema),
    defaultValues: {
      title: flipbook.title,
      description: flipbook.description || "",
      category: flipbook.category || "",
      isFree: flipbook.isFree || false,
    },
  });

  async function onSubmit(values: z.infer<typeof editFlipbookSchema>) {
    const result = await updateFlipbook(flipbook.id, values);
    if (result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Flipbook updated successfully!");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Flipbook</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input placeholder="e.g. Fiction, Annual Report" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="h-24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        checked={field.value} 
                        onChange={field.onChange} 
                        className="h-4 w-4" 
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Free Access (available to all users)</FormLabel>
                    <FormMessage />
                  </FormItem>
                )} />

              <div className="flex justify-end pt-2">
                 <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
