"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";
import { Role } from "@/lib/types";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 

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

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const referralCode = searchParams.get("ref") || "";

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
        referralCode: referralCode,
        },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        const result = await registerUser(values);
        if (result && result.error) {
        toast.error(result.error);
        } else {
        toast.success("Account created successfully!");
        router.push("/auth/login");
        }
    }

    return (
        <Card className="w-full max-w-lg my-8">
            <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your customer account to start shopping.</CardDescription>
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
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormControl><Input type="password" placeholder="******" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />

                <input type="hidden" {...form.register("role")} value={Role.CUSTOMER} />
                {referralCode && <input type="hidden" {...form.register("referralCode")} value={referralCode} />}

                <Button type="submit" className="w-full">Create Account</Button>
                </form>
            </Form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm">Already have an account? <Link href="/auth/login" className="underline">Sign in</Link></p>
            </CardFooter>
        </Card>
    )
}

export default function SignupPage() {
  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-slate-50">
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    </div>
  );
}
