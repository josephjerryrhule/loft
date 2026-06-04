"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Shield, UserCheck, UserPlus } from "lucide-react";
import { UserActions } from "@/components/admin/UserActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatRole } from "@/lib/format-utils";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { UserLink } from "@/components/user/UserLink";

interface Ambassador {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  role: string;
  status: string;
  profilePictureUrl: string | null;
  ambassadorId: string | null;
  managerId: string | null;
  teamLeaderId: string | null;
  createdAt: Date;
  salesCount: number;
}

interface HierarchyData {
  operationsManagers: {id: string, name: string}[];
  managers: {id: string, name: string}[];
  teamLeaders: {id: string, name: string}[];
}

export default function AmbassadorManagementClient({ 
    initialAmbassadors, 
    initialHierarchyData 
}: { 
    initialAmbassadors: Ambassador[], 
    initialHierarchyData: HierarchyData 
}) {
  const [ambassadors] = useState<Ambassador[]>(initialAmbassadors);
  const [hierarchyData] = useState<HierarchyData>(initialHierarchyData);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAmbassadors = useMemo(() => {
    return ambassadors.filter((user) => {
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesSearch = !searchQuery || 
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.ambassadorId?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });
  }, [ambassadors, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: ambassadors.length,
      ops: ambassadors.filter(a => a.role === "OPERATIONS_MANAGER").length,
      managers: ambassadors.filter(a => a.role === "MANAGER").length,
      leaders: ambassadors.filter(a => a.role === "TEAM_LEADER").length,
      affiliates: ambassadors.filter(a => a.role === "AFFILIATE").length,
    };
  }, [ambassadors]);

  const totalPages = Math.ceil(filteredAmbassadors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAmbassadors = filteredAmbassadors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Ambassador Management"
        subtitle="Manage the platform hierarchy, promote staff, and assign roles."
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <PremiumKPICard
            title="Total Staff"
            value={stats.total}
            icon={Users}
            theme="primary"
          />
          <PremiumKPICard
            title="Ops Managers"
            value={stats.ops}
            icon={Shield}
            theme="info"
          />
          <PremiumKPICard
            title="Managers"
            value={stats.managers}
            icon={UserCheck}
            theme="info"
          />
          <PremiumKPICard
            title="Team Leaders"
            value={stats.leaders}
            icon={UserPlus}
            theme="warning"
          />
          <PremiumKPICard
            title="Affiliates"
            value={stats.affiliates}
            icon={Users}
            theme="success"
          />
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search by name, email or ID..." 
                    className="pl-10 h-11 bg-slate-50 border-none" 
                    value={searchQuery}
                    onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                    }}
                />
            </div>
            <div className="w-full sm:w-[240px]">
                <select 
                    className="flex h-11 w-full items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-none font-medium"
                    value={roleFilter}
                    onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                    }}
                >
                    <option value="ALL">All Roles</option>
                    <option value="OPERATIONS_MANAGER">Operations Managers</option>
                    <option value="MANAGER">Managers</option>
                    <option value="TEAM_LEADER">Team Leaders</option>
                    <option value="AFFILIATE">Affiliates</option>
                </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border-none shadow-md bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="pl-6">Ambassador</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Superior / Leader</TableHead>
              <TableHead className="text-center">Sales</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAmbassadors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 opacity-20" />
                    <p>No ambassadors found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAmbassadors.map((user) => {
                const superior = ambassadors.find(a => a.id === user.managerId);
                const teamLeader = ambassadors.find(a => a.id === user.teamLeaderId);

                return (
                  <TableRow key={user.id} className="group transition-colors">
                    <TableCell className="pl-6">
                      <UserLink userId={user.id} status={user.status} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer">
                          <AvatarImage src={user.profilePictureUrl || ""} />
                          <AvatarFallback className="bg-slate-100 font-bold text-slate-500">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900 hover:underline cursor-pointer">{user.name}</span>
                            <span className="text-[11px] text-slate-500">{user.email}</span>
                        </div>
                      </UserLink>
                    </TableCell>
                    <TableCell>
                       <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                         {user.ambassadorId || '-'}
                       </span>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none">
                         {formatRole(user.role)}
                       </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                             {user.role === "MANAGER" && superior && (
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3 text-[#E87154]" />
                                    <UserLink userId={superior.id} userName={superior.name} status={superior.status} className="text-[11px] font-bold text-slate-700 hover:underline hover:text-[#E87154] transition-colors cursor-pointer" />
                                </div>
                             )}
                             {user.role === "TEAM_LEADER" && superior && (
                                <div className="flex items-center gap-1.5">
                                    <UserCheck className="h-3 w-3 text-[#E87154]" />
                                    <UserLink userId={superior.id} userName={superior.name} status={superior.status} className="text-[11px] font-bold text-slate-700 hover:underline hover:text-[#E87154] transition-colors cursor-pointer" />
                                </div>
                             )}
                             {user.role === "AFFILIATE" && (
                                <>
                                    {superior && (
                                        <div className="flex items-center gap-1.5">
                                            <UserCheck className="h-3 w-3 text-purple-500" />
                                            <UserLink userId={superior.id} userName={superior.name} status={superior.status} className="text-[11px] font-medium text-slate-700 hover:underline hover:text-purple-600 transition-colors cursor-pointer" />
                                        </div>
                                    )}
                                    {teamLeader && (
                                        <div className="flex items-center gap-1.5">
                                            <UserPlus className="h-3 w-3 text-indigo-500" />
                                            <UserLink userId={teamLeader.id} userName={teamLeader.name} status={teamLeader.status} className="text-[11px] font-medium text-slate-700 hover:underline hover:text-indigo-600 transition-colors cursor-pointer" />
                                        </div>
                                    )}
                                    {!superior && !teamLeader && <span className="text-[11px] text-slate-400">—</span>}
                                </>
                             )}
                            {(user.role === "OPERATIONS_MANAGER" || (!superior && !teamLeader && user.role !== "AFFILIATE")) && (
                                <span className="text-[11px] text-slate-400">—</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-7 rounded-full bg-slate-100 font-black text-slate-900 text-[10px]">
                            {user.salesCount}
                        </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === "ACTIVE" ? "default" : "secondary"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            user.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 border-none",
                            "bg-slate-100 text-slate-500 border-none"
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <UserActions 
                            user={user} 
                            managers={hierarchyData.managers} 
                            teamLeaders={hierarchyData.teamLeaders} 
                            operationsManagers={hierarchyData.operationsManagers} 
                        />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-slate-50">
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredAmbassadors.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
                }}
            />
        </div>
      </div>
    </div>
  );
}
