"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateUser } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Role } from "@/lib/types"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/file-upload";
import { UserCog, Save, ShieldCheck } from "lucide-react";

const editUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(10, "Phone number is required"), 
  role: z.string(), 
  status: z.string(),
  ambassadorId: z.string().optional().nullable(),
  ambassadorExpiry: z.string().optional().nullable(),
  profilePictureUrl: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  teamLeaderId: z.string().optional().nullable(),
  referredById: z.string().optional().nullable(),
});

interface EditUserDialogProps {
    user: any; 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    managers?: { id: string, name: string }[];
    teamLeaders?: { id: string, name: string }[];
    operationsManagers?: { id: string, name: string }[];
    ambassadors?: { id: string, name: string, ambassadorId: string | null }[];
}

export function EditUserDialog({ user, open, onOpenChange, managers = [], teamLeaders = [], operationsManagers = [], ambassadors = [] }: EditUserDialogProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      status: user.status,
      ambassadorId: user.ambassadorId || "",
      ambassadorExpiry: user.ambassadorExpiry ? new Date(user.ambassadorExpiry).toISOString().split('T')[0] : "",
      profilePictureUrl: user.profilePictureUrl || "",
      managerId: user.managerId || "none",
      teamLeaderId: user.teamLeaderId || "none",
      referredById: user.referredById || "none",
    },
  });

  // Reset form when user or open state changes
  useEffect(() => {
    if (open) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role,
        status: user.status,
        ambassadorId: user.ambassadorId || "",
        ambassadorExpiry: user.ambassadorExpiry ? new Date(user.ambassadorExpiry).toISOString().split('T')[0] : "",
        profilePictureUrl: user.profilePictureUrl || "",
        managerId: user.managerId || "none",
        teamLeaderId: user.teamLeaderId || "none",
        referredById: user.referredById || "none",
      });
    }
  }, [user, open, form]);

  async function onSubmit(values: z.infer<typeof editUserSchema>) {
    const formattedValues = {
      ...values,
      ambassadorExpiry: values.ambassadorExpiry ? new Date(values.ambassadorExpiry) : null,
      managerId: values.managerId === "none" ? null : values.managerId,
      teamLeaderId: values.teamLeaderId === "none" ? null : values.teamLeaderId,
      referredById: values.referredById === "none" ? null : values.referredById,
    };
    const result = await updateUser(user.id, formattedValues as any);
    if (result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("User updated successfully!");
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2rem]">
        <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                <UserCog className="w-24 h-24 sm:w-36 sm:h-36 text-stone-900" />
            </div>
            <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">Personal Info</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-3 text-sm sm:text-base">
                    Update their account details and roles.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 overflow-x-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">First Name</FormLabel>
                    <FormControl><Input placeholder="John" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</FormLabel>
                  <FormControl><Input placeholder="john@example.com" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">WhatsApp Number</FormLabel>
                  <FormControl>
                    <PhoneInputComponent
                      placeholder="Enter WhatsApp number"
                      value={field.value}
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">System Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value={Role.CUSTOMER} className="font-bold py-2 sm:py-3 rounded-xl">Customer Account</SelectItem>
                        <SelectItem value={Role.PARENT} className="font-bold py-2 sm:py-3 rounded-xl">Parent Account</SelectItem>
                        <SelectItem value={Role.AFFILIATE} className="font-bold py-2 sm:py-3 rounded-xl">Affiliate Staff</SelectItem>
                        <SelectItem value={Role.TEAM_LEADER} className="font-bold py-2 sm:py-3 rounded-xl text-[#E87154]">Team Leader</SelectItem>
                        <SelectItem value={Role.MANAGER} className="font-bold py-2 sm:py-3 rounded-xl text-blue-600">Platform Manager</SelectItem>
                        <SelectItem value={Role.OPERATIONS_MANAGER} className="font-bold py-2 sm:py-3 rounded-xl text-purple-600">Operations Lead</SelectItem>
                        <SelectItem value={Role.ADMIN} className="font-bold py-2 sm:py-3 rounded-xl text-indigo-600">Administrator</SelectItem>
                        <SelectItem value={Role.FINANCE} className="font-bold py-2 sm:py-3 rounded-xl text-emerald-600">Finance Control</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />

                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Account Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="ACTIVE" className="font-bold py-2 sm:py-3 rounded-xl text-emerald-600">Active</SelectItem>
                        <SelectItem value="SUSPENDED" className="font-bold py-2 sm:py-3 rounded-xl text-amber-600">Suspended</SelectItem>
                        <SelectItem value="BANNED" className="font-bold py-2 sm:py-3 rounded-xl text-red-600">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />
              </div>

              {/* Linked Ambassador field for CUSTOMER and PARENT roles */}
              {["CUSTOMER", "PARENT"].includes(form.watch("role")) && (
                <FormField control={form.control} name="referredById" render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-300">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Linked Ambassador / Affiliate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                            <SelectValue placeholder="Select Ambassador" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="none" className="italic opacity-70 py-2 sm:py-3 rounded-xl">No Ambassador (Organic)</SelectItem>
                        {ambassadors.map(amb => (
                            <SelectItem key={amb.id} value={amb.id} className="font-bold py-2 sm:py-3 rounded-xl">
                            {amb.name} {amb.ambassadorId ? `(${amb.ambassadorId})` : ""}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px] font-bold text-slate-400 ml-1">
                        Assign this customer to an ambassador to track their referrals and commissions.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )} />
              )}

              {[Role.MANAGER, Role.AFFILIATE, Role.TEAM_LEADER, Role.OPERATIONS_MANAGER].includes(form.watch("role") as Role) && (
                <div className="space-y-6 border-t pt-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-center pb-4">
                    <FileUpload 
                      label="Ambassador Photo" 
                      name="profilePictureUrl" 
                      accept="image/*"
                      defaultValue={form.watch("profilePictureUrl") || ""}
                      onUpload={(url) => form.setValue("profilePictureUrl", url)}
                      variant="avatar"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Ambassador ID</FormLabel>
                        <Input value={user.ambassadorId || ""} placeholder="Auto-generated" disabled className="h-11 sm:h-12 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl font-black cursor-not-allowed opacity-70 px-4" />
                        <FormDescription className="text-[10px] font-bold text-slate-400 ml-1">System Managed</FormDescription>
                    </FormItem>
                    <FormField control={form.control} name="ambassadorExpiry" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Expiry Date</FormLabel>
                        <FormControl><Input type="date" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Role-based Hierarchy Assignments */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Manager Role -> Assigned Operations Manager */}
                    {form.watch("role") === Role.MANAGER && (
                      <FormField control={form.control} name="managerId" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2 duration-300">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assigned Operations Manager</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                                <SelectValue placeholder="Select Operations Manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                              <SelectItem value="none" className="italic opacity-70 py-2 sm:py-3 rounded-xl">No Operations Manager</SelectItem>
                              {operationsManagers.map(m => (
                                <SelectItem key={m.id} value={m.id} className="font-bold py-2 sm:py-3 rounded-xl">{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Team Leader Role -> Assigned Manager */}
                    {form.watch("role") === Role.TEAM_LEADER && (
                      <FormField control={form.control} name="managerId" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2 duration-300">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assigned Manager</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                                <SelectValue placeholder="Select Manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                              <SelectItem value="none" className="italic opacity-70 py-2 sm:py-3 rounded-xl">No Manager</SelectItem>
                              {managers.map(m => (
                                <SelectItem key={m.id} value={m.id} className="font-bold py-2 sm:py-3 rounded-xl">{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Affiliate Role -> Assigned Manager & Team Leader */}
                    {form.watch("role") === Role.AFFILIATE && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-in slide-in-from-top-2 duration-300">
                        <FormField control={form.control} name="managerId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assigned Manager</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                                  <SelectValue placeholder="Select Manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                <SelectItem value="none" className="italic opacity-70 py-2 sm:py-3 rounded-xl">No Manager</SelectItem>
                                {managers.map(m => (
                                  <SelectItem key={m.id} value={m.id} className="font-bold py-2 sm:py-3 rounded-xl">{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="teamLeaderId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Team Leader</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
                                  <SelectValue placeholder="Select Team Leader" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                <SelectItem value="none" className="italic opacity-70 py-2 sm:py-3 rounded-xl">No Team Leader</SelectItem>
                                {teamLeaders.map(tl => (
                                  <SelectItem key={tl.id} value={tl.id} className="font-bold py-2 sm:py-3 rounded-xl">{tl.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 sm:pt-6">
                 <Button type="submit" className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-sm sm:text-base">
                    <Save className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Save Changes
                 </Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
