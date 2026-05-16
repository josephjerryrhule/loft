"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, Eye, Pencil, ShoppingBag, Clock, CheckCircle2, Search, Filter } from "lucide-react";
import { getAllOrders } from "@/app/actions/admin";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import { ViewOrderDialog } from "@/components/order/ViewOrderDialog";
import { EditOrderDialog } from "@/components/order/EditOrderDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currency, setCurrency] = useState("GHS");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, settings] = await Promise.all([
        getAllOrders(),
        getSystemSettings()
      ]);
      setOrders(ordersData);
      setCurrency(settings.currency || "GHS");
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Orders & Fulfillment"
        subtitle="Track purchase history, manage physical shipments, and deliver digital assets"
      />

      <Card className="border-none shadow-sm bg-white rounded-2xl sm:rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by order # or email..." 
                className="pl-11 h-12 bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                <Button variant="ghost" className="bg-slate-50 h-12 px-5 rounded-xl text-slate-500 font-bold border-none shadow-inner gap-2 hover:bg-slate-100 transition-all shrink-0">
                    <Filter size={16} /> Filters
                </Button>
                <div className="h-8 w-[1px] bg-slate-200 hidden lg:block" />
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl shadow-inner border-none h-12 shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest hidden sm:inline">Status:</span>
                    <Badge variant="outline" className="bg-white border-none shadow-sm text-[9px] font-black tracking-widest h-7 px-3">ALL ORDERS</Badge>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
        <div className="overflow-x-auto relative w-full">
            <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 sm:pl-8">Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right pr-6 sm:pr-8">Management</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedOrders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <ShoppingBag className="h-12 w-12 opacity-10" />
                        <p className="font-bold tracking-wide">No transactions matched your search criteria.</p>
                    </div>
                    </TableCell>
                </TableRow>
                )}
                {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="group transition-all duration-300">
                    <TableCell className="pl-6 sm:pl-8">
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tighter text-base group-hover:text-[#E87154] transition-colors whitespace-nowrap">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-white shadow-sm ring-2 ring-slate-50">
                        <AvatarImage src={order.customer.profilePictureUrl || ""} />
                        <AvatarFallback className="bg-slate-100 text-[10px] font-black">{order.customer.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">{order.customer.email}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Client Portal</span>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[140px]">{order.product.title}</span>
                            <Badge variant="outline" className="w-fit text-[8px] h-4 px-1 border-slate-100 text-slate-400 uppercase font-black tracking-tighter">{order.product.productType}</Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                    <Badge 
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.1em] border-none shadow-sm whitespace-nowrap",
                            order.status === "COMPLETED" && "bg-emerald-100 text-emerald-700",
                            order.status === "PROCESSING" && "bg-blue-100 text-blue-700",
                            order.status === "CANCELLED" && "bg-red-100 text-red-700",
                            order.status === "PENDING" && "bg-amber-100 text-amber-700"
                        )}
                    >
                        {order.status === "COMPLETED" ? <CheckCircle2 size={10} className="mr-1.5" /> : 
                        order.status === "PROCESSING" ? <Clock size={10} className="mr-1.5" /> : null}
                        {order.status}
                    </Badge>
                    </TableCell>
                    <TableCell>
                    <Badge 
                        variant="outline"
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.1em] border-none whitespace-nowrap",
                            order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED" ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
                        )}
                    >
                        {order.paymentStatus}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                            <span className="text-base font-black text-slate-900 leading-none whitespace-nowrap">
                                <span className="text-[10px] text-slate-400 mr-1 font-bold tracking-normal">{getCurrencySymbol(currency)}</span>
                                {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic hidden sm:inline">Authorized via Gateway</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 sm:pr-8">
                    <div className="flex justify-end gap-2">
                        <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-[#E87154]/10 hover:text-[#E87154] transition-all group/btn"
                        onClick={() => {
                            setSelectedOrder(order);
                            setViewDialogOpen(true);
                        }}
                        >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-blue-50:bg-blue-900/20 hover:text-blue-600 transition-all group/btn"
                        onClick={() => {
                            setSelectedOrder(order);
                            setEditDialogOpen(true);
                        }}
                        >
                        <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
        <div className="p-5 sm:p-6 border-t border-slate-50 bg-slate-50/30">
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredOrders.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                }}
            />
        </div>
      </div>

      <ViewOrderDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        order={selectedOrder}
        currency={currency}
      />

      {selectedOrder && (
        <EditOrderDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          order={selectedOrder}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}
