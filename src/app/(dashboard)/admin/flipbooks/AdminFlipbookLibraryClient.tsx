"use client";

import { useState, useCallback } from "react";
import { AdminFlipbookLibrary } from "@/components/flipbook/AdminFlipbookLibrary";
import { CreateFlipbookDialog } from "@/components/flipbook/CreateFlipbookDialog";
import { EditFlipbookDialog } from "@/components/flipbook/EditFlipbookDialog";
import { updateFlipbook } from "@/app/actions/flipbooks";

interface Props {
  initialGroups: any[];
  categories: { id: string; name: string }[];
}

export function AdminFlipbookLibraryClient({ initialGroups, categories }: Props) {
  const [editId, setEditId] = useState<string | null>(null);

  const onPublishToggle = useCallback(async (id: string, next: boolean) => {
    await updateFlipbook(id, { isPublished: next } as any);
  }, []);

  // EditFlipbookDialog (pre-Task-21) takes a full flipbook object, not a flipbookId.
  const editFlipbook = editId
    ? initialGroups.flatMap((g) => g.flipbooks).find((f: any) => f.id === editId) ?? null
    : null;

  return (
    <>
      <AdminFlipbookLibrary
        groups={initialGroups}
        onEdit={(id) => setEditId(id)}
        onPublishToggle={onPublishToggle}
        renderCreateButton={() => <CreateFlipbookDialog />}
      />
      {editFlipbook && (
        <EditFlipbookDialog
          flipbook={editFlipbook}
          open={true}
          onOpenChange={(o) => { if (!o) setEditId(null); }}
        />
      )}
    </>
  );
}
