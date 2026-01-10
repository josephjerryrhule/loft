"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Role } from "@/lib/types";
import { Suspense, useState } from "react";
import { registrationSchema } from "@/lib/validations";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const roleFromQuery = searchParams.get("role") as Role || Role.CUSTOMER;
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
      referralCode: roleFromQuery === Role.CUSTOMER ? ref : "",
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
    <div className="flex justify-center items-center p-4 w-full">
      <Card className="w-full max-w-lg my-8">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="John" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="john@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <PhoneInput
                      placeholder="Enter phone number"
                      defaultCountry="GH"
                      value={field.value}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      numberInputProps={{
                          className: "border-0 bg-transparent focus:ring-0 outline-none w-full ml-2"
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><PasswordInput placeholder="******" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {!ref && (
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Role.CUSTOMER}>Customer</SelectItem>
                        <SelectItem value={Role.AFFILIATE}>Affiliate</SelectItem>
                        <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {selectedRole === Role.AFFILIATE && (
                <FormField control={form.control} name="managerCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Invite Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter code" 
                        {...field} 
                        disabled={!!ref && roleFromQuery === Role.AFFILIATE} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {selectedRole === Role.CUSTOMER && (
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code {ref ? "" : "(Optional)"}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter code" 
                        {...field} 
                        disabled={!!ref && roleFromQuery === Role.CUSTOMER}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
            <p className="text-sm">Already have an account? <Link href="/auth/login" className="underline">Sign in</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
