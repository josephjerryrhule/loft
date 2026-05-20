"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Package, ShoppingCart, Eye, Download, CheckCircle2, Clock, Trash2, ArrowUpRight, Hash } from "lucide-react";
import { getCustomerOrders } from "@/app/actions/user";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import { ViewOrderDialog } from "@/components/order/ViewOrderDialog";
import Image from "next/image";
import Link from "next/link";
import { TablePagination } from "@/components/ui/table-pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn, formatStatusLabel } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customizationData: string | null;
  status: string;
  paymentStatus: string;
  paymentReference: string | null;
  completedFileUrl: string | null;
  createdAt: string;
  product: {
    id: string;
    title: string;
    description: string | null;
    productType: string;
    price: number;
    featuredImageUrl: string | null;
  };
  referredBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}


export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("GHS");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadOrders(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  async function loadSettings() {
    try {
      const settings = await getSystemSettings();
      setCurrency(settings.currency || "GHS");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  async function loadOrders(page: number, size: number) {
    setLoading(true);
    try {
      const data = await getCustomerOrders(page, size);
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
        <PageHeader
            title="My Orders"
            subtitle="Track your platform purchase history and download digital assets."
            actions={
                <div className="flex items-center gap-3 px-4 sm:px-5 h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner">
                    <ShoppingCart className="h-4 w-4 text-[#E87154]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{total} Transactions</span>
                </div>
            }
        />

      {orders.length === 0 ? (
        <div className="flex justify-center pt-10">
            <Card className="max-w-md border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem]">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg mb-6">
                        <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Empty History</h3>
                    <p className="text-slate-500 font-medium mt-2 leading-relaxed text-sm sm:text-base">
                        When you make a purchase from our catalog, your items and tracking details will appear here.
                    </p>
                    <Button asChild className="mt-8 h-12 px-8 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white">
                        <Link href="/products">Visit Store</Link>
                    </Button>
                </div>
            </Card>
        </div>
      ) : (
        <div className="space-y-4">
            {/* Mobile View: Card Layout */}
            <div className="grid gap-4 md:hidden">
                {orders.map((order) => (
                    <Card key={order.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900 dark:text-white tracking-tighter text-lg">{order.orderNumber}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <Badge 
                                    className={cn(
                                        "text-[9px] font-black uppercase tracking-widest border-none px-2 h-6",
                                        order.paymentStatus === "PAID" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                    )}
                                >
                                    {formatStatusLabel(order.paymentStatus)}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm shrink-0">
                                    {order.product.featuredImageUrl ? (
                                        <Image
                                        src={order.product.featuredImageUrl}
                                        alt={order.product.title}
                                        width={48}
                                        height={48}
                                        unoptimized
                                        className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{order.product.title}</h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{order.product.productType}</span>
                                        <span className="font-black text-sm">
                                            <span className="text-[9px] text-slate-400 mr-1">GHS</span>
                                            {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <Badge 
                                    variant="outline"
                                    className={cn(
                                        "text-[9px] font-black uppercase tracking-widest border-none h-8 px-3",
                                        order.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : 
                                        order.status === "PROCESSING" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                                    )}
                                >
                                    {order.status}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 w-9 p-0 rounded-xl bg-slate-50 hover:bg-[#E87154]/10 hover:text-[#E87154]"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setViewDialogOpen(true);
                                        }}
                                    >
                                        <Eye size={16} />
                                    </Button>
                                    {order.status === "COMPLETED" && order.completedFileUrl && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 rounded-xl bg-emerald-50 hover:text-emerald-600"
                                            onClick={() => handleDownload(
                                                order.completedFileUrl!,
                                                `${order.orderNumber}-${order.product.title}.${order.completedFileUrl!.split('.').pop()}`
                                            )}
                                        >
                                            <Download size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop View: Table Layout */}
            <div className="hidden md:block rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto relative w-full">
                    <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="pl-10">Reference</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Details</TableHead>
                        <TableHead className="text-right pr-10">Control</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                        <TableRow key={order.id} className="group transition-all duration-300">
                            <TableCell className="pl-10 py-6">
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900 dark:text-white tracking-tighter text-base group-hover:text-[#E87154] transition-colors whitespace-nowrap">{order.orderNumber}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap mt-0.5">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        {order.product.featuredImageUrl ? (
                                            <Image
                                            src={order.product.featuredImageUrl}
                                            alt={order.product.title}
                                            width={48}
                                            height={48}
                                            unoptimized
                                            className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[150px] tracking-tight">{order.product.title}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter line-clamp-1">{order.product.description}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800 border-none px-3 h-6">
                                    {order.product.productType}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center font-black text-slate-500">{order.quantity}</TableCell>
                            <TableCell className="text-right">
                                <span className="text-base font-black text-slate-900 dark:text-white whitespace-nowrap">
                                    <span className="text-[10px] text-slate-400 mr-1 font-bold uppercase">GHS</span>
                                    {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge 
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest border-none px-3 h-7 shadow-sm",
                                        order.paymentStatus === "PAID" ? "bg-emerald-500 text-white shadow-emerald-500/10" : "bg-amber-500 text-white shadow-amber-500/10"
                                    )}
                                >
                                    {formatStatusLabel(order.paymentStatus)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge 
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest border-none h-7 px-3",
                                        order.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : 
                                        order.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                    )}
                                >
                                    {order.status === "COMPLETED" ? <CheckCircle2 size={10} className="mr-1.5" /> : 
                                    order.status === "PROCESSING" ? <Clock size={10} className="mr-1.5" /> : null}
                                    {formatStatusLabel(order.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                                <div className="flex items-center justify-end gap-3">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full hover:bg-[#E87154]/10 hover:text-[#E87154] transition-all group/btn"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setViewDialogOpen(true);
                                        }}
                                    >
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                    
                                    {order.status === "COMPLETED" && order.completedFileUrl && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all group/btn"
                                            onClick={() => handleDownload(
                                                order.completedFileUrl!,
                                                `${order.orderNumber}-${order.product.title}.${order.completedFileUrl!.split('.').pop()}`
                                            )}
                                        >
                                            <Download className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-t-none shadow-md md:shadow-none">
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={total}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
      )}

      <ViewOrderDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        order={selectedOrder}
        currency={currency}
      />
      </div>
    </TooltipProvider>
  );
}
