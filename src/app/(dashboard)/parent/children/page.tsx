"use client";

import { useEffect, useState } from "react";
import {
  getChildProfiles,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
  type ChildProfileInput,
} from "@/app/actions/children";
import { parentLoginAsChild } from "@/app/actions/child-auth";
import { getAgeGroupLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Baby, BookOpen, Star, Sparkles, ChevronRight, Calendar, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
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
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "#E87154", "#3b82f6", "#10b981", "#8b5cf6",
  "#f59e0b", "#ec4899", "#14b8a6", "#6366f1",
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  ageGroup: z.enum(["LITTLE_LOFTERS", "LOFT_365", "BIG_READERS"]),
  avatarColor: z.string().optional(),
});

function ChildAvatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
  };

  return (
    <div
      className={cn(
        "rounded-[2rem] flex items-center justify-center text-white font-black shadow-lg shadow-black/5 shrink-0 transition-transform duration-500",
        sizeClasses[size]
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function ChildFormDialog({
  open,
  onOpenChange,
  child,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  child?: any;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(child?.avatarColor || AVATAR_COLORS[0]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: child?.name || "",
      username: child?.username || "",
      dateOfBirth: child?.dateOfBirth
        ? new Date(child.dateOfBirth).toISOString().split("T")[0]
        : "",
      ageGroup: child?.ageGroup || "LOFT_365",
      avatarColor: child?.avatarColor || AVATAR_COLORS[0],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: child?.name || "",
        username: child?.username || "",
        dateOfBirth: child?.dateOfBirth
          ? new Date(child.dateOfBirth).toISOString().split("T")[0]
          : "",
        ageGroup: child?.ageGroup || "LOFT_365",
        avatarColor: child?.avatarColor || AVATAR_COLORS[0],
      });
      setSelectedColor(child?.avatarColor || AVATAR_COLORS[0]);
    }
  }, [open, child]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    try {
      const payload: ChildProfileInput = { ...values, avatarColor: selectedColor };
      const result = child
        ? await updateChildProfile(child.id, payload)
        : await createChildProfile(payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(child ? "Profile updated!" : "New profile ready!");
        onOpenChange(false);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[40rem] p-0 border-none shadow-2xl rounded-[2.5rem] overflow-y-auto max-h-[95vh]">
        <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                <Baby size={140} className="w-24 h-24 sm:w-36 sm:h-36" />
            </div>
            <DialogHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <User size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Profile Details</span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                    {child ? "Edit Profile" : "Add a New Member"}
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-3 text-sm sm:text-base italic">
                    {child ? "Keep your child's information up to date." : "Create a separate space for your child to explore magical stories."}
                </DialogDescription>
            </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Ama" className="h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-bold focus-visible:ring-[#E87154] shadow-sm px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Login Username</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. ama_lofter" className="h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-bold focus-visible:ring-[#E87154] shadow-sm px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Birth Date</FormLabel>
                    <FormControl>
                        <Input type="date" className="h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-bold focus-visible:ring-[#E87154] shadow-sm px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="ageGroup"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Age Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-black focus:ring-[#E87154] shadow-sm px-4">
                            <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="LITTLE_LOFTERS" className="font-bold py-3 rounded-xl">{getAgeGroupLabel("LITTLE_LOFTERS")}</SelectItem>
                        <SelectItem value="LOFT_365" className="font-bold py-3 rounded-xl">{getAgeGroupLabel("LOFT_365")}</SelectItem>
                        <SelectItem value="BIG_READERS" className="font-bold py-3 rounded-xl">{getAgeGroupLabel("BIG_READERS")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-4">
              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Favorite Color</FormLabel>
              <div className="flex gap-2 sm:gap-3 flex-wrap p-4 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-4 transition-all hover:scale-110",
                        selectedColor === color ? "border-white shadow-md scale-110" : "border-transparent opacity-60"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <Button variant="ghost" type="button" className="flex-1 h-12 sm:h-14 rounded-2xl text-stone-400 font-bold hover:text-slate-900 hover:bg-stone-50 transition-all text-base" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-[2] h-12 sm:h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base gap-3">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    {child ? "Update Profile" : "Create Profile"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChild, setEditChild] = useState<any>(null);
  const [deleteChild, setDeleteChildState] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);
  const router = useRouter();

  async function loadChildren() {
    setLoading(true);
    try {
      const data = await getChildProfiles();
      setChildren(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChildren();
  }, []);

  async function handleDelete() {
    if (!deleteChild) return;
    setDeleting(true);
    try {
      const result = await deleteChildProfile(deleteChild.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile removed");
        setDeleteChildState(null);
        loadChildren();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleLoginAsChild(childId: string) {
    setLoggingInAs(childId);
    try {
      const result = await parentLoginAsChild(childId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome back! Entering portal...");
        router.push("/child");
      }
    } catch (error) {
      toast.error("Access denied");
    } finally {
      setLoggingInAs(null);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Family Members"
        subtitle="Manage profiles and reading adventures for everyone in your household."
        actions={
            <Button
                className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2 sm:gap-3 h-11 sm:h-12 px-5 sm:px-8 rounded-2xl font-black text-white transition-all active:scale-95 text-xs sm:text-sm"
                onClick={() => {
                    setEditChild(null);
                    setDialogOpen(true);
                }}
            >
                <Plus size={18} /> Add Member
            </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
          <p className="text-xs font-black text-stone-300 uppercase tracking-[0.3em]">Synchronizing Profiles</p>
        </div>
      ) : children.length === 0 ? (
        <Card className="border-2 border-dashed border-stone-200 bg-stone-50/30 rounded-[2.5rem] sm:rounded-[3rem]">
          <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] bg-white shadow-sm flex items-center justify-center border border-stone-100">
              <Baby className="h-8 w-8 sm:h-10 sm:w-10 text-stone-300" />
            </div>
            <div className="text-center space-y-2 px-6">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Your family list is empty</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm sm:text-base">
                Add a profile for each child so they can have their own personalized bookshelf and reading progress.
              </p>
            </div>
            <Button
              className="bg-[#E87154] hover:bg-[#D66144] shadow-xl shadow-[#E87154]/20 h-12 sm:h-14 px-6 sm:px-10 rounded-2xl font-black text-white group transition-all text-sm sm:text-base"
              onClick={() => {
                setEditChild(null);
                setDialogOpen(true);
              }}
            >
              Add Your First Child <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const hasSub = child.subscriptions?.length > 0;
            return (
                <Card key={child.id} className="border-none shadow-md hover:shadow-xl transition-all duration-500 rounded-[2rem] sm:rounded-[2.5rem] bg-white overflow-hidden group">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <ChildAvatar name={child.name} color={child.avatarColor || "#E87154"} />
                        <div className="flex flex-col items-end gap-2">
                            {hasSub ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 h-6 text-[10px] font-black uppercase tracking-widest">Premium</Badge>
                            ) : (
                                <Badge variant="outline" className="border-stone-100 text-stone-400 px-3 h-6 text-[10px] font-black uppercase tracking-widest">Free Basic</Badge>
                            )}
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl bg-slate-100 sm:bg-transparent hover:bg-slate-200 text-slate-600 sm:text-stone-400 hover:text-slate-900 shadow-sm sm:shadow-none"
                                    onClick={() => {
                                        setEditChild(child);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl bg-red-50 sm:bg-transparent hover:bg-red-100 text-red-500 sm:text-stone-300 hover:text-red-600 shadow-sm sm:shadow-none"
                                    onClick={() => setDeleteChildState(child)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 mb-6 sm:mb-8">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{child.name}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-stone-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                            <span>{getAgeGroupLabel(child.ageGroup)}</span>
                            {child.dateOfBirth && (
                                <>
                                    <div className="h-1 w-1 rounded-full bg-stone-200" />
                                    <span>{new Date(child.dateOfBirth).getFullYear()}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 pt-6 border-t border-stone-50">
                        <Button 
                            className="w-full h-12 sm:h-14 bg-stone-900 hover:bg-black text-white rounded-2xl font-black text-sm sm:text-base shadow-lg transition-all active:scale-95 gap-3"
                            onClick={() => handleLoginAsChild(child.id)}
                            disabled={loggingInAs === child.id}
                        >
                            {loggingInAs === child.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <BookOpen className="h-5 w-5" />
                            )}
                            Open Library
                        </Button>
                        
                        {!hasSub && (
                            <Button asChild variant="outline" className="w-full h-12 sm:h-14 border-stone-100 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 rounded-2xl font-black text-sm sm:text-base transition-all group">
                                <Link href={`/parent/plans?childId=${child.id}`}>
                                    Upgrade to Premium <Sparkles size={16} className="ml-2 text-amber-400" />
                                </Link>
                            </Button>
                        )}
                    </div>
                  </div>
                </Card>
            );
          })}

          {/* Quick Add Placeholder */}
          <button 
            className="border-4 border-dashed border-stone-100 hover:border-[#E87154]/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center justify-center gap-4 transition-all group min-h-[280px] sm:min-h-[320px]"
            onClick={() => {
                setEditChild(null);
                setDialogOpen(true);
            }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-stone-50 group-hover:bg-[#E87154]/10 flex items-center justify-center text-stone-300 group-hover:text-[#E87154] transition-all">
                <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="font-black text-stone-300 group-hover:text-slate-900 uppercase tracking-widest text-[10px] sm:text-xs transition-colors">Add Member</span>
          </button>
        </div>
      )}

      <ChildFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        child={editChild}
        onSaved={loadChildren}
      />

      <AlertDialog open={!!deleteChild} onOpenChange={(v) => !v && setDeleteChildState(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-6 sm:p-10 w-[95vw] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-900">Remove Profile?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-sm sm:text-base mt-2">
              This will permanently delete <strong>{deleteChild?.name}</strong>'s library profile and all
              their magical reading progress. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 sm:mt-8 gap-3 sm:gap-4 flex flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="h-11 sm:h-12 rounded-xl font-bold border-stone-100 hover:bg-stone-50 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="h-11 sm:h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-600/20 px-8 w-full sm:w-auto"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Remove Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

