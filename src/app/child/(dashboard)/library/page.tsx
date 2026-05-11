import { getChildSession } from "@/lib/child-auth";
import { getChildLibraryFlipbooks } from "@/app/actions/child-flipbooks";
import { redirect } from "next/navigation";
import { Bookshelf } from "@/components/child/Bookshelf";
import { Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function ChildLibraryPage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  const { flipbooks, error } = await getChildLibraryFlipbooks(searchParams.search);

  if (error || !flipbooks) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#E87154] font-black text-xl font-quicksand">
          Something went wrong. Let's try again!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header & Search Section */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#E87154]">
              <div className="w-10 h-10 bg-[#E87154]/10 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] font-quicksand">
                Discovery
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#2D2D2D] font-quicksand tracking-tight">
              Magical <span className="text-[#E87154]">Library</span>
            </h1>
          </div>

          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BBBBBB] group-focus-within:text-[#E87154] transition-colors" />
            <form action="/child/library" method="GET">
              <Input
                name="search"
                placeholder="Search for adventures..."
                defaultValue={searchParams.search}
                className="h-16 pl-14 pr-6 rounded-3xl border-2 border-[#E87154]/10 focus:border-[#E87154] bg-white shadow-sm font-bold text-lg placeholder:text-[#BBBBBB] focus:ring-0 transition-all"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Bookshelf Results */}
      <Bookshelf flipbooks={flipbooks} />
    </div>
  );
}
