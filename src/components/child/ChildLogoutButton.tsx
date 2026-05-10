"use client";

import { useTransition } from "react";
import { logoutChild } from "@/app/actions/child-auth";
import { LogOut } from "lucide-react";

export function ChildLogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logoutChild();
      if (res?.success) {
        window.location.href = "/child/login";
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-white text-rose-500 rounded-full text-sm font-bold shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span>{isPending ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
