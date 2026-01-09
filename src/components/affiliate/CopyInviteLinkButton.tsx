"use client";

import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface CopyInviteLinkButtonProps {
  text: string;
  label?: string;
}

export function CopyInviteLinkButton({ text, label = "Copy Link" }: CopyInviteLinkButtonProps) {
  const handleCopy = () => {
    const finalText = text.startsWith("/") 
      ? `${window.location.origin}${text}` 
      : text;
    navigator.clipboard.writeText(finalText);
    toast.success("Copied to clipboard!");
  };

  return (
    <Button onClick={handleCopy}>
      <Link2 className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
