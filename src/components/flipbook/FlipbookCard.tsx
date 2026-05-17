"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, RefreshCw, Play, Pause, Globe, HardDrive } from "lucide-react";
import { deleteFlipbook, reRenderFlipbook } from "@/app/actions/flipbooks";

export interface FlipbookCardData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  isFree: boolean;
  totalPages: number | null;
  ageGroup: string | null;
  sourceType: "HEYZINE" | "SELF_HOSTED";
}

interface Props {
  flipbook: FlipbookCardData;
  onEdit: (id: string) => void;
  onPublishToggle: (id: string, next: boolean) => Promise<void>;
}

export function FlipbookCard({ flipbook, onEdit, onPublishToggle }: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [busy, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${flipbook.title}"? This wipes the cover, pages, and source PDF.`)) return;
    startTransition(async () => {
      const r = await deleteFlipbook(flipbook.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Flipbook deleted");
        router.refresh();
      }
    });
  };

  const handleRerender = () => {
    if (flipbook.sourceType !== "SELF_HOSTED") {
      toast.error("Re-render only available for self-hosted flipbooks");
      return;
    }
    startTransition(async () => {
      const r = await reRenderFlipbook(flipbook.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Re-render complete");
        router.refresh();
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      await onPublishToggle(flipbook.id, !flipbook.isPublished);
      router.refresh();
    });
  };

  return (
    <div
      className="relative w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300">
        {flipbook.coverImageUrl && (
          <img src={flipbook.coverImageUrl} alt={flipbook.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              flipbook.isPublished ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
            }`}
          >
            {flipbook.isPublished ? "Live" : "Draft"}
          </span>
        </div>
        {flipbook.ageGroup && (
          <div className="absolute top-2 left-2 text-[9px] font-bold bg-black/40 backdrop-blur text-white px-2 py-0.5 rounded">
            {flipbook.ageGroup}
          </div>
        )}

        {hovered && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col justify-center items-stretch gap-2 p-4">
            <Button size="sm" className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold" onClick={() => onEdit(flipbook.id)} disabled={busy}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handlePublish} disabled={busy}>
              {flipbook.isPublished ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              {flipbook.isPublished ? "Unpublish" : "Publish"}
            </Button>
            {flipbook.sourceType === "SELF_HOSTED" && (
              <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={handleRerender} disabled={busy}>
                <RefreshCw className="h-3 w-3 mr-1" /> Re-render
              </Button>
            )}
            <Button size="sm" variant="outline" className="bg-transparent border-red-400/40 text-red-300 hover:bg-red-500/10" onClick={handleDelete} disabled={busy}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-black text-slate-900 truncate">{flipbook.title}</p>
        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-bold">
          <span>{flipbook.totalPages ?? "—"} pages</span>
          <span className={flipbook.isFree ? "text-emerald-600" : "text-[#E87154]"}>{flipbook.isFree ? "FREE" : "PAID"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400 font-bold">
          {flipbook.sourceType === "HEYZINE" ? <Globe className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
          {flipbook.sourceType === "HEYZINE" ? "Heyzine" : "Self-host"}
        </div>
      </div>
    </div>
  );
}
