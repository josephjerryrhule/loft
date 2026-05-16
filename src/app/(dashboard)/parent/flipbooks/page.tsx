import Link from "next/link";
import { Baby, BookOpenCheck, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ParentFlipbooksPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Interactive Library"
        subtitle="Access and monitor your child's personalized reading collection."
      />

      <div className="flex justify-center pt-10">
        <Card className="max-w-2xl border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                    <BookOpenCheck size={140} className="text-stone-900" />
                </div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <Sparkles size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Library Access</span>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 leading-none relative z-10">Managed Reading</CardTitle>
            </div>
            
            <CardContent className="p-10 space-y-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-none shadow-inner">
                    <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        To maintain secure progress tracking and valid subscription usage, flipbooks are accessed directly through each <span className="font-black text-slate-900 dark:text-white underline decoration-[#E87154] decoration-2">Lofter Profile</span>.
                    </p>
                    <p className="text-sm text-slate-500 font-medium mt-4 italic">
                        Switch to a child's profile to open their specific library and resume their reading journey.
                    </p>
                </div>

                <div className="pt-2">
                    <Button asChild className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base group">
                        <Link href="/parent/children" className="flex items-center justify-center gap-3">
                            <Baby size={20} />
                            Go to Family Control Panel
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
