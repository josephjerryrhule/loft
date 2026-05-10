"use client";

import { useEffect, useState } from "react";
import {
  getChildProfiles,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
  type ChildProfileInput,
} from "@/app/actions/children";
import { getAgeGroupLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, Plus, Pencil, Trash2, Baby } from "lucide-react";
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
import { BookOpenCheck } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#22c55e", "#14b8a6", "#3b82f6", "#f59e0b",
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  ageGroup: z.enum(["LITTLE_LOFTERS", "LOFT_365", "BIG_READERS"]),
  avatarColor: z.string().optional(),
});

function ChildAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
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
        toast.success(child ? "Child profile updated!" : "Child profile created!");
        onOpenChange(false);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{child ? "Edit Child Profile" : "Add a Child"}</DialogTitle>
          <DialogDescription>
            {child
              ? "Update your child's profile details."
              : "Create a profile for your child to manage their subscriptions and reading."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ama" {...field} />
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
                  <FormLabel>Login Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ama_reader" {...field} />
                  </FormControl>
                  <p className="text-[0.8rem] text-muted-foreground mt-1">This will be used for the child to log in without an email.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Age Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LITTLE_LOFTERS">Little Lofters (0-3 years)</SelectItem>
                      <SelectItem value="LOFT_365">Loft 365 Readers (4-7 years)</SelectItem>
                      <SelectItem value="BIG_READERS">Big Readers (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Avatar Color</FormLabel>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      selectedColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {child ? "Save Changes" : "Add Child"}
              </Button>
            </div>
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
        toast.success("Child profile deleted");
        setDeleteChildState(null);
        loadChildren();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground mt-1">
            Manage your children's profiles and their reading access.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditChild(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Child
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : children.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Baby className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No children added yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add a child profile to manage their subscriptions and reading progress.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditChild(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card key={child.id} className="relative group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <ChildAvatar name={child.name} color={child.avatarColor || "#6366f1"} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{child.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {getAgeGroupLabel(child.ageGroup)}
                  </CardDescription>
                  {child.dateOfBirth && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {child.subscriptions?.length
                      ? `${child.subscriptions[0].plan.name} Active`
                      : "No active subscription"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditChild(child);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteChildState(child)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/parent/flipbooks?childId=${child.id}`} className="w-full">
                    <Button variant="outline" className="w-full h-9 text-sm" size="sm">
                      <BookOpenCheck className="mr-2 h-4 w-4" />
                      Start Reading
                    </Button>
                  </Link>
                  
                  {!child.subscriptions?.length && (
                    <Link href={`/parent/plans?childId=${child.id}`} className="w-full">
                      <Button className="w-full h-9 text-sm" size="sm">
                        Buy Subscription
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChildFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        child={editChild}
        onSaved={loadChildren}
      />

      <AlertDialog open={!!deleteChild} onOpenChange={(v) => !v && setDeleteChildState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteChild?.name}</strong>'s profile and all
              associated reading progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
