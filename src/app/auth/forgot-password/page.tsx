"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { requestPasswordReset } from "@/app/actions/auth";
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { passwordResetRequestSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof passwordResetRequestSchema>>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof passwordResetRequestSchema>) {
    setIsLoading(true);
    try {
      const result = await requestPasswordReset(values.email);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsSubmitted(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
        <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
            <div className="p-10 pb-0 text-center sm:text-left">
                <CardHeader className="p-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                        <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Mail size={12} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Email Sent</span>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Check Your Inbox</CardTitle>
                    <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                        We've sent recovery instructions to your email address.
                    </CardDescription>
                </CardHeader>
            </div>

            <CardContent className="p-10 space-y-6">
                <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 text-center sm:text-left">
                    <p className="text-sm text-stone-600 font-medium leading-relaxed">
                        The reset link will expire in <span className="font-bold text-stone-900">1 hour</span>. Please check your spam folder if you don't see it.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={() => setIsSubmitted(false)} className="h-12 rounded-xl font-bold border-stone-200 hover:bg-stone-50 transition-all text-stone-600">
                        Try Another Email
                    </Button>
                    <Button asChild variant="ghost" className="h-12 rounded-xl font-bold text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-all gap-2">
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

  return (
    <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
      <div className="p-10 pb-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-[#E87154]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Forgot Password</span>
            </div>
            <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Recover Account</CardTitle>
            <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                Enter your email to receive a password reset link.
            </CardDescription>
          </CardHeader>
      </div>

      <CardContent className="p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <Input placeholder="you@example.com" className="pl-12 h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154]" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
                <Button type="submit" className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white text-base group" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button asChild variant="ghost" className="w-full h-12 rounded-xl font-bold text-stone-400 hover:text-stone-900 transition-all gap-2">
                    <Link href="/auth/login">
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
