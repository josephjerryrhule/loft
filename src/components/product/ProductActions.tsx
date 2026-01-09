"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { EditProductDialog } from "./EditProductDialog";
import { ProductViewer } from "./ProductViewer";
import { deleteProduct } from "@/app/actions/products";
import { toast } from "sonner";
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

interface ProductActionsProps {
    product: any;
}

export function ProductActions({ product }: ProductActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteProduct(product.id);
            toast.success("Product deleted successfully");
            setDeleteOpen(false);
        } catch (error) {
            toast.error("Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="icon" onClick={() => setViewOpen(true)} title="View Details">
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Edit Product">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} title="Delete Product">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <EditProductDialog 
                product={product} 
                open={editOpen} 
                onOpenChange={setEditOpen} 
            />

            <ProductViewer
                product={product}
                open={viewOpen}
                onOpenChange={setViewOpen}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete <b>{product.title}</b>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
