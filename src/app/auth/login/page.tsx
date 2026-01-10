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
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { Role } from "@/lib/types";
import { checkLoginStatus, resendEmailVerification } from "@/app/actions/auth";

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
    // Show verification success message
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully! You can now log in.");
    }
    // Show verification error message
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
      // First check the login status to get specific error
      const statusCheck = await checkLoginStatus(values.email, values.password);
      
      if (statusCheck.error) {
        switch (statusCheck.error) {
          case "EMAIL_NOT_VERIFIED":
            setUnverifiedEmail(values.email);
            setShowVerificationPrompt(true);
            toast.error("Please verify your email address before logging in.", {
              duration: 5000,
            });
            setIsLoading(false);
            return;
            
          case "ACCOUNT_LOCKED":
            const lockedUntil = new Date(statusCheck.lockedUntil!);
            toast.error(`Account locked due to too many failed attempts. Try again after ${lockedUntil.toLocaleTimeString()}`);
            setIsLoading(false);
            return;
            
          case "ACCOUNT_SUSPENDED":
            toast.error(`Your account has been ${statusCheck.status?.toLowerCase()}. Please contact support.`);
            setIsLoading(false);
            return;
            
          case "INVALID_CREDENTIALS":
            toast.error("Invalid email or password. Please try again.");
            setIsLoading(false);
            return;
            
          default:
            toast.error("An error occurred. Please try again.");
            setIsLoading(false);
            return;
        }
      }
      
      // If all checks pass, proceed with sign in
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        // Get session to determine redirect path
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();
        
        toast.success("Logged in successfully");
        
        // Direct redirect based on role
        if (sessionData?.user?.role) {
          switch (sessionData.user.role) {
            case Role.ADMIN:
              router.push("/admin");
              break;
            case Role.MANAGER:
              router.push("/manager");
              break;
            case Role.AFFILIATE:
              router.push("/affiliate");
              break;
            case Role.CUSTOMER:
              router.push("/customer");
              break;
            default:
              router.push("/");
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
    <div className="flex justify-center items-center p-4 w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email verification prompt */}
              {showVerificationPrompt && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Email Not Verified
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Please verify your email address to continue. Check your inbox for the verification link.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="w-full"
                  >
                    {isResendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
            <p className="text-sm">Don't have an account? <Link href="/auth/register" className="underline">Sign up</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center p-4 w-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
