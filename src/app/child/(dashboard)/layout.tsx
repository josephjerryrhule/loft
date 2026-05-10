import { ReactNode } from "react";
import { getChildSession } from "@/lib/child-auth";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutChild } from "@/app/actions/child-auth";
import { Button } from "@/components/ui/button";

export default async function ChildDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans selection:bg-purple-200">
      <header className="bg-white/80 backdrop-blur-xl border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-transform">
              <span className="text-2xl">🚀</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Loft Kids
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Welcome Back</span>
              <span className="font-extrabold text-lg text-zinc-800">{session.username}</span>
            </div>
            <form action={async () => {
              "use server";
              await logoutChild();
              redirect("/child/login");
            }}>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
