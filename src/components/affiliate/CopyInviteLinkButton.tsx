"use client";

import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface CopyInviteLinkButtonProps {
  inviteCode: string;
}

export function CopyInviteLinkButton({ inviteCode }: CopyInviteLinkButtonProps) {
  const handleCopy = () => {
    const link = `${window.location.origin}/signup?ref=${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <Button onClick={handleCopy}>
      <Link2 className="mr-2 h-4 w-4" /> Copy Invite Link
    </Button>
  );
}
