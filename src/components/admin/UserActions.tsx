"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, QrCode } from "lucide-react";
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
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [downloadingQR, setDownloadingQR] = useState(false);

    async function confirmDelete() {
        const result = await deleteUser(user.id);
        if (result.success) {
            toast.success("User deleted.");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete.");
        }
        setDeleteOpen(false);
    }

    async function downloadQRCode() {
        try {
            setDownloadingQR(true);
            const response = await fetch(`/api/generate-qr?userId=${user.id}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate QR code");
            }

            // Create blob from response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = `${user.role.toLowerCase()}-${user.firstName || "user"}-qr.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success("QR code downloaded successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to download QR code");
        } finally {
            setDownloadingQR(false);
        }
    }

    const canDownloadQR = user.role === "MANAGER" || user.role === "AFFILIATE";

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                {canDownloadQR && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={downloadQRCode}
                        disabled={downloadingQR}
                        title="Download QR Code"
                    >
                        <QrCode className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
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
