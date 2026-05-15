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
import { Role, UserStatus } from "@/lib/types"; // Ensure these match schema strings
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
});

interface EditUserDialogProps {
    user: any; 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    managers?: { id: string, name: string }[];
    teamLeaders?: { id: string, name: string }[];
    operationsManagers?: { id: string, name: string }[];
}

export function EditUserDialog({ user, open, onOpenChange, managers = [], teamLeaders = [], operationsManagers = [] }: EditUserDialogProps) {
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
      });
    }
  }, [user, open, form]);

  async function onSubmit(values: z.infer<typeof editUserSchema>) {
    const formattedValues = {
      ...values,
      ambassadorExpiry: values.ambassadorExpiry ? new Date(values.ambassadorExpiry) : null,
      managerId: values.managerId === "none" ? null : values.managerId,
      teamLeaderId: values.teamLeaderId === "none" ? null : values.teamLeaderId,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value={Role.CUSTOMER}>Customer</SelectItem>
                        <SelectItem value={Role.PARENT}>Parent</SelectItem>
                        <SelectItem value={Role.AFFILIATE}>Affiliate</SelectItem>
                        <SelectItem value={Role.TEAM_LEADER}>Team Leader</SelectItem>
                        <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                        <SelectItem value={Role.OPERATIONS_MANAGER}>Operations Manager</SelectItem>
                        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                        <SelectItem value={Role.FINANCE}>Finance</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />

                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="BANNED">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )} />
              </div>

              {[Role.MANAGER, Role.AFFILIATE, Role.TEAM_LEADER, Role.OPERATIONS_MANAGER].includes(form.watch("role") as Role) && (
                <div className="space-y-4 border-t pt-4 mt-2">
                  <div className="flex justify-center pb-2">
                    <FileUpload 
                      label="Ambassador Photo" 
                      name="profilePictureUrl" 
                      accept="image/*"
                      defaultValue={form.watch("profilePictureUrl") || ""}
                      onUpload={(url) => form.setValue("profilePictureUrl", url)}
                      variant="avatar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ambassadorId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ambassador ID</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} placeholder="Auto-generated" disabled className="bg-slate-50 cursor-not-allowed" /></FormControl>
                        <FormDescription className="text-[10px]">Managed by system</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ambassadorExpiry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ambassador Expiry</FormLabel>
                        <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Role-based Hierarchy Assignments */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Manager Role -> Assigned Operations Manager */}
                    {form.watch("role") === Role.MANAGER && (
                      <FormField control={form.control} name="managerId" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Assigned Operations Manager</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Operations Manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Operations Manager</SelectItem>
                              {operationsManagers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
                        <FormItem className="col-span-2">
                          <FormLabel>Assigned Manager</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Manager</SelectItem>
                              {managers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Affiliate Role -> Assigned Manager & Team Leader */}
                    {form.watch("role") === Role.AFFILIATE && (
                      <>
                        <FormField control={form.control} name="managerId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Manager</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Manager</SelectItem>
                                {managers.map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="teamLeaderId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Team Leader</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Team Leader" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Team Leader</SelectItem>
                                {teamLeaders.map(tl => (
                                  <SelectItem key={tl.id} value={tl.id}>{tl.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                 <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
