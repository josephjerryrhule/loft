"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, ArrowRight, Lock, BookOpen, Rocket, ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { checkLoginStatus, resendEmailVerification } from "@/app/actions/auth";
import { requestChildOtp, verifyChildOtp } from "@/app/actions/child-auth";
import { cn } from "@/lib/utils";

const childUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab handling
  const typeParam = searchParams.get("type");
  const [loginType, setLoginType] = useState<"parent" | "child">(
    typeParam === "child" ? "child" : "parent"
  );

  // Parent form states
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  
  // Child form states
  const [childStep, setChildStep] = useState<"username" | "otp">("username");
  const [childUsername, setChildUsername] = useState("");
  const [isChildLoading, setIsChildLoading] = useState(false);
  const [childOtp, setChildOtp] = useState(["", "", "", "", "", ""]);
  const childOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const parentForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const childForm = useForm<z.infer<typeof childUsernameSchema>>({
    resolver: zodResolver(childUsernameSchema),
    defaultValues: { username: "" },
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

  // Parent submission handler
  async function onParentSubmit(values: z.infer<typeof loginSchema>) {
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

  // Child username OTP request handler
  async function onChildUsernameSubmit(values: z.infer<typeof childUsernameSchema>) {
    setIsChildLoading(true);
    try {
      const result = await requestChildOtp(values.username);
      if (result.error) {
        toast.error(result.error);
      } else {
        setChildUsername(values.username);
        setChildStep("otp");
        toast.success("Login code sent to your parent's email!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChildLoading(false);
    }
  }

  // Child OTP digit management
  const handleChildOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...childOtp];
    newOtp[index] = value.slice(-1);
    setChildOtp(newOtp);

    if (value && index < 5) {
      childOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleChildOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !childOtp[index] && index > 0) {
      childOtpRefs.current[index - 1]?.focus();
    }
  };

  // Child OTP verify and login handler
  async function onChildOtpSubmit() {
    const otpString = childOtp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsChildLoading(true);
    try {
      const result = await verifyChildOtp(childUsername, otpString);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome back, Explorer!");
        router.push("/child");
        router.refresh();
      }
    } catch (error) {
      toast.error("Invalid login code. Please try again.");
    } finally {
      setIsChildLoading(false);
    }
  }

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

  return (
    <Card className="border border-stone-100 shadow-2xl overflow-hidden rounded-[2.5rem] bg-white w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="p-8 sm:p-10 pb-0">
        <CardHeader className="p-0">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="h-6.5 w-6.5 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
              <ShieldCheck size={14} className="text-[#E87154]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 font-sans">
              {loginType === "parent" ? "Loft Gate" : "Reading Nook"}
            </span>
          </div>
          <CardTitle className="text-3xl font-black leading-none tracking-tight text-stone-900">
            Welcome Back ❤️
          </CardTitle>
          <CardDescription className="text-stone-500 font-bold mt-3 text-sm sm:text-base leading-relaxed">
            Continue building confidence through stories.
          </CardDescription>
        </CardHeader>
      </div>

      <CardContent className="p-8 sm:p-10 space-y-6">
        {/* Unified Tab Selector */}
        <div className="flex gap-2 p-1.5 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginType("parent");
              setShowVerificationPrompt(false);
            }}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 active:scale-95",
              loginType === "parent"
                ? "bg-[#E87154] text-white shadow-md shadow-[#E87154]/15"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            )}
          >
            Parent / Ambassador
          </button>
          <button
            type="button"
            onClick={() => setLoginType("child")}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5",
              loginType === "child"
                ? "bg-[#E87154] text-white shadow-md shadow-[#E87154]/15"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            )}
          >
            Child Explorer <Rocket size={12} />
          </button>
        </div>

        {/* TAB 1: PARENT / AMBASSADOR FORM */}
        {loginType === "parent" && (
          <Form {...parentForm}>
            <form onSubmit={parentForm.handleSubmit(onParentSubmit)} className="space-y-6 animate-in fade-in duration-300">
              <FormField
                control={parentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 ml-1">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <Input 
                          placeholder="email@example.com" 
                          className="pl-12 h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={parentForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400">Password</FormLabel>
                      <Link href="/auth/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#E87154] hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput 
                        placeholder="******" 
                        className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {showVerificationPrompt && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Email Not Verified</p>
                      <p className="text-xs text-amber-700 font-semibold leading-relaxed mt-1">
                        Verification is required. Check your inbox for the activation link.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="w-full h-11 rounded-xl font-black border-amber-200 text-amber-700 hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isResendingVerification ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}
              
              <Button type="submit" className="w-full h-13 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base group" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </Form>
        )}

        {/* TAB 2: CHILD OTP LOGIN FLOW */}
        {loginType === "child" && (
          <div className="space-y-6 animate-in fade-in duration-300 font-quicksand">
            {childStep === "username" ? (
              <Form {...childForm}>
                <form onSubmit={childForm.handleSubmit(onChildUsernameSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-[#E87154]">
                      <BookOpen className="h-5 w-5 shrink-0" />
                      <h2 className="text-lg font-black text-slate-800">What is your child username?</h2>
                    </div>
                    
                    <FormField
                      control={childForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Type your username..." 
                              {...field} 
                              disabled={isChildLoading}
                              className="h-14 text-lg text-center bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[18px]"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-[#E87154] text-center" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isChildLoading} 
                    className="w-full h-13 text-base font-black rounded-2xl bg-[#E87154] hover:bg-[#D65D42] text-white shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isChildLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Let's Go!</span>
                        <Rocket className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#E87154]">
                    <Sparkles className="h-5 w-5" />
                    <h2 className="text-lg font-black text-slate-800">Enter Your Code</h2>
                  </div>
                  <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
                    Ask your parent for the 6-digit login code sent to their email!
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3 py-2">
                  {childOtp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { childOtpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChildOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleChildOtpKeyDown(index, e)}
                      className="w-10 h-14 sm:w-11 sm:h-15 text-center text-2xl font-black bg-stone-50 border-2 border-transparent focus:border-[#E87154] focus:bg-white focus:outline-none rounded-xl text-[#E87154] shadow-inner transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={onChildOtpSubmit}
                    disabled={isChildLoading} 
                    className="w-full h-13 text-base font-black rounded-2xl bg-[#E87154] hover:bg-[#D65D42] text-white shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isChildLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Unlock the Library!</span>
                        <BookOpen className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setChildStep("username");
                      setChildOtp(["", "", "", "", "", ""]);
                    }}
                    disabled={isChildLoading}
                    className="w-full flex items-center justify-center gap-1.5 text-stone-400 hover:text-[#E87154] font-bold transition-colors py-2 text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Use a different name</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-8 sm:p-10 pt-0 justify-center">
        {loginType === "parent" ? (
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center">
            New here? <Link href="/auth/register" className="text-[#E87154] font-black hover:underline ml-1">Create Account</Link>
          </p>
        ) : (
          <div className="flex items-center justify-center gap-6 text-stone-400 font-bold text-xs">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#E87154] inline-block" /> Safe Space</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#E87154] inline-block" /> Kid Friendly</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-lg mx-auto">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
        </div>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
