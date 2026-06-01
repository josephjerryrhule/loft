"use client";

import { useEffect, useState } from "react";
import { getPersonalizations } from "@/app/actions/personalization";
import { deleteOrderCustomization } from "@/app/actions/admin";
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
  Sparkles, 
  Eye, 
  CheckCircle, 
  Clock, 
  User, 
  Heart,
  Image as ImageIcon,
  Trash2,
  FolderArchive,
  BookOpen
} from "lucide-react";
import JSZip from "jszip";
import jsPDF from "jspdf";
import Link from "next/link";
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

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [orderToReset, setOrderToReset] = useState<any>(null);
  const [resetting, setResetting] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);

  const handleResetCustomization = async () => {
    if (!orderToReset) return;
    try {
      setResetting(true);
      const res = await deleteOrderCustomization(orderToReset.id);
      if (res && 'error' in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Customization for ${orderToReset.orderNumber} cleared successfully`);
        setResetConfirmOpen(false);
        setOrderToReset(null);
        setDetailOpen(false);
        loadPersonalizations();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear customization");
    } finally {
      setResetting(false);
    }
  };

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
      const childGender = custom?.section1_childInfo?.gender || custom?.child?.gender || "";
      // Match 'Boy' or 'MALE' for male, 'Girl' or 'FEMALE' for female
      const normalizedGender = childGender.toUpperCase();
      if (genderFilter === "MALE") {
        if (normalizedGender !== "MALE" && normalizedGender !== "BOY") return false;
      } else if (genderFilter === "FEMALE") {
        if (normalizedGender !== "FEMALE" && normalizedGender !== "GIRL") return false;
      } else {
        if (normalizedGender === "MALE" || normalizedGender === "BOY" || normalizedGender === "FEMALE" || normalizedGender === "GIRL") return false;
      }
    }

    // Color Filter
    if (colorFilter !== "ALL") {
      const favColor = custom?.section4_childLoves?.favColor || custom?.preferences?.favColor || "";
      if (!favColor.toLowerCase().includes(colorFilter.toLowerCase())) return false;
    }

    // Search query matches Order Number, Customer Email, Customer Name, Child Name, purchaser email, phone
    const searchLower = searchQuery.toLowerCase();
    const orderNumMatches = item.orderNumber.toLowerCase().includes(searchLower);
    const emailMatches = item.customer.email.toLowerCase().includes(searchLower);
    const purchaserNameMatches = (item.customer.firstName + " " + item.customer.lastName).toLowerCase().includes(searchLower);
    
    const childNameMatches = (custom?.section1_childInfo?.fullName || custom?.child?.fullName || "").toLowerCase().includes(searchLower);
    const purchaserEmailMatches = (custom?.section11_contactDetails?.email || custom?.purchaser?.email || "").toLowerCase().includes(searchLower);
    const purchaserPhoneMatches = (custom?.section11_contactDetails?.telephone || custom?.purchaser?.contact || "").toLowerCase().includes(searchLower);

    return orderNumMatches || emailMatches || purchaserNameMatches || childNameMatches || purchaserEmailMatches || purchaserPhoneMatches;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleDownloadZip = async (order: any) => {
    const custom = parseCustomization(order);
    if (!custom) {
      toast.error("No customization data available for this order.");
      return;
    }

    try {
      setDownloadingZip(order.id);
      toast.info("Preparing ZIP download...");

      const zip = new JSZip();

      // --- Generate PDF spec sheet ---
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Header
      pdf.setFillColor(232, 113, 84); // #E87154
      pdf.rect(0, 0, pageW, 38, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(`MY LOFT STORY spec sheet`, margin, 15);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Order: ${order.orderNumber} • ${custom.personalizationStatus === "SUBMITTED" ? "Submitted" : "Pending"}`, margin, 24);
      pdf.text(`Product: ${order.product?.title || "Personalised Book"}`, margin, 30);
      pdf.text(`Spec Sheet Generated: ${new Date().toLocaleDateString()}`, margin, 35);
      y = 48;

      // Helpers
      const addField = (label: string, value: string) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        pdf.setTextColor(148, 163, 184);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text(label.toUpperCase(), margin, y);
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        
        const lines = pdf.splitTextToSize(value || "N/A", pageW - margin * 2);
        lines.forEach((line: string) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          pdf.text(line, margin, y + 5);
          y += 6;
        });
        y += 8;
      };

      const addSectionHeader = (title: string) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        y += 4;
        pdf.setTextColor(232, 113, 84); // #E87154
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(title.toUpperCase(), margin, y);
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(244, 244, 245);
        pdf.line(margin, y + 2, pageW - margin, y + 2);
        y += 10;
      };

      if (custom.section1_childInfo) {
        // --- SECTION 1 ---
        addSectionHeader("Section 1 — Child Information");
        addField("Child's Full Name", custom.section1_childInfo.fullName);
        addField("Preferred Name / Nickname", custom.section1_childInfo.preferredName || "N/A");
        addField("Age", custom.section1_childInfo.age || "N/A");
        addField("Date of Birth", custom.section1_childInfo.dob ? new Date(custom.section1_childInfo.dob).toLocaleDateString() : "N/A");
        addField("Gender", custom.section1_childInfo.gender);

        // --- SECTION 2 ---
        addSectionHeader("Section 2 — Photos Summary");
        const photosList = [];
        if (custom.section2_photos?.closeUp) photosList.push("Close-up photo (Included)");
        if (custom.section2_photos?.fullLength) photosList.push("Full-length photo (Included)");
        if (custom.section2_photos?.family) photosList.push("Family photo (Included)");
        if (custom.section2_photos?.siblings) photosList.push("Sibling(s) photo (Included)");
        if (custom.section2_photos?.friends) photosList.push("Friend(s) photo (Included)");
        addField("Uploaded Assets", photosList.join("\n") || "No uploads provided");

        // --- SECTION 3 ---
        addSectionHeader("Section 3 — Child's Personality");
        const traits = [...(custom.section3_personality?.traits || [])];
        if (custom.section3_personality?.other) traits.push(`Other: ${custom.section3_personality.other}`);
        addField("Traits", traits.join(", ") || "None selected");

        // --- SECTION 4 ---
        addSectionHeader("Section 4 — What Does Your Child Love?");
        addField("Favourite Colour", custom.section4_childLoves?.favColor || "N/A");
        addField("Favourite Animal", custom.section4_childLoves?.favAnimal || "N/A");
        addField("Favourite Food", custom.section4_childLoves?.favFood || "N/A");
        addField("Favourite Toy", custom.section4_childLoves?.favToy || "N/A");
        addField("Favourite Activity", custom.section4_childLoves?.favActivity || "N/A");
        addField("Favourite Subject", custom.section4_childLoves?.favSubject || "N/A");
        addField("Favourite Place", custom.section4_childLoves?.favPlace || "N/A");

        // --- SECTION 5 ---
        addSectionHeader("Section 5 — Special People to Include");
        addField("Parents", custom.section5_specialPeople?.parents || "N/A");
        addField("Siblings", custom.section5_specialPeople?.siblings || "N/A");
        addField("Grandparents", custom.section5_specialPeople?.grandparents || "N/A");
        addField("Friends", custom.section5_specialPeople?.friends || "N/A");
        addField("Other Special People", custom.section5_specialPeople?.other || "N/A");

        // --- SECTION 6 ---
        addSectionHeader("Section 6 — Theme of the Story");
        const themes = [...(custom.section6_theme?.themes || [])];
        if (custom.section6_theme?.other) themes.push(`Other: ${custom.section6_theme.other}`);
        addField("Selected Themes", themes.join(", ") || "None selected");

        // --- SECTION 7 ---
        addSectionHeader("Section 7 — Life Lesson");
        const lessons = [...(custom.section7_lifeLesson?.lessons || [])];
        if (custom.section7_lifeLesson?.other) lessons.push(`Other: ${custom.section7_lifeLesson.other}`);
        addField("Selected Lessons", lessons.join(", ") || "None selected");

        // --- SECTION 8 ---
        addSectionHeader("Section 8 — Special Memories");
        addField("Special Memories / Stories", custom.section8_specialMemories?.memories || "N/A");

        // --- SECTION 9 ---
        addSectionHeader("Section 9 — Dedication Page");
        addField("Personal Message Included?", custom.section9_dedication?.includeMessage || "No");
        if (custom.section9_dedication?.includeMessage === "Yes") {
          addField("Message Text", custom.section9_dedication.message || "N/A");
        }

        // --- SECTION 10 ---
        addSectionHeader("Section 10 — Book Occasion");
        addField("Book Occasion", custom.section10_bookOccasion?.occasion === "Other" 
          ? `Other: ${custom.section10_bookOccasion.other}` 
          : (custom.section10_bookOccasion?.occasion || "N/A")
        );

        // --- SECTION 11 ---
        addSectionHeader("Section 11 — Contact & Delivery Details");
        addField("Parent Name", custom.section11_contactDetails?.parentName || "N/A");
        addField("Telephone", custom.section11_contactDetails?.telephone || "N/A");
        addField("WhatsApp", custom.section11_contactDetails?.whatsApp || "N/A");
        addField("Email", custom.section11_contactDetails?.email || "N/A");
        addField("Delivery Address", custom.section11_contactDetails?.deliveryAddress || "N/A");

        // --- FINAL QUESTION ---
        addSectionHeader("Final Climax Climax Question");
        addField("One Magical Adventure Wish", custom.finalQuestion || "N/A");

      } else {
        // --- LEGACY FALLBACK ---
        addSectionHeader("Purchaser Details");
        addField("Full Name", custom.purchaser?.fullName || `${order.customer.firstName} ${order.customer.lastName}`);
        addField("Email", custom.purchaser?.email || order.customer.email);
        addField("Phone", custom.purchaser?.contact || order.customer.phoneNumber || "N/A");

        addSectionHeader("Child Profile");
        addField("Full Name", custom.child?.fullName || "Pending");
        addField("Gender", custom.child?.gender || "Pending");
        addField("Date of Birth", custom.child?.dob ? new Date(custom.child.dob).toLocaleDateString() : "Pending");

        addSectionHeader("Story Preferences");
        addField("Favorite Color", custom.preferences?.favColor || "N/A");
        addField("Favorite Food", custom.preferences?.favFood || "N/A");

        if (custom.additionalCharacters && custom.additionalCharacters.length > 0) {
          addSectionHeader("Additional Characters");
          custom.additionalCharacters.forEach((c: any) => {
            addField(`${c.fullName}`, `Relationship: ${c.relationship}`);
          });
        }
      }

      zip.file(`spec-sheet-${order.orderNumber}.pdf`, pdf.output("blob"));

      // --- Fetch and add images ---
      const fetchImage = async (url: string, filename: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
          const blob = await response.blob();
          const contentType = blob.type || "image/jpeg";
          const ext = contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg";
          zip.file(`${filename}${ext}`, blob);
        } catch (err) {
          console.warn(`Could not fetch image: ${filename}`, err);
        }
      };

      const imagePromises: Promise<void>[] = [];

      if (custom.section2_photos) {
        if (custom.section2_photos.closeUp) imagePromises.push(fetchImage(custom.section2_photos.closeUp, "1-closeup-photo"));
        if (custom.section2_photos.fullLength) imagePromises.push(fetchImage(custom.section2_photos.fullLength, "2-fulllength-photo"));
        if (custom.section2_photos.family) imagePromises.push(fetchImage(custom.section2_photos.family, "3-family-photo"));
        if (custom.section2_photos.siblings) imagePromises.push(fetchImage(custom.section2_photos.siblings, "4-siblings-photo"));
        if (custom.section2_photos.friends) imagePromises.push(fetchImage(custom.section2_photos.friends, "5-friends-photo"));
      } else if (custom.photos) {
        if (custom.photos.headshot) imagePromises.push(fetchImage(custom.photos.headshot, "closeup-photo"));
        if (custom.photos.fullBody) imagePromises.push(fetchImage(custom.photos.fullBody, "fulllength-photo"));
      }

      await Promise.all(imagePromises);

      // --- Generate ZIP download ---
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.orderNumber}-customization.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`ZIP downloaded for ${order.orderNumber}`);
    } catch (error) {
      console.error("ZIP generation failed:", error);
      toast.error("Failed to generate ZIP. Please try again.");
    } finally {
      setDownloadingZip(null);
    }
  };

  if (loading && personalizations.length === 0) {
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
        subtitle="Review, search, and manage user submissions for MY LOFT STORY™ Personalised Books"
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
                <option value="MALE">Male / Boy</option>
                <option value="FEMALE">Female / Girl</option>
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
                  const cName = custom?.section1_childInfo?.fullName || custom?.child?.fullName;
                  const cDob = custom?.section1_childInfo?.dob || custom?.child?.dob;
                  const cColor = custom?.section4_childLoves?.favColor || custom?.preferences?.favColor;
                  const cFood = custom?.section4_childLoves?.favFood || custom?.preferences?.favFood;
                  
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
                          <Link href={`/admin/users/${order.customer.id}`} className="font-bold text-slate-800 text-sm truncate max-w-[150px] hover:text-[#E87154] hover:underline transition-colors">{custom?.section11_contactDetails?.parentName || custom?.purchaser?.fullName || `${order.customer.firstName} ${order.customer.lastName}`}</Link>
                          <span className="text-[10px] text-slate-400 font-bold">{custom?.section11_contactDetails?.email || custom?.purchaser?.email || order.customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                          {cName || <span className="text-slate-400 font-medium italic">Not set</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {cDob ? new Date(cDob).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                           className={cn(
                             "text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm whitespace-nowrap",
                             isSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                           )}
                        >
                          {isSubmitted ? <CheckCircle size={10} className="mr-1" /> : <Clock size={10} className="mr-1" />}
                          {isSubmitted ? "Ready" : "Pending Form"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cColor ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-700">{cColor}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-600 truncate max-w-[100px]">
                        {cFood || "—"}
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
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isSubmitted && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all"
                              onClick={() => handleDownloadZip(order)}
                              disabled={downloadingZip === order.id}
                            >
                              {downloadingZip === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
                            onClick={() => {
                              setOrderToReset(order);
                              setResetConfirmOpen(true);
                            }}
                            title="Delete/Reset Customization"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                      <Badge className="bg-white/20 hover:bg-white/35 text-white border-none font-bold text-[8px] uppercase tracking-widest px-2.5 h-6">MY LOFT STORY™ Specification</Badge>
                      <Badge className={cn("border-none font-bold text-[8px] uppercase tracking-widest px-2.5 h-6", isSubmitted ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                        {isSubmitted ? "Ready" : "Pending Form"}
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
                      <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><User size={12} /> Contact Information</h4>
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="text-slate-400 font-medium">Parent Name:</span> <Link href={`/admin/users/${selectedOrder.customer.id}`} className="font-bold hover:text-[#E87154] hover:underline transition-colors">{custom?.section11_contactDetails?.parentName || custom?.purchaser?.fullName || `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`}</Link></p>
                        <p><span className="text-slate-400 font-medium">Email:</span> <span className="font-bold">{custom?.section11_contactDetails?.email || custom?.purchaser?.email || selectedOrder.customer.email}</span></p>
                        <p><span className="text-slate-400 font-medium">Phone:</span> <span className="font-bold">{custom?.section11_contactDetails?.telephone || custom?.purchaser?.contact || selectedOrder.customer.phoneNumber || "N/A"}</span></p>
                      </div>
                    </div>

                    {/* Child details card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Child Profile</h4>
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="text-slate-400 font-medium">Full Name:</span> <span className="font-bold">{custom?.section1_childInfo?.fullName || custom?.child?.fullName || <span className="italic text-slate-400 font-normal">Pending</span>}</span></p>
                        <p><span className="text-slate-400 font-medium">Nickname:</span> <span className="font-bold">{custom?.section1_childInfo?.preferredName || "N/A"}</span></p>
                        <p><span className="text-slate-400 font-medium">Age:</span> <span className="font-bold">{custom?.section1_childInfo?.age || "N/A"}</span></p>
                        <p><span className="text-slate-400 font-medium">D.O.B:</span> <span className="font-bold">{(custom?.section1_childInfo?.dob || custom?.child?.dob) ? new Date(custom?.section1_childInfo?.dob || custom?.child?.dob).toLocaleDateString() : "Pending"}</span></p>
                        <p><span className="text-slate-400 font-medium">Gender:</span> <span className="font-bold uppercase tracking-wider">{custom?.section1_childInfo?.gender || custom?.child?.gender || "Pending"}</span></p>
                      </div>
                    </div>

                  </div>

                  {isSubmitted ? (
                    <>
                      {/* Check if new form style is present */}
                      {custom.section1_childInfo ? (
                        <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
                          
                          {/* Photo references */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={12} /> Photo References</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {[
                                { key: "closeUp" as const, label: "Close-up (Child)" },
                                { key: "fullLength" as const, label: "Full Length (Child)" },
                                { key: "family" as const, label: "Family" },
                                { key: "siblings" as const, label: "Sibling(s)" },
                                { key: "friends" as const, label: "Friend(s)" }
                              ].map(({ key, label }) => {
                                const url = custom.section2_photos?.[key];
                                return url ? (
                                  <div key={key} className="space-y-1 text-center border rounded-xl p-2 bg-stone-50/50">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">{label}</span>
                                    <div className="rounded-lg overflow-hidden bg-slate-100 aspect-square relative flex items-center justify-center shadow-inner">
                                      <img src={url} alt={label} className="w-full h-full object-cover" />
                                    </div>
                                    <a href={url} target="_blank" className="inline-block text-[8px] font-black text-[#E87154] hover:underline uppercase tracking-wider mt-1">Open Link</a>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>

                          {/* Section 3: Child's Personality */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 3 — Personality Traits</h4>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {custom.section3_personality?.traits?.map((trait: string) => (
                                <Badge key={trait} className="bg-[#E87154]/10 text-[#E87154] border-none font-bold text-[9px] hover:bg-[#E87154]/20">{trait}</Badge>
                              ))}
                              {custom.section3_personality?.other && (
                                <Badge className="bg-stone-100 text-stone-700 border-none font-bold text-[9px]">Other: {custom.section3_personality.other}</Badge>
                              )}
                            </div>
                          </div>

                          {/* Section 4: What Child Loves */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 4 — What Does Child Love?</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                              <div>
                                <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Colour</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves?.favColor}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Animal</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves?.favAnimal}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Food</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves?.favFood}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Toy</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves?.favToy}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Activity</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves?.favActivity}</span>
                              </div>
                              {custom.section4_childLoves?.favSubject && (
                                <div>
                                  <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Subject</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves.favSubject}</span>
                                </div>
                              )}
                              {custom.section4_childLoves?.favPlace && (
                                <div>
                                  <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Favourite Place</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{custom.section4_childLoves.favPlace}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Section 5: Special People */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 5 — Special People to Include</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {custom.section5_specialPeople?.parents && (
                                <p><span className="text-slate-400 font-medium">Parents:</span> <span className="font-bold">{custom.section5_specialPeople.parents}</span></p>
                              )}
                              {custom.section5_specialPeople?.siblings && (
                                <p><span className="text-slate-400 font-medium">Siblings:</span> <span className="font-bold">{custom.section5_specialPeople.siblings}</span></p>
                              )}
                              {custom.section5_specialPeople?.grandparents && (
                                <p><span className="text-slate-400 font-medium">Grandparents:</span> <span className="font-bold">{custom.section5_specialPeople.grandparents}</span></p>
                              )}
                              {custom.section5_specialPeople?.friends && (
                                <p><span className="text-slate-400 font-medium">Friends:</span> <span className="font-bold">{custom.section5_specialPeople.friends}</span></p>
                              )}
                              {custom.section5_specialPeople?.other && (
                                <p><span className="text-slate-400 font-medium">Other Special:</span> <span className="font-bold">{custom.section5_specialPeople.other}</span></p>
                              )}
                            </div>
                          </div>

                          {/* Section 6 & 7: Themes & Lessons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                              <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 6 — Story Themes</h4>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {custom.section6_theme?.themes?.map((t: string) => (
                                  <Badge key={t} className="bg-[#E87154]/10 text-[#E87154] border-none font-bold text-[9px] hover:bg-[#E87154]/20">{t}</Badge>
                                ))}
                                {custom.section6_theme?.other && (
                                  <Badge className="bg-stone-100 text-stone-700 border-none font-bold text-[9px]">Other: {custom.section6_theme.other}</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                              <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 7 — Life Lessons</h4>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {custom.section7_lifeLesson?.lessons?.map((l: string) => (
                                  <Badge key={l} className="bg-[#E87154]/10 text-[#E87154] border-none font-bold text-[9px] hover:bg-[#E87154]/20">{l}</Badge>
                                ))}
                                {custom.section7_lifeLesson?.other && (
                                  <Badge className="bg-stone-100 text-stone-700 border-none font-bold text-[9px]">Other: {custom.section7_lifeLesson.other}</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Section 8 & 9: Memories & Dedication */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 8 — Special Memories</h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-1 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{custom.section8_specialMemories?.memories}</p>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 9 — Dedication Message ({custom.section9_dedication?.includeMessage === "Yes" ? "Yes" : "No"})</h4>
                            {custom.section9_dedication?.includeMessage === "Yes" ? (
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-1 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">"{custom.section9_dedication.message}"</p>
                            ) : (
                              <p className="text-slate-400 italic pt-1 text-[11px]">No personal message requested.</p>
                            )}
                          </div>

                          {/* Section 10 & 11: Occasion & Contact */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                              <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Section 10 — Book Occasion</h4>
                              <p className="font-bold text-slate-800 dark:text-slate-100 pt-1">
                                {custom.section10_bookOccasion?.occasion === "Other" 
                                  ? `Other: ${custom.section10_bookOccasion.other}` 
                                  : custom.section10_bookOccasion?.occasion
                                }
                              </p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                              <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">WhatsApp Contact</h4>
                              <p className="font-bold text-slate-800 dark:text-slate-100 pt-1">{custom.section11_contactDetails?.whatsApp || "N/A"}</p>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider">Delivery Details</h4>
                            <span className="text-slate-400 font-medium block text-[9px] uppercase tracking-wider">Address:</span>
                            <span className="font-bold block bg-white p-3 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap leading-relaxed">{custom.section11_contactDetails?.deliveryAddress}</span>
                          </div>

                          {/* Climax Final Question */}
                          <div className="p-4 bg-orange-50/50 dark:bg-slate-800 rounded-xl space-y-2 border border-orange-100">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1"><BookOpen size={12} /> CLIMAX MAGICAL ADVENTURE</h4>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-bold pt-1 bg-white p-3 rounded-lg border border-orange-100/50 whitespace-pre-wrap">"{custom.finalQuestion}"</p>
                          </div>

                        </div>
                      ) : (
                        // Render Legacy Form Structure View
                        <>
                          <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                            <h4 className="text-[10px] font-black text-[#E87154] uppercase tracking-wider flex items-center gap-1.5"><Heart size={12} /> Custom Story Preferences (Legacy)</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 font-medium">Favorite Color</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{custom.preferences?.favColor}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Favorite Food</span>
                                <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{custom.preferences?.favFood}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={12} /> Reference Photograph Files</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {custom.photos?.headshot && (
                                <div className="space-y-1.5 text-center">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Child Headshot</span>
                                  <div className="border border-stone-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square relative max-h-48 flex items-center justify-center shadow-inner">
                                    <img src={custom.photos?.headshot} alt="Headshot" className="w-full h-full object-cover" />
                                  </div>
                                  <a href={custom.photos?.headshot} target="_blank" className="inline-block text-[10px] font-black text-[#E87154] hover:underline uppercase tracking-wider mt-1.5">Open Full Resolution</a>
                                </div>
                              )}
                              {custom.photos?.fullBody && (
                                <div className="space-y-1.5 text-center">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Child Full Body</span>
                                  <div className="border border-stone-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square relative max-h-48 flex items-center justify-center shadow-inner">
                                    <img src={custom.photos?.fullBody} alt="Full body" className="w-full h-full object-cover" />
                                  </div>
                                  <a href={custom.photos?.fullBody} target="_blank" className="inline-block text-[10px] font-black text-[#E87154] hover:underline uppercase tracking-wider mt-1.5">Open Full Resolution</a>
                                </div>
                              )}
                            </div>
                          </div>

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
                    
                    <div className="flex gap-3 w-full sm:w-auto items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setOrderToReset(selectedOrder);
                          setResetConfirmOpen(true);
                        }}
                        className="h-11 w-11 rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center shrink-0"
                        title="Delete/Reset Customization"
                      >
                        <Trash2 size={18} />
                      </Button>
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
                          onClick={() => handleDownloadZip(selectedOrder)}
                          disabled={downloadingZip === selectedOrder.id}
                          className="flex-1 sm:flex-none h-11 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black text-white px-6 gap-2 shadow-lg shadow-[#E87154]/25"
                        >
                          {downloadingZip === selectedOrder.id ? <Loader2 size={16} className="animate-spin" /> : <FolderArchive size={16} />}
                          {downloadingZip === selectedOrder.id ? "Preparing..." : "Download ZIP"}
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

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Delete Customization</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
              Are you sure you want to delete the customization data for order <span className="font-bold text-slate-700">{orderToReset?.orderNumber}</span>? 
              This will clear all submitted preferences, images, and child information, and revert the order status back to pending. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button
              variant="outline"
              disabled={resetting}
              onClick={() => {
                setResetConfirmOpen(false);
                setOrderToReset(null);
              }}
              className="flex-1 rounded-xl font-bold h-11 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              disabled={resetting}
              onClick={handleResetCustomization}
              className="flex-1 rounded-xl font-black h-11 bg-red-500 hover:bg-red-600 text-white border-none shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
            >
              {resetting ? <Loader2 size={16} className="animate-spin" /> : "Delete Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
