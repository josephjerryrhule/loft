"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditUserDialog } from "./EditUserDialog";
import { deleteUser } from "@/app/actions/user";
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
// import { DropdownMenu... } from ... if we wanted dropdown, but icons requested

interface UserActionsProps {
    user: any;
}

export function UserActions({ user }: UserActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    async function confirmDelete() {
        const result = await deleteUser(user.id);
        if (result.success) {
            toast.success("User deleted.");
        } else {
            toast.error(result.error || "Failed to delete.");
        }
        setDeleteOpen(false);
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <EditUserDialog 
                user={user} 
                open={editOpen} 
                onOpenChange={setEditOpen} 
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user <span className="font-bold">{user.email}</span>. 
                            This action cannot be undone.
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
        </>
    );
}
