"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { EditFlipbookDialog } from "./EditFlipbookDialog";
import { deleteFlipbook } from "@/app/actions/flipbooks";
import { toast } from "sonner";
import dynamic from "next/dynamic";
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

const ReliableFlipbookViewer = dynamic(
  () => import("./ReliableFlipbookViewer").then((mod) => mod.ReliableFlipbookViewer),
  { ssr: false }
);

interface FlipbookActionsProps {
    flipbook: any;
}

export function FlipbookActions({ flipbook }: FlipbookActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);

    async function confirmDelete() {
        const result = await deleteFlipbook(flipbook.id);
        if (result.success) {
            toast.success("Flipbook deleted.");
        } else {
            toast.error(result.error || "Failed to delete.");
        }
        setDeleteOpen(false);
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setViewOpen(true)} title="View Flipbook">
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Edit">
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <EditFlipbookDialog 
                flipbook={flipbook} 
                open={editOpen} 
                onOpenChange={setEditOpen} 
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{flipbook.title}".
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
                    pdfUrl={flipbook.pdfUrl || ""} 
                    onClose={() => setViewOpen(false)} 
                    title={flipbook.title}
                 />
            )}
        </>
    );
}
