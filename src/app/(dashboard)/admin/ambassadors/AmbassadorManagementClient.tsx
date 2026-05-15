"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Shield, UserCheck, UserPlus } from "lucide-react";
import { UserActions } from "@/components/admin/UserActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatRole } from "@/lib/format-utils";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Ambassador Management</h1>
            <p className="text-muted-foreground">Manage the platform hierarchy, promote staff, and assign roles.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <CardContent className="pt-4 pb-2 text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Staff</div>
              </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardContent className="pt-4 pb-2 text-center text-blue-700">
                  <div className="text-2xl font-bold">{stats.ops}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Ops Managers</div>
              </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100 shadow-sm">
              <CardContent className="pt-4 pb-2 text-center text-purple-700">
                  <div className="text-2xl font-bold">{stats.managers}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Managers</div>
              </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
              <CardContent className="pt-4 pb-2 text-center text-indigo-700">
                  <div className="text-2xl font-bold">{stats.leaders}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Team Leaders</div>
              </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
              <CardContent className="pt-4 pb-2 text-center text-emerald-700">
                  <div className="text-2xl font-bold">{stats.affiliates}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Affiliates</div>
              </CardContent>
          </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
         <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by name, email or ID..." 
                className="pl-8 h-10" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
            />
         </div>
         <div className="w-full sm:w-[220px]">
             <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-wider">Ambassador</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-wider">ID</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-wider">Role</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-wider">Superior / Leader</TableHead>
              <TableHead className="text-center font-bold uppercase text-[10px] tracking-wider">Sales</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAmbassadors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                  No ambassadors found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAmbassadors.map((user) => {
                const superior = ambassadors.find(a => a.id === user.managerId);
                const teamLeader = ambassadors.find(a => a.id === user.teamLeaderId);

                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={user.profilePictureUrl || ""} />
                          <AvatarFallback className="bg-slate-100">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900">{user.name}</span>
                            <span className="text-[11px] text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="font-mono text-[11px] font-bold text-slate-500">
                         {user.ambassadorId || '-'}
                       </span>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[10px] tracking-wide font-bold bg-white">
                         {formatRole(user.role)}
                       </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            {user.role === "MANAGER" && superior && (
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3 text-blue-500" />
                                    <span className="text-[11px] font-medium">{superior.name}</span>
                                </div>
                            )}
                            {user.role === "TEAM_LEADER" && superior && (
                                <div className="flex items-center gap-1.5">
                                    <UserCheck className="h-3 w-3 text-purple-500" />
                                    <span className="text-[11px] font-medium">{superior.name}</span>
                                </div>
                            )}
                            {user.role === "AFFILIATE" && (
                                <>
                                    {superior && (
                                        <div className="flex items-center gap-1.5">
                                            <UserCheck className="h-3 w-3 text-purple-500" />
                                            <span className="text-[11px] font-medium">{superior.name}</span>
                                        </div>
                                    )}
                                    {teamLeader && (
                                        <div className="flex items-center gap-1.5">
                                            <UserPlus className="h-3 w-3 text-indigo-500" />
                                            <span className="text-[11px] font-medium">{teamLeader.name}</span>
                                        </div>
                                    )}
                                    {!superior && !teamLeader && <span className="text-[11px] text-muted-foreground">-</span>}
                                </>
                            )}
                            {(user.role === "OPERATIONS_MANAGER" || (!superior && !teamLeader && user.role !== "AFFILIATE")) && (
                                <span className="text-[11px] text-muted-foreground">-</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 h-7 rounded-full bg-slate-100 font-bold text-slate-700 text-xs">
                            {user.salesCount}
                        </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
      </div>

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
  );
}
