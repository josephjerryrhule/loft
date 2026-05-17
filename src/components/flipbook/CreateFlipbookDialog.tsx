"use client";

import { useState, useTransition } from "react";
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
import { Plus, Globe, HardDrive, BookOpen, Save } from "lucide-react";
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
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 block mb-2">PDF File</label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="h-11 sm:h-12 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    disabled={pending}
                  />
                </div>
                {pdfFile && (
                  <p className="text-xs text-slate-500 ml-1">
                    {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
                <p className="text-[11px] text-slate-400 ml-1">Max 50 MB. The server will compress + render pages — this may take 10-60 seconds.</p>
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
