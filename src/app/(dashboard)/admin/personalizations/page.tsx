"use client";

import { useEffect, useState } from "react";
import { getPersonalizations } from "@/app/actions/personalization";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  Search, 
  Filter, 
  Sparkles, 
  Eye, 
  CheckCircle, 
  Clock, 
  Download, 
  X,
  User,
  Heart,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminPersonalizationsPage() {
  const [personalizations, setPersonalizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING, SUBMITTED
  const [genderFilter, setGenderFilter] = useState("ALL"); // ALL, MALE, FEMALE, OTHER
  const [colorFilter, setColorFilter] = useState("ALL"); // ALL or custom colors
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadPersonalizations();
  }, []);

  async function loadPersonalizations() {
    try {
      setLoading(true);
      const data = await getPersonalizations();
      setPersonalizations(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load personalizations");
    } finally {
      setLoading(false);
    }
  }

  // Parse customization details helper
  function parseCustomization(order: any) {
    if (!order.customizationData) return null;
    try {
      return JSON.parse(order.customizationData);
    } catch (e) {
      return null;
    }
  }

  // Filter & Search Logic
  const filteredData = personalizations.filter(item => {
    const custom = parseCustomization(item);
    const isSubmitted = custom?.personalizationStatus === "SUBMITTED";
    
    // Status Filter
    if (statusFilter === "SUBMITTED" && !isSubmitted) return false;
    if (statusFilter === "PENDING" && isSubmitted) return false;

    // Gender Filter
    if (genderFilter !== "ALL") {
      const childGender = custom?.child?.gender || "";
      if (childGender.toUpperCase() !== genderFilter.toUpperCase()) return false;
    }

    // Color Filter
    if (colorFilter !== "ALL") {
      const favColor = custom?.preferences?.favColor || "";
      if (!favColor.toLowerCase().includes(colorFilter.toLowerCase())) return false;
    }

    // Search query matches Order Number, Customer Email, Customer Name, Child Name, purchaser email, phone
    const searchLower = searchQuery.toLowerCase();
    const orderNumMatches = item.orderNumber.toLowerCase().includes(searchLower);
    const emailMatches = item.customer.email.toLowerCase().includes(searchLower);
    const purchaserNameMatches = (item.customer.firstName + " " + item.customer.lastName).toLowerCase().includes(searchLower);
    
    const childNameMatches = custom?.child?.fullName ? custom.child.fullName.toLowerCase().includes(searchLower) : false;
    const purchaserEmailMatches = custom?.purchaser?.email ? custom.purchaser.email.toLowerCase().includes(searchLower) : false;
    const purchaserPhoneMatches = custom?.purchaser?.contact ? custom.purchaser.contact.toLowerCase().includes(searchLower) : false;

    return orderNumMatches || emailMatches || purchaserNameMatches || childNameMatches || purchaserEmailMatches || purchaserPhoneMatches;
  });

  // Unique Colors List for Dropdown
  const uniqueColors = Array.from(
    new Set(
      personalizations
        .map(p => parseCustomization(p)?.preferences?.favColor?.trim() || "")
        .filter(c => c !== "")
    )
  ).slice(0, 10);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrint = (order: any) => {
    const custom = parseCustomization(order);
    if (!custom) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Personalization Specs - ${order.orderNumber}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            h1 { font-size: 24px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; color: #e87154; }
            h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .item { margin-bottom: 12px; }
            .label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 700; color: #334155; margin-top: 2px; }
            .photos { display: flex; gap: 20px; margin-top: 16px; }
            .photo-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; width: 220px; text-align: center; }
            .photo-card img { max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; }
            .characters-list { list-style: none; padding: 0; }
            .character-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Personalization Sheet - Order ${order.orderNumber}</h1>
          <div class="grid">
            <div class="item"><div class="label">Purchaser Name</div><div class="value">${custom.purchaser?.fullName}</div></div>
            <div class="item"><div class="label">Purchaser Contact</div><div class="value">${custom.purchaser?.contact || "N/A"}</div></div>
            <div class="item"><div class="label">Purchaser Email</div><div class="value">${custom.purchaser?.email}</div></div>
            <div class="item"><div class="label">Child Full Name</div><div class="value">${custom.child?.fullName}</div></div>
            <div class="item"><div class="label">Child Gender</div><div class="value">${custom.child?.gender}</div></div>
            <div class="item"><div class="label">Child D.O.B</div><div class="value">${new Date(custom.child?.dob).toLocaleDateString()}</div></div>
            <div class="item"><div class="label">Favorite Color</div><div class="value">${custom.preferences?.favColor}</div></div>
            <div class="item"><div class="label">Favorite Food</div><div class="value">${custom.preferences?.favFood}</div></div>
          </div>

          <h2>Additional Featured Characters</h2>
          ${custom.additionalCharacters?.length > 0 ? `
            <ul class="characters-list">
              ${custom.additionalCharacters.map((c: any) => `
                <li class="character-row">
                  <strong>${c.fullName}</strong>
                  <span>${c.relationship}</span>
                </li>
              `).join("")}
            </ul>
          ` : `<p>No additional characters requested.</p>`}

          <h2>Provided Photo References</h2>
          <div class="photos">
            <div class="photo-card">
              <div class="label" style="margin-bottom:8px;">Headshot Photo</div>
              <img src="${custom.photos?.headshot}" alt="headshot" />
            </div>
            <div class="photo-card">
              <div class="label" style="margin-bottom:8px;">Full Body Photo</div>
              <img src="${custom.photos?.fullBody}" alt="full body" />
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
        title="Book Personalizations"
        subtitle="Review, search, and manage user submissions for Personalized Birthday Books"
      />

      {/* Filter and Search Panel */}
      <Card className="border-none shadow-sm bg-white rounded-2xl sm:rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative col-span-1 lg:col-span-2 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by child, purchaser, email or order..." 
                className="pl-11 h-12 bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner w-full" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Dropdown */}
            <div className="w-full">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-slate-700 outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="ALL">All Submission Statuses</option>
                <option value="SUBMITTED">Submitted / Ready</option>
                <option value="PENDING">Pending Submission</option>
              </select>
            </div>

            {/* Gender Dropdown */}
            <div className="w-full">
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-slate-700 outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <div className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
        <div className="overflow-x-auto relative w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 sm:pl-8">Order Ref</TableHead>
                <TableHead>Purchaser</TableHead>
                <TableHead>Child Name</TableHead>
                <TableHead>Child D.O.B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fav Color</TableHead>
                <TableHead>Fav Food</TableHead>
                <TableHead className="text-right pr-6 sm:pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-24 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="h-12 w-12 opacity-10" />
                      <p className="font-bold tracking-wide">No customization requests matched criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((order) => {
                  const custom = parseCustomization(order);
                  const isSubmitted = custom?.personalizationStatus === "SUBMITTED";
                  
                  return (
                    <TableRow key={order.id} className="group transition-all duration-300">
                      <TableCell className="pl-6 sm:pl-8">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tighter text-base whitespace-nowrap group-hover:text-[#E87154] transition-colors">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{custom?.purchaser?.fullName || `${order.customer.firstName} ${order.customer.lastName}`}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{custom?.purchaser?.email || order.customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                          {custom?.child?.fullName || <span className="text-slate-400 font-medium italic">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {custom?.child?.dob ? new Date(custom.child.dob).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm whitespace-nowrap",
                            isSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {isSubmitted ? <CheckCircle size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                          {isSubmitted ? "Ready / Submitted" : "Pending Form"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {custom?.preferences?.favColor ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: custom.preferences.favColor }} />
                            <span className="font-bold text-xs text-slate-700">{custom.preferences.favColor}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-600 truncate max-w-[100px]">
                        {custom?.preferences?.favFood || "—"}
                      </TableCell>
                      <TableCell className="text-right pr-6 sm:pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full hover:bg-[#E87154]/10 hover:text-[#E87154] transition-all"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4.w-4" />
                          </Button>
                          {isSubmitted && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all"
                              onClick={() => handlePrint(order)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/30">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[46rem] w-[95vw] max-h-[92vh] overflow-y-auto border-none shadow-2xl p-0 rounded-[2rem] overflow-x-hidden">
          {selectedOrder && (() => {
            const custom = parseCustomization(selectedOrder);
            const isSubmitted = custom?.personalizationStatus === "SUBMITTED";

            return (
              <>
                <div className="bg-[#E87154] p-6 sm:p-8 text-white relative">
                  <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                    <Sparkles size={110} />
                  </div>
                  <DialogHeader className="relative z-10 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-white/20 hover:bg-white/35 text-white border-none font-bold text-[8px] uppercase tracking-widest px-2.5 h-6">Order Spec Sheet</Badge>
                      <Badge className={cn("border-none font-bold text-[8px] uppercase tracking-widest px-2.5 h-6", isSubmitted ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                        {isSubmitted ? "Ready" : "Pending Onboarding Form"}
                      </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black text-white leading-none">Specs: {selectedOrder.orderNumber}</DialogTitle>
                    <DialogDescription className="text-white/80 font-medium mt-2 text-xs">
                      Detailed specifications submitted by the client for print queue formatting.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 overflow-x-hidden">
                  
                  {/* Grid details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Purchaser card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><User size={12} /> Purchaser Contact</h4>
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="text-slate-400 font-medium">Name:</span> <span className="font-bold">{custom?.purchaser?.fullName || `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`}</span></p>
                        <p><span className="text-slate-400 font-medium">Email:</span> <span className="font-bold">{custom?.purchaser?.email || selectedOrder.customer.email}</span></p>
                        <p><span className="text-slate-400 font-medium">Phone:</span> <span className="font-bold">{custom?.purchaser?.contact || selectedOrder.customer.phoneNumber || "N/A"}</span></p>
                      </div>
                    </div>

                    {/* Child details card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Child Profile</h4>
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="text-slate-400 font-medium">Full Name:</span> <span className="font-bold">{custom?.child?.fullName || <span className="italic text-slate-400 font-normal">Pending submission</span>}</span></p>
                        <p><span className="text-slate-400 font-medium">D.O.B:</span> <span className="font-bold">{custom?.child?.dob ? new Date(custom.child.dob).toLocaleDateString() : "Pending"}</span></p>
                        <p><span className="text-slate-400 font-medium">Gender:</span> <span className="font-bold uppercase tracking-wider">{custom?.child?.gender || "Pending"}</span></p>
                      </div>
                    </div>

                  </div>

                  {isSubmitted ? (
                    <>
                      {/* preferences */}
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                        <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><Heart size={12} /> Custom Story Preferences</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Favorite Color</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-200 inline-block" style={{ backgroundColor: custom.preferences?.favColor || "transparent" }} />
                              <span className="font-bold text-slate-800 dark:text-slate-100">{custom.preferences?.favColor}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Favorite Food</span>
                            <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{custom.preferences?.favFood}</p>
                          </div>
                        </div>
                      </div>

                      {/* Photo references */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={12} /> Reference Photograph Files</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Child Headshot</span>
                            <div className="border border-stone-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square relative max-h-48 flex items-center justify-center shadow-inner">
                              <img src={custom.photos?.headshot} alt="Headshot" className="w-full h-full object-cover" />
                            </div>
                            <a href={custom.photos?.headshot} target="_blank" className="inline-block text-[10px] font-black text-[#E87154] hover:underline uppercase tracking-wider mt-1.5">Open Full Resolution</a>
                          </div>
                          <div className="space-y-1.5 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Child Full Body</span>
                            <div className="border border-stone-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square relative max-h-48 flex items-center justify-center shadow-inner">
                              <img src={custom.photos?.fullBody} alt="Full body" className="w-full h-full object-cover" />
                            </div>
                            <a href={custom.photos?.fullBody} target="_blank" className="inline-block text-[10px] font-black text-[#E87154] hover:underline uppercase tracking-wider mt-1.5">Open Full Resolution</a>
                          </div>
                        </div>
                      </div>

                      {/* Additional Characters */}
                      {custom.additionalCharacters && custom.additionalCharacters.length > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                          <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Featured Sibling / Sitter / parent Characters ({custom.additionalCharacters.length})</h4>
                          <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {custom.additionalCharacters.map((char: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center py-2.5 text-xs text-slate-700 dark:text-slate-300">
                                <span className="font-bold">{char.fullName}</span>
                                <span className="text-slate-400 font-bold bg-white dark:bg-slate-900 border px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">{char.relationship}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 border rounded-2xl border-dashed border-stone-200 bg-stone-50 text-stone-500">
                      <Clock size={36} className="text-stone-300 mb-2" />
                      <p className="font-bold text-sm">Waiting for Client Response</p>
                      <p className="text-xs text-stone-400 mt-1 max-w-xs text-center font-medium">The customer has not yet filled out the book customization form for this order.</p>
                    </div>
                  )}

                  <div className="pt-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Associated Product</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedOrder.product.title}</span>
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDetailOpen(false)}
                        className="flex-1 sm:flex-none h-11 rounded-xl text-slate-400 font-bold hover:text-slate-800"
                      >
                        Close Details
                      </Button>
                      {isSubmitted && (
                        <Button
                          type="button"
                          onClick={() => handlePrint(selectedOrder)}
                          className="flex-1 sm:flex-none h-11 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black text-white px-6 gap-2 shadow-lg shadow-[#E87154]/25"
                        >
                          <Download size={16} /> Print Spec Sheet
                        </Button>
                      )}
                    </div>
                  </div>

                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
