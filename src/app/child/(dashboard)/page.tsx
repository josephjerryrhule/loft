import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/child-auth";
import { getChildFlipbooks } from "@/app/actions/child-flipbooks";
import { Bookshelf } from "@/components/child/Bookshelf";
import { ChildLogoutButton } from "@/components/child/ChildLogoutButton";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default async function ChildDashboardPage() {
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  const { flipbooks, hasAccess, childName, error } = await getChildFlipbooks();

  if (error || !flipbooks) {
    return (
      <div className="min-h-screen bg-sky-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Oops!</h1>
          <p className="text-slate-600">Something went wrong while getting your books.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-sans overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-amber-300">
               <Image src="/images/avatar-placeholder.png" alt="Avatar" width={48} height={48} className="object-cover opacity-60" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-indigo-900 tracking-tight">
                Hi, {childName}! 👋
              </h1>
              <p className="text-sm font-medium text-sky-600">
                Welcome to your magical library
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!hasAccess && (
              <div className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-bold shadow-sm border border-rose-200">
                Preview Mode
              </div>
            )}
            <ChildLogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 pt-8">
        {!hasAccess && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-orange-500 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-orange-800">
                    Ask your parents to subscribe!
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      You are currently in preview mode. Ask your parents to unlock all your amazing books!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Bookshelf flipbooks={flipbooks} />
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}
