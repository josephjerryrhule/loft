"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { requestChildOtp, verifyChildOtp } from "@/app/actions/child-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";

const usernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export default function ChildLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"username" | "otp">("username");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
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

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    setIsLoading(true);
    try {
      const result = await verifyChildOtp(username, values.otp);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome back!");
        router.push("/child/dashboard");
      }
    } catch (error) {
      toast.error("Invalid login code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-md shadow-2xl border-white/50 bg-white/80 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto bg-white p-3 rounded-2xl shadow-sm w-20 h-20 flex items-center justify-center">
             {/* Using a placeholder fun icon/logo for kids */}
            <div className="text-4xl">🚀</div>
          </div>
          <div>
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {step === "username" ? "Welcome to Loft!" : "Enter Your Code"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {step === "username" 
                ? "Enter your username to start reading." 
                : "Ask your parent for the 6-digit code sent to their email."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === "username" ? (
            <Form {...usernameForm}>
              <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-6">
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-zinc-700">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. superhero123" 
                          {...field} 
                          className="h-12 text-lg px-4 border-2 border-purple-100 focus-visible:border-purple-500 focus-visible:ring-purple-500 rounded-xl bg-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Next <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-zinc-700">Secret Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          {...field} 
                          maxLength={6}
                          className="h-16 text-3xl text-center tracking-[0.5em] px-4 border-2 border-purple-100 focus-visible:border-purple-500 focus-visible:ring-purple-500 rounded-xl bg-white/50 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-12 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Let's Go!"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("username")}
                    disabled={isLoading}
                    className="w-full h-12 text-zinc-500 hover:text-zinc-700 font-medium"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go back
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
