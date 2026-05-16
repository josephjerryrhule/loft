"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { checkLoginStatus, resendEmailVerification } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully! You can now log in.");
    }
    if (searchParams.get("error")) {
      const error = searchParams.get("error");
      toast.error(error || "An error occurred during verification");
    }
  }, [searchParams]);

  async function handleResendVerification() {
    setIsResendingVerification(true);
    try {
      const result = await resendEmailVerification(unverifiedEmail);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setShowVerificationPrompt(false);
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setIsResendingVerification(false);
    }
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setShowVerificationPrompt(false);
    
    try {
      const statusCheck = await checkLoginStatus(values.email, values.password);
      
      if (statusCheck.error) {
        switch (statusCheck.error) {
          case "EMAIL_NOT_VERIFIED":
            setUnverifiedEmail(values.email);
            setShowVerificationPrompt(true);
            toast.error("Email not verified.", { duration: 5000 });
            setIsLoading(false);
            return;
          case "ACCOUNT_LOCKED":
            toast.error("Account locked. Please try again later.");
            setIsLoading(false);
            return;
          case "ACCOUNT_SUSPENDED":
            toast.error("Your account has been suspended.");
            setIsLoading(false);
            return;
          default:
            toast.error("Invalid credentials.");
            setIsLoading(false);
            return;
        }
      }
      
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
      } else {
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();
        toast.success("Welcome back!");
        
        if (sessionData?.user?.role) {
          const role = sessionData.user.role;
          switch (role) {
            case "ADMIN": case "OPERATIONS_MANAGER": router.push("/admin"); break;
            case "MANAGER": router.push("/manager"); break;
            case "TEAM_LEADER": case "AFFILIATE": router.push("/affiliate"); break;
            case "PARENT": router.push("/parent"); break;
            case "CUSTOMER": router.push("/customer"); break;
            case "FINANCE": router.push("/finance"); break;
            default: router.push("/");
          }
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full">
      <div className="p-10 pb-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-[#E87154]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Welcome Back</span>
            </div>
            <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Sign In</CardTitle>
            <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                Please enter your details to access your account.
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
                        <Input placeholder="email@example.com" className="pl-12 h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154]" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1 px-1">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Password</FormLabel>
                    <Link href="/auth/forgot-password" university-link="" className="text-[10px] font-bold uppercase tracking-widest text-[#E87154] hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder="******" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showVerificationPrompt && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-4 animate-in zoom-in-95">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">Email Not Verified</p>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
                      Verification is required. Check your inbox for the activation link.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="w-full h-11 rounded-xl font-bold border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                >
                  {isResendingVerification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
            )}
            
            <Button type="submit" className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white text-base group" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="p-10 pt-0 justify-center">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
            New here? <Link href="/auth/register" className="text-[#E87154] font-bold hover:underline ml-1">Create Account</Link>
          </p>
      </CardFooter>
    </Card>
  );
}

import { RefreshCw } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full">
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
        </div>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
