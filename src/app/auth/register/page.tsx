"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { Role } from "@/lib/types";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  managerCode: z.string().optional(),
  referralCode: z.string().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: Role.CUSTOMER,
      managerCode: "",
      referralCode: "",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    const result = await registerUser(values);
    if (result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Registration successful! Please login.");
      // Redirect handled by server action or here
      router.push("/auth/login");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
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
                  <FormControl><Input placeholder="+1234567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

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
                      {/* Admin registration usually hidden or seeded */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {selectedRole === Role.AFFILIATE && (
                <FormField control={form.control} name="managerCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Invite Code</FormLabel>
                    <FormControl><Input placeholder="Enter code" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {selectedRole === Role.CUSTOMER && (
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl><Input placeholder="Enter code" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <Button type="submit" className="w-full">Sign Up</Button>
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
