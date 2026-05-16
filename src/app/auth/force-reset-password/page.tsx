"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUserPassword } from "@/app/actions/auth";
import { ShieldCheck, Lock, Save, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForceResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserPassword(password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password updated successfully! Redirecting...");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-stone-100 shadow-md overflow-hidden rounded-[2rem] bg-white w-full max-w-md">
      <div className="p-10 pb-0">
          <CardHeader className="p-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                    <Lock size={12} className="text-[#E87154]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Security Update</span>
            </div>
            <CardTitle className="text-3xl font-bold leading-none tracking-tight text-stone-900">Set New Password</CardTitle>
            <CardDescription className="text-stone-500 font-medium mt-4 text-base">
                Your account is currently using a temporary password. Create a new one to proceed.
            </CardDescription>
          </CardHeader>
      </div>

      <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="password" university-link="" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">New Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                showStrength
                className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" university-link="" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 ml-1">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Verify new password"
                required
                className="h-12 bg-stone-50 border-stone-100 rounded-xl font-medium focus-visible:ring-[#E87154] px-5"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold shadow-sm transition-all active:scale-95 text-white text-base group" disabled={loading}>
              {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
              {loading ? "Updating..." : "Update Password"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
      </CardContent>
    </Card>
  );
}
