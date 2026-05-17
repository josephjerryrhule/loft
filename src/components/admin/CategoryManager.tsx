"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { createCategory, renameCategory, deleteCategory, reorderCategories } from "@/app/actions/categories";

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  _count?: { flipbooks: number };
}

export function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  const add = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const r = await createCategory(newName);
      if (r?.error) toast.error(r.error);
      else {
        toast.success(`Added "${newName}"`);
        setNewName("");
        refresh();
      }
    });
  };

  const startRename = (c: Category) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const saveRename = () => {
    if (!editingId) return;
    startTransition(async () => {
      const r = await renameCategory(editingId, editingName);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Renamed");
        setEditingId(null);
        refresh();
      }
    });
  };

  const remove = (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteCategory(c.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Deleted");
        refresh();
      }
    });
  };

  // simple up/down reorder (drag-and-drop omitted for v1 simplicity)
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...list];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setList(next);
    startTransition(async () => {
      const r = await reorderCategories(next.map((c) => c.id));
      if (r?.error) toast.error(r.error);
      else refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          onKeyDown={(e) => e.key === "Enter" && add()}
          disabled={pending}
        />
        <Button onClick={add} disabled={pending} className="bg-[#E87154] hover:bg-[#D66144] text-white gap-2">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="space-y-1">
        {list.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex flex-col">
              <button onClick={() => move(idx, -1)} className="text-slate-400 hover:text-slate-700 text-xs">▲</button>
              <button onClick={() => move(idx, +1)} className="text-slate-400 hover:text-slate-700 text-xs">▼</button>
            </div>
            <GripVertical className="h-4 w-4 text-slate-300" />
            {editingId === c.id ? (
              <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1" />
            ) : (
              <div className="flex-1">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{c.slug} · {c._count?.flipbooks ?? 0} books</p>
              </div>
            )}
            {editingId === c.id ? (
              <>
                <Button size="icon" variant="ghost" onClick={saveRename} disabled={pending}><Check className="h-4 w-4 text-emerald-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-slate-400" /></Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" onClick={() => startRename(c)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c)} disabled={(c._count?.flipbooks ?? 0) > 0}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
