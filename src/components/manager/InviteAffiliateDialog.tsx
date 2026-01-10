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
import { Copy, UserPlus, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!initialCode && open) {
      loadInviteCode();
    }
  }, [open, initialCode]);

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
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Affiliate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Affiliate</DialogTitle>
          <DialogDescription>
            Share this link with potential affiliates to join your team.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : inviteCode ? (
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={inviteLink}
                readOnly
              />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to load invite code. Please try again.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
