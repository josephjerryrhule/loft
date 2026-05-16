"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { resetPassword, validateResetToken } from "@/app/actions/auth";
import { ArrowLeft, Lock, CheckCircle2, XCircle, Loader2, ShieldCheck, Save, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const resetFormSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidating(false);
        setErrorMessage("No reset token provided");
        return;
      }

      const result = await validateResetToken(token);
      setIsValidating(false);
      if (result.valid) {
        setIsValid(true);
      } else {
        setErrorMessage(result.error || "Invalid or expired token");
      }
    }

    checkToken();
  }, [token]);

  async function onSubmit(values: z.infer<typeof resetFormSchema>) {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const result = await resetPassword(token, values.password);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsSubmitted(true);
        toast.success("Security keys updated!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidating) {
    return (
        <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#E87154]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Verifying Link</p>
            </div>
        </Card>
    );
  }

  if (!isValid && !isSubmitted) {
    return (
        <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
            <div className="p-10 pb-0">
                <CardHeader className="p-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-6 w-6 rounded-lg bg-red-50 flex items-center justify-center">
                            <XCircle size={12} className="text-red-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Access Denied</span>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Invalid Link</CardTitle>
                    <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                        {errorMessage || "This password reset link is invalid or has expired."}
                    </CardDescription>
                </CardHeader>
            </div>

            <CardContent className="p-10 space-y-6 text-center sm:text-left">
                <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                    <p className="text-sm text-stone-600 font-medium leading-relaxed italic">
                        For your protection, reset links expire after <span className="font-bold text-stone-900">1 hour</span>.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <Button asChild className="h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white">
                        <Link href="/auth/forgot-password">Request New Link</Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-12 rounded-xl font-bold text-stone-400 hover:text-stone-900 transition-all gap-2">
                        <Link href="/auth/login">
                            <ArrowLeft size={18} />
                            Back to Sign In
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  if (isSubmitted) {
    return (
        <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
            <div className="p-10 pb-0">
                <CardHeader className="p-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                        <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <ShieldCheck size={12} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Security Updated</span>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Success!</CardTitle>
                    <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                        Your password has been updated successfully.
                    </CardDescription>
                </CardHeader>
            </div>

            <CardContent className="p-10">
                <Button className="w-full h-12 rounded-xl bg-stone-900 hover:bg-black font-bold shadow-sm transition-all active:scale-95 text-white group text-base" onClick={() => router.push("/auth/login")}>
                    Log In Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
      <div className="p-10 pb-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-[#E87154]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Security Update</span>
            </div>
            <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Set New Password</CardTitle>
            <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                Create a strong, unique password to protect your account.
            </CardDescription>
          </CardHeader>
      </div>

      <CardContent className="p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Verify Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2">
                <Button type="submit" className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white text-base group" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                    {isLoading ? "Updating..." : "Update Password"}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </Button>

                <Button asChild variant="ghost" className="w-full h-12 rounded-xl font-bold text-stone-400 hover:text-stone-900 transition-all gap-2">
                    <Link href="/auth/login">
                        <ArrowLeft size={18} />
                        Back to Sign In
                    </Link>
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
        <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
            </div>
        </Card>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
