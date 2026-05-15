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

interface LeaderboardClientProps {
  initialData: LeaderboardEntry[];
  viewerRole: string;
}

function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 2nd Place */}
      <div className="order-2 md:order-1 flex flex-col items-center justify-end h-full pt-8">
        {top3[1] && (
          <Card className="w-full bg-slate-50/50 border-slate-200 shadow-sm hover:shadow-md transition-all relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">2</div>
             <CardContent className="pt-6 text-center">
                <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-slate-300">
                  <AvatarImage src={top3[1].avatar || ""} />
                  <AvatarFallback>{top3[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold truncate px-2">{top3[1].name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{top3[1].ambassadorId}</p>
                <Badge variant="secondary" className="font-bold">{top3[1].salesCount} Sales</Badge>
                <div className="mt-4">
                   <Link href={`/leaderboard/${top3[1].id}`} className="text-xs font-semibold text-primary hover:underline">View Profile</Link>
                </div>
             </CardContent>
          </Card>
        )}
      </div>

      {/* 1st Place */}
      <div className="order-1 md:order-2 flex flex-col items-center justify-end h-full">
        {top3[0] && (
          <Card className="w-full border-primary/20 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden bg-gradient-to-b from-primary/5 to-white">
             <div className="absolute -top-2 -right-2 bg-yellow-400 p-4 rotate-12 shadow-sm">
                <Trophy className="h-6 w-6 text-white" />
             </div>
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-md">1</div>
             <CardContent className="pt-10 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-yellow-400 ring-4 ring-yellow-100 shadow-lg">
                  <AvatarImage src={top3[0].avatar || ""} />
                  <AvatarFallback className="text-2xl">{top3[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-black truncate px-2 text-slate-900">{top3[0].name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{top3[0].ambassadorId}</p>
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full font-black text-lg shadow-sm">
                   <TrendingUp className="h-5 w-5" />
                   {top3[0].salesCount} Sales
                </div>
                <div className="mt-6">
                   <Link href={`/leaderboard/${top3[0].id}`} className="inline-block bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-md">View Champion Profile</Link>
                </div>
             </CardContent>
          </Card>
        )}
      </div>

      {/* 3rd Place */}
      <div className="order-3 md:order-3 flex flex-col items-center justify-end h-full pt-12">
        {top3[2] && (
          <Card className="w-full bg-slate-50/50 border-slate-200 shadow-sm hover:shadow-md transition-all relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">3</div>
             <CardContent className="pt-6 text-center">
                <Avatar className="h-14 w-14 mx-auto mb-3 border-2 border-amber-500/30">
                  <AvatarImage src={top3[2].avatar || ""} />
                  <AvatarFallback>{top3[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold truncate px-2">{top3[2].name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{top3[2].ambassadorId}</p>
                <Badge variant="secondary" className="font-bold">{top3[2].salesCount} Sales</Badge>
                <div className="mt-4">
                   <Link href={`/leaderboard/${top3[2].id}`} className="text-xs font-semibold text-primary hover:underline">View Profile</Link>
                </div>
             </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardClient({ initialData, viewerRole }: LeaderboardClientProps) {
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
    <div className="space-y-6">
      {!search && roleFilter === "ALL" && filteredData.length >= 3 && (
        <Podium top3={top3} />
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or Ambassador ID..." 
            className="pl-10 h-11 shadow-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-11 shadow-sm">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="AFFILIATE">Affiliate</SelectItem>
            <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="OPERATIONS_MANAGER">Operations Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-lg border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[80px] text-center font-bold uppercase text-[10px] tracking-wider">Rank</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-wider">Ambassador</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-wider">Role</TableHead>
                <TableHead className="text-center font-bold uppercase text-[10px] tracking-wider">Sales</TableHead>
                {filteredData.some(d => d.revenue !== undefined) && (
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Revenue</TableHead>
                )}
                {filteredData.some(d => d.earnings !== undefined) && (
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Earnings</TableHead>
                )}
                <TableHead className="font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                    No ambassadors found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell>
                      <div className="flex justify-center items-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border group-hover:border-primary/30 transition-colors">
                          <AvatarImage src={entry.avatar || ""} />
                          <AvatarFallback className="bg-slate-100">{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{entry.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{entry.ambassadorId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white shadow-sm border-slate-200 font-medium">
                        {formatRole(entry.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-black text-slate-700">
                        {entry.salesCount}
                       </span>
                    </TableCell>
                    {entry.revenue !== undefined && (
                      <TableCell className="text-right font-bold text-slate-900">
                        GHS {entry.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                    {entry.earnings !== undefined && (
                      <TableCell className="text-right font-black text-green-600">
                        GHS {entry.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={entry.status === "ACTIVE" ? "default" : "secondary"} className={cn("text-[10px] px-2 py-0", entry.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : "")}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="text-primary font-bold hover:text-primary hover:bg-primary/5">
                        <Link href={`/leaderboard/${entry.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
