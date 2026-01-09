import { auth } from "@/auth";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // @ts-ignore - session.user.role exists in our custom session type
  const userRole = session.user.role;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} />

      <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
         {/* Mobile Header */}
         <div className="md:hidden flex items-center p-4 border-b bg-white dark:bg-slate-900">
             <MobileNav userRole={userRole} />
             <span className="font-bold ml-2">Loft</span>
         </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
             <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
}
