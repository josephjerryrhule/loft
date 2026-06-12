"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { confirmAuditionAttendance } from "@/app/actions/recruitment";
import { toast } from "sonner";

export function ConfirmButton({ applicantId }: { applicantId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await confirmAuditionAttendance(applicantId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Attendance Confirmed!");
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to confirm attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      size="lg"
      className="w-full bg-[#E87154] hover:bg-[#D66144] h-14 text-lg font-bold"
      onClick={handleConfirm}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <CheckCircle2 className="w-5 h-5 mr-2" />
      )}
      Confirm My Attendance
    </Button>
  );
}
