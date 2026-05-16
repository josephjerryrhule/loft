"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setTeamMemberRole } from "@/app/actions/manager";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
    userId: string;
    currentRole: "AFFILIATE" | "TEAM_LEADER" | string;
    name: string;
}

export function TeamMemberRoleAction({ userId, currentRole, name }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    if (currentRole !== "AFFILIATE" && currentRole !== "TEAM_LEADER") {
        return null;
    }

    const isPromote = currentRole === "AFFILIATE";
    const nextRole = isPromote ? "TEAM_LEADER" : "AFFILIATE";
    const verb = isPromote ? "Promote" : "Demote";
    const verbing = isPromote ? "Promoting" : "Demoting";

    const onConfirm = () => {
        startTransition(async () => {
            const result = await setTeamMemberRole(userId, nextRole as "AFFILIATE" | "TEAM_LEADER");
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} ${isPromote ? "promoted to Team Leader" : "moved back to Affiliate"}.`);
                setOpen(false);
                router.refresh();
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={isPromote ? "default" : "outline"}
                    size="sm"
                    className={isPromote ? "bg-[#E87154] hover:bg-[#D66144] text-white font-bold gap-1" : "font-bold gap-1"}
                >
                    {isPromote ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {verb}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{verb} {name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isPromote
                            ? `${name} will become a Team Leader and can supervise other affiliates assigned to them. A new Team Leader ID will be issued if they don't already have one.`
                            : `${name} will be demoted back to an Affiliate. Any affiliates currently assigned to them as team leader will be unassigned.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isPending}
                        className={isPromote ? "bg-[#E87154] hover:bg-[#D66144]" : ""}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {verbing}…
                            </>
                        ) : (
                            `Confirm ${verb}`
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
