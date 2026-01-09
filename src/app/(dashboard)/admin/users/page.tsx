import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Search } from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserActions } from "@/components/admin/UserActions";

interface AdminUsersPageProps {
  searchParams: Promise<{
    role?: string;
    search?: string;
  }>;
}

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  try {
    const searchParams = await props.searchParams;
    const roleFilter = searchParams?.role;
    const searchQuery = searchParams?.search || "";

    const where: any = {};
  
    if (roleFilter && roleFilter !== "ALL") {
        where.role = roleFilter;
    }

    if (searchQuery) {
        where.OR = [
        { email: { contains: searchQuery } }, 
        { firstName: { contains: searchQuery } },
        { lastName: { contains: searchQuery } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        profilePictureUrl: true,
        createdAt: true,
        }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <AddUserDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border">
         <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <form> 
                <Input 
                    name="search" 
                    placeholder="Search by email or name..." 
                    className="pl-8" 
                    defaultValue={searchQuery}
                />
             </form>
         </div>
         <div className="w-full sm:w-[200px]">
             <form className="flex gap-2">
                 <select 
                    name="role" 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={roleFilter || "ALL"}
                 >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="AFFILIATE">Affiliate</option>
                    <option value="CUSTOMER">Customer</option>
                 </select>
                 <Button type="submit" variant="secondary">Filter</Button>
             </form>
         </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profilePictureUrl || ""} />
                      <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">
                            {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name'}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="uppercase text-[10px] tracking-wide font-bold">
                     {user.role}
                   </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "ONE_TIME_PURCHASE" ? "default" : (user.status === "ACTIVE" ? "default" : "destructive")}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                    <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
  } catch (error) {
    console.error("AdminUsersPage Error:", error);
    return <div className="p-4 text-red-500">Error loading users. Please check server logs.</div>;
  }
}
