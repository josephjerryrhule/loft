"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Role } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";

import { PhoneInputComponent } from "@/components/ui/phone-input";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number is required"),
  role: z.nativeEnum(Role),
  managerCode: z.string().optional(),
  referralCode: z.string().optional(),
});

export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: Role.PARENT,
      managerCode: "",
      referralCode: "",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    const result = await registerUser({ ...values, isAdminCreated: true });
    if (result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("User created successfully! They will need to reset their password on first login.");
      setOpen(false);
      form.reset();
      router.refresh(); 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2 h-11 px-6 rounded-xl font-bold">
            <Plus size={18} /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2rem]">
        <div className="bg-[#E87154] p-6 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 rotate-12">
                <Plus className="w-24 h-24 sm:w-36 sm:h-36" />
            </div>
            <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl sm:text-3xl font-black text-white leading-none">Create New User</DialogTitle>
                <DialogDescription className="text-white/80 font-medium mt-3 text-sm sm:text-base">
                    Create a new account and set their roles.
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

              <FormField control={form.control} name="phone" render={({ field }) => (
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
              
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Initial Password</FormLabel>
                  <FormControl><Input type="password" placeholder="******" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 gap-6 pt-2">
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">System Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-black focus:ring-[#E87154] shadow-inner px-4 text-sm sm:text-base">
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

                {selectedRole === Role.AFFILIATE && (
                    <FormField control={form.control} name="managerCode" render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-200">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Manager Invite Code</FormLabel>
                        <FormControl><Input placeholder="Optional for admin-created" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                )}

                {(selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && (
                    <FormField control={form.control} name="referralCode" render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-200">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Referral Code</FormLabel>
                        <FormControl><Input placeholder="Optional" className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                )}
              </div>

              <div className="flex justify-end pt-4 sm:pt-6">
                 <Button type="submit" className="w-full h-12 sm:h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-sm sm:text-base">
                    <ShieldCheck className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Create User Account
                 </Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
