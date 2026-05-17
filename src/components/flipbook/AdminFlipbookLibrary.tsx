"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FlipbookCard, type FlipbookCardData } from "./FlipbookCard";

interface CategoryGroup {
  category: { id: string; name: string; slug: string };
  flipbooks: FlipbookCardData[];
}

interface Props {
  groups: CategoryGroup[];
  onEdit: (id: string) => void;
  onPublishToggle: (id: string, next: boolean) => Promise<void>;
  renderCreateButton?: () => React.ReactNode;
}

export function AdminFlipbookLibrary({ groups, onEdit, onPublishToggle, renderCreateButton }: Props) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("ALL");

  const flatFiltered = useMemo(() => {
    const all = groups.flatMap((g) => g.flipbooks.map((f) => ({ ...f, _catId: g.category.id })));
    const byCat = activeCat === "ALL" ? all : all.filter((f) => f._catId === activeCat);
    if (!search.trim()) return byCat;
    const q = search.toLowerCase();
    return byCat.filter((f) => f.title.toLowerCase().includes(q));
  }, [groups, activeCat, search]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search flipbooks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-medium"
          />
        </div>
        {renderCreateButton?.()}
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryPill label="All" active={activeCat === "ALL"} onClick={() => setActiveCat("ALL")} />
        {groups.map((g) => (
          <CategoryPill
            key={g.category.id}
            label={`${g.category.name} (${g.flipbooks.length})`}
            active={activeCat === g.category.id}
            onClick={() => setActiveCat(g.category.id)}
          />
        ))}
      </div>

      {flatFiltered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium">
          No flipbooks match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {flatFiltered.map((f) => (
            <FlipbookCard key={f.id} flipbook={f} onEdit={onEdit} onPublishToggle={onPublishToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-black transition ${
        active
          ? "bg-slate-900 text-white shadow"
          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
