"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Globe, HardDrive, BookOpen, Save, FileText, X, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createFlipbook } from "@/app/actions/flipbooks";
import { UploadProgress, type UploadStage } from "./UploadProgress";
import { getAgeGroupLabel } from "@/lib/utils";

const createFlipbookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  isFree: z.boolean().optional(),
  heyzineUrl: z.string().optional(),
  iframeContent: z.string().optional(),
});

type CreateFlipbookFormValues = z.infer<typeof createFlipbookSchema>;

export function CreateFlipbookDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"heyzine" | "pdf">("heyzine");
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<UploadStage>({ kind: "idle" });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptDroppedFile = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("PDF too large (max 50 MB)");
      return;
    }
    setPdfFile(f);
  };

  const form = useForm<CreateFlipbookFormValues>({
    resolver: zodResolver(createFlipbookSchema),
    defaultValues: {
      title: "",
      description: "",
      ageGroup: "",
      isFree: true,
      heyzineUrl: "",
      iframeContent: "",
    },
  });

  const reset = () => {
    form.reset();
    setPdfFile(null);
    setStage({ kind: "idle" });
    setTab("heyzine");
  };

  const onSubmit = (values: CreateFlipbookFormValues) => {
    startTransition(async () => {
      try {
        if (tab === "heyzine") {
          if (!values.heyzineUrl && !values.iframeContent) {
            toast.error("Provide a Heyzine URL or iframe HTML");
            return;
          }
          setStage({ kind: "saving" });
          const r = await createFlipbook({
            sourceType: "HEYZINE",
            title: values.title,
            description: values.description,
            ageGroup: values.ageGroup || null,
            isFree: values.isFree,
            heyzineUrl: values.heyzineUrl || null,
            iframeContent: values.iframeContent || null,
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
          setTimeout(() => setStage((s) => (s.kind === "uploading" ? { kind: "compressing" } : s)), 1500);
          setTimeout(() => setStage((s) => (s.kind === "compressing" ? { kind: "rendering" } : s)), 5000);

          const r = await createFlipbook({
            sourceType: "SELF_HOSTED",
            title: values.title,
            description: values.description,
            ageGroup: values.ageGroup || null,
            isFree: values.isFree,
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
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-x-hidden">
        <div className="bg-[#E87154] p-6 sm:p-10 text-white relative">
          <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 rotate-12">
            <BookOpen size={140} className="w-24 h-24 sm:w-36 sm:h-36" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl sm:text-3xl font-black text-white leading-none">New Flipbook</DialogTitle>
            <DialogDescription className="text-white/80 font-medium mt-3 text-sm sm:text-base max-w-lg">
              Add a new book to the library via Heyzine link or PDF upload.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white overflow-x-hidden">

            <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Book Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g. Monthly Gazette"
                      className="h-11 sm:h-12 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="ageGroup" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Target Age Group</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={pending}
                      className="flex h-11 sm:h-12 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm sm:text-base font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87154] disabled:cursor-not-allowed disabled:opacity-50 border-none shadow-inner"
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
                <FormControl>
                  <Textarea
                    className="min-h-[100px] bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4"
                    placeholder="Summarize the content..."
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Tabs value={tab} onValueChange={(v) => setTab(v as "heyzine" | "pdf")}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="heyzine"><Globe className="h-4 w-4 mr-2" /> Heyzine</TabsTrigger>
                <TabsTrigger value="pdf"><HardDrive className="h-4 w-4 mr-2" /> PDF Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="heyzine" className="space-y-6 pt-4">
                <FormField control={form.control} name="heyzineUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Heyzine URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://heyzine.com/flip-book/…"
                        className="h-11 sm:h-12 bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner px-4"
                        disabled={pending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="iframeContent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Or paste iframe HTML</FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4"
                        rows={4}
                        disabled={pending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="pdf" className="space-y-3 pt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 block mb-2">PDF Source</label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => acceptDroppedFile(e.target.files?.[0])}
                  disabled={pending}
                />

                {pdfFile ? (
                  <div className="flex items-center gap-4 p-4 sm:p-5 bg-slate-50 rounded-2xl border-2 border-emerald-200 shadow-inner">
                    <div className="h-12 w-12 flex-none rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{pdfFile.name}</p>
                      <p className="text-[11px] text-slate-500 font-bold">
                        {(pdfFile.size / 1024 / 1024).toFixed(1)} MB · Ready to upload
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pending}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#E87154]"
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPdfFile(null)}
                        disabled={pending}
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      acceptDroppedFile(e.dataTransfer.files?.[0]);
                    }}
                    disabled={pending}
                    className={`w-full flex flex-col items-center justify-center gap-3 p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all shadow-inner ${
                      dragActive
                        ? "bg-[#E87154]/10 border-[#E87154]"
                        : "bg-slate-50 border-slate-200 hover:border-[#E87154]/60 hover:bg-[#E87154]/5"
                    } ${pending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                      dragActive ? "bg-[#E87154] text-white" : "bg-white text-[#E87154] shadow-sm"
                    }`}>
                      <UploadCloud size={26} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-900">
                        {dragActive ? "Drop the PDF here" : "Drag a PDF here, or click to pick one"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Max 50 MB · Server compresses + renders pages in 10–60s
                      </p>
                    </div>
                  </button>
                )}
              </TabsContent>
            </Tabs>

            <FormField control={form.control} name="isFree" render={({ field }) => (
              <FormItem className="flex items-center space-x-4 p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[2rem] border-none shadow-inner">
                <FormControl>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={pending}
                      className="h-6 w-6 rounded-lg border-slate-300 text-[#E87154] focus:ring-[#E87154] transition-all cursor-pointer"
                    />
                  </div>
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-base sm:text-lg font-black text-slate-900 cursor-pointer select-none leading-none">Global Free Access</FormLabel>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">If checked, this book bypasses all subscription requirements and is available to all users.</p>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {stage.kind !== "idle" && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <UploadProgress stage={stage} />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={pending}
                className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base"
              >
                <Save className="mr-3 h-6 w-6" />
                {pending ? "Working…" : "Create Flipbook"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
