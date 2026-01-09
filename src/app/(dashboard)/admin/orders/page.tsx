"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, Eye } from "lucide-react";
import { getAllOrders } from "@/app/actions/admin";
import { getSystemSettings } from "@/app/actions/settings";
import { getCurrencySymbol } from "@/lib/utils";
import { ViewOrderDialog } from "@/components/order/ViewOrderDialog";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currency, setCurrency] = useState("GHS");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
            {paginatedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={order.customer.profilePictureUrl || ""} />
                      <AvatarFallback>{order.customer.email[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{order.customer.email}</span>
                  </div>
                </TableCell>
                <TableCell>{order.product.title}</TableCell>
                <TableCell>
                  <Badge variant={order.paymentStatus === "COMPLETED" ? "secondary" : "default"}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>{getCurrencySymbol(currency)}{order.totalAmount.toString()}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedOrder(order);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={orders.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />

      <ViewOrderDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        order={selectedOrder}
        currency={currency}
      />
    </div>
  );
}
