"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createFlipbook } from "@/app/actions/flipbooks";
import { UploadProgress, type UploadStage } from "./UploadProgress";

interface Category {
  id: string;
  name: string;
}

export function CreateFlipbookDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"heyzine" | "pdf">("heyzine");
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<UploadStage>({ kind: "idle" });

  // shared fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [isFree, setIsFree] = useState(true);

  // heyzine fields
  const [heyzineUrl, setHeyzineUrl] = useState("");
  const [iframeContent, setIframeContent] = useState("");

  // pdf fields
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setAgeGroup("");
    setIsFree(true);
    setHeyzineUrl("");
    setIframeContent("");
    setPdfFile(null);
    setStage({ kind: "idle" });
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }

    startTransition(async () => {
      try {
        if (tab === "heyzine") {
          if (!heyzineUrl && !iframeContent) {
            toast.error("Provide a Heyzine URL or iframe HTML");
            return;
          }
          setStage({ kind: "saving" });
          const r = await createFlipbook({
            sourceType: "HEYZINE",
            title,
            description,
            categoryId: categoryId || null,
            ageGroup: ageGroup || null,
            isFree,
            heyzineUrl: heyzineUrl || null,
            iframeContent: iframeContent || null,
          });
          if (r?.error) {
            setStage({ kind: "error", message: r.error });
            return;
          }
          setStage({ kind: "done" });
          toast.success("Flipbook created");
          setOpen(false);
          reset();
          router.refresh();
        } else {
          if (!pdfFile) {
            toast.error("Pick a PDF");
            return;
          }
          setStage({ kind: "uploading" });
          // Server action runs end-to-end; we can't observe stages without SSE.
          // Show "compressing" right after handoff to keep UI alive.
          setTimeout(() => setStage((s) => (s.kind === "uploading" ? { kind: "compressing" } : s)), 1500);
          setTimeout(() => setStage((s) => (s.kind === "compressing" ? { kind: "rendering" } : s)), 5000);

          const r = await createFlipbook({
            sourceType: "SELF_HOSTED",
            title,
            description,
            categoryId: categoryId || null,
            ageGroup: ageGroup || null,
            isFree,
            pdfFile,
          });

          if (r?.error) {
            setStage({ kind: "error", message: r.error });
            return;
          }
          setStage({ kind: "done" });
          toast.success("Flipbook published");
          setTimeout(() => {
            setOpen(false);
            reset();
            router.refresh();
          }, 600);
        }
      } catch (e: any) {
        setStage({ kind: "error", message: e?.message || "Upload failed" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> New Flipbook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create flipbook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={pending}>
                <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup} disabled={pending}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-3">0-3</SelectItem>
                  <SelectItem value="4-7">4-7</SelectItem>
                  <SelectItem value="8+">8+</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <input id="isFree" type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} disabled={pending} />
              <Label htmlFor="isFree">Free</Label>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="heyzine"><Globe className="h-4 w-4 mr-2" /> Heyzine</TabsTrigger>
              <TabsTrigger value="pdf"><HardDrive className="h-4 w-4 mr-2" /> PDF Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="heyzine" className="space-y-3 pt-4">
              <div>
                <Label>Heyzine URL</Label>
                <Input value={heyzineUrl} onChange={(e) => setHeyzineUrl(e.target.value)} placeholder="https://heyzine.com/flip-book/…" disabled={pending} />
              </div>
              <div>
                <Label>Or paste iframe HTML</Label>
                <Textarea value={iframeContent} onChange={(e) => setIframeContent(e.target.value)} rows={4} disabled={pending} />
              </div>
            </TabsContent>
            <TabsContent value="pdf" className="space-y-3 pt-4">
              <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} disabled={pending} />
              {pdfFile && <p className="text-xs text-slate-500">{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
              <p className="text-[11px] text-slate-400">Max 50 MB. The server will compress + render pages — this may take 10-60 seconds.</p>
            </TabsContent>
          </Tabs>

          {stage.kind !== "idle" && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <UploadProgress stage={stage} />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={submit} disabled={pending} className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold">
              {pending ? "Working…" : "Create flipbook"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
