"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserActions } from "@/components/admin/UserActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { getAllUsers } from "@/app/actions/admin";
import { formatRole } from "@/lib/format-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";


interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  profilePictureUrl: string | null;
  ambassadorId: string | null;
  ambassadorExpiry: Date | null;
  createdAt: Date;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const operationsManagers = useMemo(() => 
    users.filter(u => u.role === "OPERATIONS_MANAGER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  const managers = useMemo(() => 
    users.filter(u => u.role === "MANAGER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  const teamLeaders = useMemo(() => 
    users.filter(u => u.role === "TEAM_LEADER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        subtitle="Manage platform users, roles, and ambassador hierarchies"
        actions={<AddUserDialog />}
      />

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search by email or name..." 
                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-none h-11" 
                    value={searchQuery}
                    onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                    }}
                />
            </div>
            <div className="w-full sm:w-[240px]">
                <select 
                    className="flex h-11 w-full items-center justify-between rounded-md bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-none font-medium"
                    value={roleFilter}
                    onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                    }}
                >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="MANAGER">Manager</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="AFFILIATE">Affiliate</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="PARENT">Parent</option>
                    <option value="FINANCE">Finance</option>
                </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="pl-6">User</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 opacity-20" />
                    <p>No users found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="group transition-colors">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                      <AvatarImage src={user.profilePictureUrl || ""} />
                      <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name'}
                        </span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                     {user.ambassadorId || '-'}
                   </span>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                     {formatRole(user.role)}
                   </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.status === "ACTIVE" ? "default" : "destructive"}
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        user.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none",
                        user.status === "SUSPENDED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none",
                        user.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                    )}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell className="text-right pr-6">
                    <UserActions user={user} managers={managers} teamLeaders={teamLeaders} operationsManagers={operationsManagers} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-slate-50 dark:border-slate-800">
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredUsers.length}
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
