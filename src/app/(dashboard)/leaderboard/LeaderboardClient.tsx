"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LeaderboardEntry } from "@/app/actions/leaderboard";
import { Search, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRole } from "@/lib/format-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Users } from "lucide-react";

interface LeaderboardClientProps {
  initialData: LeaderboardEntry[];
  viewerRole: string;
  viewerId?: string;
}

function Podium({ top3, viewerRole, viewerId }: { top3: LeaderboardEntry[], viewerRole: string, viewerId?: string }) {
  const isAllowedToView = (entryUserId: string) => {
    return ["OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER"].includes(viewerRole) || entryUserId === viewerId;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 2nd Place */}
      <div className="order-2 md:order-1 flex flex-col items-center justify-end h-full pt-8">
        {top3[1] && (
          <Card className="w-full bg-stone-50 border-stone-200 shadow-md hover:shadow-lg transition-all relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-stone-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">2</div>
             <CardContent className="pt-6 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-stone-300">
                  <AvatarImage src={top3[1].avatar || ""} />
                  <AvatarFallback>{top3[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold truncate px-2">{top3[1].name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{top3[1].ambassadorId}</p>
                <div className="flex flex-col gap-1 items-center">
                    <Badge variant="secondary" className="font-bold">{top3[1].paidReferralsCount}/{top3[1].referralsCount} Paid Referrals</Badge>
                    <span className="text-[10px] text-stone-500 font-bold">{top3[1].salesCount} Total Subs</span>
                </div>
                {isAllowedToView(top3[1].id) && (
                  <div className="mt-4">
                     <Link href={`/leaderboard/${top3[1].id}`} className="text-xs font-semibold text-[#E87154] hover:underline">View Profile</Link>
                  </div>
                )}
             </CardContent>
          </Card>
        )}
      </div>

      {/* 1st Place */}
      <div className="order-1 md:order-2 flex flex-col items-center justify-end h-full">
        {top3[0] && (
          <Card className="w-full border-amber-200 shadow-lg hover:shadow-xl transition-all relative overflow-hidden bg-amber-50">
             <div className="absolute -top-2 -right-2 bg-amber-400 p-4 rotate-12">
                <Trophy className="h-6 w-6 text-white" />
             </div>
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">1</div>
             <CardContent className="pt-10 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-amber-400 ring-4 ring-amber-100 shadow-md">
                  <AvatarImage src={top3[0].avatar || ""} />
                  <AvatarFallback className="text-2xl">{top3[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-black truncate px-2 text-stone-900">{top3[0].name}</h3>
                <p className="text-sm text-stone-500 mb-3">{top3[0].ambassadorId}</p>
                <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-black text-lg shadow-sm">
                       <TrendingUp className="h-5 w-5" />
                       {top3[0].paidReferralsCount} Paying / {top3[0].referralsCount} Total
                    </div>
                    <span className="text-xs text-amber-600 font-bold">{top3[0].salesCount} Total Subs</span>
                </div>
                {isAllowedToView(top3[0].id) && (
                  <div className="mt-6">
                     <Link href={`/leaderboard/${top3[0].id}`} className="inline-block bg-[#E87154] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#E87154]/90 transition-colors shadow-sm">View Champion Profile</Link>
                  </div>
                )}
             </CardContent>
          </Card>
        )}
      </div>

      {/* 3rd Place */}
      <div className="order-3 md:order-3 flex flex-col items-center justify-end h-full pt-12">
        {top3[2] && (
          <Card className="w-full bg-orange-50/50 border-orange-200 shadow-md hover:shadow-lg transition-all relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">3</div>
             <CardContent className="pt-6 text-center">
                <Avatar className="h-14 w-14 mx-auto mb-3 border-2 border-orange-200">
                  <AvatarImage src={top3[2].avatar || ""} />
                  <AvatarFallback>{top3[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold truncate px-2">{top3[2].name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{top3[2].ambassadorId}</p>
                <div className="flex flex-col gap-1 items-center">
                    <Badge variant="secondary" className="font-bold">{top3[2].paidReferralsCount}/{top3[2].referralsCount} Paid Referrals</Badge>
                    <span className="text-[10px] text-orange-600 font-bold">{top3[2].salesCount} Total Subs</span>
                </div>
                {isAllowedToView(top3[2].id) && (
                  <div className="mt-4">
                     <Link href={`/leaderboard/${top3[2].id}`} className="text-xs font-semibold text-[#E87154] hover:underline">View Profile</Link>
                  </div>
                )}
             </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


export default function LeaderboardClient({ initialData, viewerRole, viewerId }: LeaderboardClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return data.filter(entry => {
      const matchesSearch = 
        entry.name.toLowerCase().includes(search.toLowerCase()) || 
        entry.ambassadorId?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === "ALL" || entry.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const top3 = useMemo(() => {
      // Only show top 3 if we have data and aren't searching/filtering heavily?
      // Actually, let's just show top 3 of the CURRENTLY filtered data if there's enough
      return filteredData.slice(0, 3);
  }, [filteredData]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">{rank}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Ambassador Leaderboard"
        subtitle="Top performers across the platform based on sales and activity"
      />

      {!search && roleFilter === "ALL" && filteredData.length >= 1 && (
        <Podium top3={top3} viewerRole={viewerRole} viewerId={viewerId} />
      )}

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name or Ambassador ID..." 
                className="pl-10 h-11 bg-slate-50 border-none h-11" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[240px] h-11 bg-slate-50 border-none font-medium">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border-none shadow-md overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[80px] text-center pl-6">Rank</TableHead>
              <TableHead>Ambassador</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center" title="Paying / Total referrals">Referrals (Paid/Total)</TableHead>
              <TableHead className="text-center">Subscriptions</TableHead>
              {filteredData.some(d => d.revenue !== undefined) && (
                <TableHead className="text-right">Revenue</TableHead>
              )}
              {filteredData.some(d => d.earnings !== undefined) && (
                <TableHead className="text-right">Earnings</TableHead>
              )}
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="h-10 w-10 opacity-20" />
                    <p>No ambassadors found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((entry) => (
                <TableRow key={entry.id} className="group transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex justify-center items-center">
                      {getRankIcon(entry.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={entry.avatar || ""} />
                        <AvatarFallback className="bg-slate-100 font-bold text-slate-500">{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900">{entry.name}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 w-fit font-mono">{entry.ambassadorId}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none">
                      {formatRole(entry.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                       <div className="inline-flex items-center gap-1">
                         <span
                           title="Paying referrals (have an active subscription)"
                           className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-emerald-100 font-black text-emerald-700 text-[10px]"
                         >
                           {entry.paidReferralsCount}
                         </span>
                         <span className="text-stone-300 font-bold text-[10px]">/</span>
                         <span
                           title="Total referrals (paid + free-plan signups)"
                           className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-slate-100 font-black text-slate-700 text-[10px]"
                         >
                           {entry.referralsCount}
                         </span>
                       </div>
                  </TableCell>
                  <TableCell className="text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="flex flex-wrap justify-center gap-x-1 gap-y-0.5 max-w-[120px]">
                            {entry.monthlySubs > 0 && <span className="text-[10px] font-bold text-slate-500">{entry.monthlySubs}Mo</span>}
                            {entry.quarterlySubs > 0 && <span className="text-[10px] font-bold text-blue-500">{entry.quarterlySubs}Qt</span>}
                            {entry.semiAnnualSubs > 0 && <span className="text-[10px] font-bold text-purple-500">{entry.semiAnnualSubs}Sa</span>}
                            {entry.yearlySubs > 0 && <span className="text-[10px] font-bold text-[#E87154]">{entry.yearlySubs}Yr</span>}
                            {entry.otherSubs > 0 && <span className="text-[10px] font-bold text-stone-400">{entry.otherSubs}*</span>}
                            {entry.monthlySubs === 0 && entry.quarterlySubs === 0 && entry.semiAnnualSubs === 0 && entry.yearlySubs === 0 && entry.otherSubs === 0 && (
                                <span className="text-[10px] font-bold text-slate-300">0</span>
                            )}
                          </div>
                       </div>
                  </TableCell>
                  {entry.revenue !== undefined && (
                    <TableCell className="text-right font-bold text-slate-900">
                        <span className="text-[10px] text-slate-400 mr-1">GHS</span>
                        {entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  )}
                  {entry.earnings !== undefined && (
                    <TableCell className="text-right font-black text-emerald-600">
                        <span className="text-[10px] opacity-70 mr-1">GHS</span>
                        {entry.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge 
                        variant={entry.status === "ACTIVE" ? "default" : "secondary"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            entry.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 border-none",
                            "bg-slate-100 text-slate-500 border-none"
                        )}
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {(() => {
                      const isAllowed = ["OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER"].includes(viewerRole) || entry.id === viewerId;
                      return isAllowed ? (
                        <Button variant="ghost" size="sm" asChild className="text-[#E87154] font-black hover:text-[#E87154] hover:bg-[#E87154]/10 rounded-full h-8 px-4 transition-all">
                          <Link href={`/leaderboard/${entry.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
