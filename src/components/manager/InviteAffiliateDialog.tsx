"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, UserPlus, Loader2, CheckCircle2, Globe, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

// Server action to get invite code
async function getInviteCode() {
  const { getUserProfile } = await import("@/app/actions/settings");
  const profile = await getUserProfile();
  return profile?.inviteCode || null;
}

interface InviteAffiliateDialogProps {
  inviteCode?: string;
}

export function InviteAffiliateDialog({ inviteCode: initialCode }: InviteAffiliateDialogProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(initialCode || null);
  const [loading, setLoading] = useState(!initialCode);
  const [open, setOpen] = useState(false);

  async function loadInviteCode() {
    setLoading(true);
    try {
      const code = await getInviteCode();
      setInviteCode(code);
    } catch (error) {
      console.error("Failed to load invite code:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialCode && open) {
      loadInviteCode();
    }
  }, [open, initialCode]);

  const inviteLink = inviteCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/affiliate/${inviteCode}`
    : '';

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2 h-11 px-6 rounded-xl font-bold text-white">
          <UserPlus size={18} /> Invite Affiliate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2rem]">
        <div className="bg-[#E87154] p-6 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 rotate-12">
                <UserPlus size={120} className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
            <DialogHeader className="relative z-10">
                <DialogTitle className="text-2xl sm:text-3xl font-black text-white leading-none">Team Expansion</DialogTitle>
                <DialogDescription className="text-white/80 font-medium mt-3 text-sm sm:text-base italic">
                    Grow your network by inviting new affiliates
                </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-6 sm:p-10 space-y-6 bg-white dark:bg-slate-900 overflow-x-hidden">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
                    <p className="text-sm font-bold text-slate-500">Generating secure link...</p>
                </div>
            ) : inviteCode ? (
                <div className="space-y-5">
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none space-y-4 shadow-inner">
                        <div className="flex items-center gap-2">
                            <LinkIcon size={14} className="text-[#E87154]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Unique Invite Link</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">{inviteLink}</p>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={copyToClipboard}
                        className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 gap-3 text-white text-base"
                    >
                        <Copy size={20} />
                        Copy Invite Link
                    </Button>
                    
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest px-4 leading-relaxed">
                        Share this link privately. Anyone who signs up through this link will be automatically assigned to your team and hierarchy.
                    </p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-sm font-bold text-red-500 mb-4">
                        Unable to load your invite code.
                    </p>
                    <Button variant="outline" onClick={loadInviteCode} className="text-[#E87154] rounded-xl font-bold border-[#E87154]/20">Try Refreshing</Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
