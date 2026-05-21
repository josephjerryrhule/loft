"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, ShieldCheck, ArrowRight, MapPin, Phone, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Role } from "@/lib/types";
import { Suspense, useState } from "react";
import { registrationSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { SORTED_COUNTRIES } from "@/lib/countries";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const roleFromQuery = (searchParams.get("role") as Role) || Role.CUSTOMER;
  const isAffiliateInvite = roleFromQuery === Role.AFFILIATE;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: roleFromQuery,
      managerCode: roleFromQuery === Role.AFFILIATE ? ref : "",
      referralCode: (roleFromQuery === Role.PARENT || roleFromQuery === Role.CUSTOMER || !roleFromQuery) ? ref : "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Ghana",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof registrationSchema>) {
    setIsLoading(true);
    try {
      const result = await registerUser(values);
      if (result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Registration successful! Please login.");
        router.push("/auth/login");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full my-8">
      <div className="p-10 pb-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-[#E87154]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Join Us</span>
            </div>
            <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Create Account</CardTitle>
            <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                Join our community and start your journey today.
            </CardDescription>
          </CardHeader>
      </div>

      <CardContent className="p-8 sm:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-[#E87154]">
                        <UserPlus size={16} />
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">About You</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">First Name</FormLabel>
                        <FormControl><Input placeholder="John" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Last Name</FormLabel>
                        <FormControl><Input placeholder="Doe" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                </div>
                
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Email Address</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input placeholder="john@example.com" className="pl-12 h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154]" {...field} />

                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">WhatsApp Number</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 z-10" />
                            <PhoneInput
                                placeholder="Enter WhatsApp number"
                                defaultCountry="GH"
                                value={field.value}
                                onChange={field.onChange}
                                className="flex h-12 w-full rounded-xl bg-stone-50 border-stone-100 px-3 py-2 pl-12 text-sm font-medium focus-within:ring-2 focus-within:ring-[#E87154] transition-all"
                                numberInputProps={{
                                    className: "border-0 bg-transparent focus:ring-0 outline-none w-full ml-2 h-full"
                                }}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Password</FormLabel>
                    <FormControl><PasswordInput placeholder="******" showStrength className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />

                {!isAffiliateInvite && (
                    <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">I am a...</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-12 bg-stone-50 border-stone-100 rounded-xl font-bold focus:ring-[#E87154] px-4">
                                <SelectValue placeholder="Choose account type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-stone-100 shadow-xl p-2">
                            <SelectItem value={Role.CUSTOMER} className="font-medium py-3 rounded-lg">Customer - I am reading for myself</SelectItem>
                            <SelectItem value={Role.PARENT} className="font-medium py-3 rounded-lg text-[#E87154]">Parent - I am subscribing for my child</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )} />
                )}
            </div>

            {/* Address fields */}
            <div className="space-y-6 border-t border-stone-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-[#E87154]">
                        <MapPin size={16} />
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        {selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER ? "Your Address" : "Address (Optional)"}
                    </h4>
                </div>
                
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Street Address {(selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && "*"}</FormLabel>
                    <FormControl><Input placeholder="123 Main St" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">City {(selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && "*"}</FormLabel>
                      <FormControl><Input placeholder="Accra" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">State/Region {(selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && "*"}</FormLabel>
                      <FormControl><Input placeholder="Greater Accra" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="postalCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Postal Code</FormLabel>
                      <FormControl><Input placeholder="00233" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-4" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "Ghana"}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full bg-stone-50 border-stone-100 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#E87154]/50 focus:border-[#E87154] px-4 flex items-center justify-between text-left">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60 bg-white border border-stone-100 shadow-lg rounded-xl z-[100]">
                          {SORTED_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
            </div>

            {/* Attribution fields */}
            {(selectedRole === Role.AFFILIATE || selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && (
              <div className="space-y-6 border-t border-stone-100 pt-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-[#E87154]">
                        <Sparkles size={16} />
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Referral Info</h4>
                </div>

                {selectedRole === Role.AFFILIATE && (
                  <FormField control={form.control} name="managerCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Manager Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter code" 
                          className="h-12 bg-stone-50 border-stone-100 rounded-xl font-bold text-[#E87154] focus-visible:ring-[#E87154] px-4"
                          {...field} 
                          disabled={!!ref && roleFromQuery === Role.AFFILIATE} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {(selectedRole === Role.PARENT || selectedRole === Role.CUSTOMER) && (
                  <FormField control={form.control} name="referralCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Referral Code {ref ? "" : "(Optional)"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter code" 
                          className="h-12 bg-stone-50 border-stone-100 rounded-xl font-bold text-[#E87154] focus-visible:ring-[#E87154] px-4"
                          {...field} 
                          disabled={!!ref && (roleFromQuery === Role.PARENT || roleFromQuery === Role.CUSTOMER)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white text-base group" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
              {isLoading ? "Creating account..." : "Create Account"}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="p-10 pt-0 justify-center">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest text-center">
            Already have an account? <Link href="/auth/login" className="text-[#E87154] font-bold hover:underline ml-1">Sign In</Link>
          </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full my-8">
              <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
              </div>
            </Card>
        }>
            <RegisterForm />
        </Suspense>
    );
}
