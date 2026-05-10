"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { requestChildOtp, verifyChildOtp } from "@/app/actions/child-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Sparkles, BookOpen, Rocket, ArrowLeft } from "lucide-react";
import Image from "next/image";

const usernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
});

interface LoginFormProps {
  logoUrl?: string;
  platformName?: string;
}

export default function LoginForm({ logoUrl, platformName }: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"username" | "otp">("username");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: "" },
  });

  async function onUsernameSubmit(values: z.infer<typeof usernameSchema>) {
    setIsLoading(true);
    try {
      const result = await requestChildOtp(values.username);
      if (result.error) {
        toast.error(result.error);
      } else {
        setUsername(values.username);
        setStep("otp");
        toast.success("Login code sent to your parent's email!");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  async function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function onOtpSubmit() {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyChildOtp(username, otpString);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome back!");
        router.push("/child");
      }
    } catch (error) {
      toast.error("Invalid login code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] p-4 font-quicksand relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E87154]/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E87154]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Greeting */}
        <div className="text-center mb-10 space-y-6">
          <div className="mx-auto w-28 h-28 bg-white rounded-[32px] shadow-[0_12px_40px_rgba(232,113,84,0.12)] flex items-center justify-center border border-[#E87154]/10 transform hover:rotate-3 transition-transform duration-500">
            {logoUrl ? (
              <Image src={logoUrl} alt={platformName || "Logo"} width={80} height={80} className="object-contain" />
            ) : (
              <Image src="/logo.png" alt="Loft Logo" width={80} height={80} className="object-contain" />
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#2D2D2D] tracking-tight">
              {step === "username" ? "Welcome Home!" : "Ready to Explore?"}
            </h1>
            <p className="text-[#6D6D6D] text-lg font-medium">
              {step === "username" 
                ? `Step into your secret reading nook at ${platformName || "Loft"}` 
                : "Ask your parent for your special code!"}
            </p>
          </div>
        </div>

        {/* Interaction Card */}
        <div className="bg-white rounded-[40px] p-10 shadow-[0_32px_64px_rgba(232,113,84,0.1)] border border-[#E87154]/5 relative">
          {step === "username" ? (
            <Form {...usernameForm}>
              <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 text-[#E87154]">
                    <BookOpen className="h-6 w-6" />
                    <h2 className="text-xl font-bold">What is your name?</h2>
                  </div>
                  
                  <FormField
                    control={usernameForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              placeholder="Type your username..." 
                              {...field} 
                              disabled={isLoading}
                              className="h-[72px] text-xl px-8 border-2 border-[#F5F5F5] focus:border-[#E87154] focus:ring-0 rounded-2xl bg-[#F9F9F9] font-bold text-[#2D2D2D] transition-all placeholder:text-[#BBBBBB] group-hover:bg-white"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="font-bold text-[#E87154] text-center" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-[72px] text-xl font-black rounded-2xl bg-[#E87154] hover:bg-[#D65D42] text-white shadow-[0_12px_24px_rgba(232,113,84,0.3)] hover:shadow-[0_8px_16px_rgba(232,113,84,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <span>Let&apos;s Go!</span>
                      <Rocket className="h-6 w-6" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[#E87154]">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Enter Your Code</h2>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-16 text-center text-3xl font-black bg-[#F9F9F9] border-2 border-[#F5F5F5] focus:border-[#E87154] focus:bg-white focus:outline-none rounded-xl text-[#E87154] transition-all"
                  />
                ))}
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={onOtpSubmit}
                  disabled={isLoading} 
                  className="w-full h-[72px] text-xl font-black rounded-2xl bg-[#E87154] hover:bg-[#D65D42] text-white shadow-[0_12px_24px_rgba(232,113,84,0.3)] hover:shadow-[0_8px_16px_rgba(232,113,84,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <span>Unlock the Library!</span>
                      <BookOpen className="h-6 w-6" />
                    </>
                  )}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setStep("username")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-[#BBBBBB] hover:text-[#E87154] font-bold transition-colors py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Use a different name</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 flex items-center justify-center gap-8 text-[#BBBBBB] font-bold text-sm">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#E87154]"></div>
             <span>Safe Space</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#E87154]"></div>
             <span>Kid Friendly</span>
           </div>
        </div>
      </div>
    </div>
  );
}
