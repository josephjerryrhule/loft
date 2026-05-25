"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrderForCustomization, submitOrderCustomization } from "@/app/actions/personalization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  User, 
  Calendar, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Plus, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Check,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface AdditionalCharacter {
  fullName: string;
  relationship: string;
}

export default function PersonalizationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  
  // Form Steps
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  // Section 1: Order Placed By
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserContact, setPurchaserContact] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");

  // Section 2: Child Information
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [childGender, setChildGender] = useState("");

  // Section 3: preferences
  const [favColor, setFavColor] = useState("");
  const [favFood, setFavFood] = useState("");

  // Section 4: Photo uploads
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [headshotUploading, setHeadshotUploading] = useState(false);
  const [fullBodyUrl, setFullBodyUrl] = useState("");
  const [fullBodyUploading, setFullBodyUploading] = useState(false);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);

  // Section 5: Additional Characters
  const [additionalCharacters, setAdditionalCharacters] = useState<AdditionalCharacter[]>([
    { fullName: "", relationship: "" }
  ]);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error("No Order ID provided.");
      router.push("/customer/orders");
      return;
    }
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await getOrderForCustomization(orderId!);
      setOrder(data);
      
      // Pre-fill Section 1
      setPurchaserName(`${data.customer.firstName} ${data.customer.lastName}`.trim());
      setPurchaserEmail(data.customer.email);
      setPurchaserContact(data.customer.phoneNumber);

      // Pre-fill with existing customization data if available (e.g. if they are editing)
      if (data.customizationData) {
        try {
          const parsed = JSON.parse(data.customizationData);
          if (parsed.purchaser) {
            setPurchaserName(parsed.purchaser.fullName || "");
            setPurchaserContact(parsed.purchaser.contact || "");
            setPurchaserEmail(parsed.purchaser.email || "");
          }
          if (parsed.child) {
            setChildName(parsed.child.fullName || "");
            setChildDob(parsed.child.dob || "");
            setChildGender(parsed.child.gender || "");
          }
          if (parsed.preferences) {
            setFavColor(parsed.preferences.favColor || "");
            setFavFood(parsed.preferences.favFood || "");
          }
          if (parsed.photos) {
            setHeadshotUrl(parsed.photos.headshot || "");
            setFullBodyUrl(parsed.photos.fullBody || "");
          }
          if (parsed.additionalCharacters) {
            setAdditionalCharacters(parsed.additionalCharacters.length > 0 
              ? parsed.additionalCharacters 
              : [{ fullName: "", relationship: "" }]
            );
          }
        } catch (e) {
          console.error("Error parsing existing customizationData:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order details.");
      router.push("/customer/orders");
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "headshot" | "fullBody") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file only.");
      return;
    }

    if (type === "headshot") setHeadshotUploading(true);
    else setFullBodyUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `birthday-book-${orderId}`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (type === "headshot") {
        setHeadshotUrl(data.url);
        toast.success("Child headshot uploaded successfully!");
      } else {
        setFullBodyUrl(data.url);
        toast.success("Child full body photo uploaded successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      if (type === "headshot") setHeadshotUploading(false);
      else setFullBodyUploading(false);
    }
  };

  const addCharacter = () => {
    if (additionalCharacters.length >= 3) {
      toast.warning("You can add up to 3 additional characters.");
      return;
    }
    setAdditionalCharacters([...additionalCharacters, { fullName: "", relationship: "" }]);
  };

  const removeCharacter = (index: number) => {
    const list = [...additionalCharacters];
    list.splice(index, 1);
    setAdditionalCharacters(list.length > 0 ? list : [{ fullName: "", relationship: "" }]);
  };

  const updateCharacter = (index: number, field: keyof AdditionalCharacter, value: string) => {
    const list = [...additionalCharacters];
    list[index][field] = value;
    setAdditionalCharacters(list);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!purchaserName.trim()) {
        toast.error("Purchaser name is required.");
        return false;
      }
      if (!purchaserEmail.trim()) {
        toast.error("Purchaser email is required.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!childName.trim()) {
        toast.error("Child's full name is required.");
        return false;
      }
      if (!childDob) {
        toast.error("Child's date of birth is required.");
        return false;
      }
      if (!childGender) {
        toast.error("Child's gender is required.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!favColor.trim()) {
        toast.error("Favorite color is required.");
        return false;
      }
      if (!favFood.trim()) {
        toast.error("Favorite food is required.");
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (!headshotUrl) {
        toast.error("Child's headshot photo is required.");
        return false;
      }
      if (!fullBodyUrl) {
        toast.error("Child's full body photo is required.");
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    // Validate Step 5 character inputs (allow empty array if not filled out, but filter out half-empty items)
    const validCharacters = additionalCharacters.filter(c => c.fullName.trim() && c.relationship.trim());

    setSubmitting(true);
    try {
      const payload = {
        personalizationStatus: "SUBMITTED",
        purchaser: {
          fullName: purchaserName,
          contact: purchaserContact,
          email: purchaserEmail
        },
        child: {
          fullName: childName,
          dob: childDob,
          gender: childGender
        },
        preferences: {
          favColor: favColor,
          favFood: favFood
        },
        photos: {
          headshot: headshotUrl,
          fullBody: fullBodyUrl
        },
        additionalCharacters: validCharacters
      };

      const result = await submitOrderCustomization(orderId!, JSON.stringify(payload));
      if (result.success) {
        setSubmitted(true);
        toast.success("Birthday Book personalization submitted successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit personalization. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFFAF5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
          <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Configuring personalizer...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFAF5] p-4 sm:p-6 animate-in fade-in duration-500">
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="bg-[#E87154] p-10 text-white text-center relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Sparkles size={120} />
            </div>
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-white stroke-[3px]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Onboarding Completed!</h1>
            <p className="text-white/80 font-medium mt-2 max-w-sm mx-auto text-sm">
              We have successfully locked in your book personalization details.
            </p>
          </div>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-[#E87154] flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">Review & Print Queue</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    Our design team is reviewing your child's headshot and full body photos. If we need a clearer image, we will contact you directly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-[#E87154] flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">Production Started</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    Once photos are approved, we compile the illustrations, personalize the narrative with details, and route it to print.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => router.push("/customer/orders")}
                className="flex-1 bg-[#E87154] hover:bg-[#D66144] font-black h-12 rounded-xl text-white shadow-xl shadow-[#E87154]/20 transition-all active:scale-95"
              >
                Track My Orders
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/products")}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Go back to Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#E87154]">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fulfillment Required</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalize Your Book</h1>
            <p className="text-sm text-stone-500 font-medium">
              Order: <span className="font-bold text-slate-800">{order?.orderNumber}</span> &bull; {order?.product.title}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-stone-100 shrink-0">
            <span className="text-xs font-black text-stone-400 uppercase tracking-wider">Step</span>
            <span className="font-black text-lg text-[#E87154]">{step}</span>
            <span className="text-stone-300 font-bold">/</span>
            <span className="font-bold text-slate-500">{totalSteps}</span>
          </div>
        </div>

        {/* Steps Progress Indicator */}
        <div className="relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[3px] bg-stone-200 -z-10 rounded-full" />
          <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] bg-[#E87154] -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
          <div className="flex justify-between items-center">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <button
                  key={stepNum}
                  onClick={() => {
                    if (stepNum < step) setStep(stepNum);
                  }}
                  disabled={stepNum > step}
                  className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center transition-all ${
                    isActive 
                      ? "bg-[#E87154] text-white ring-4 ring-[#E87154]/20 scale-110 shadow-md"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-400 border border-stone-200 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3px]" /> : stepNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content Card */}
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-6 sm:p-10">
            
            {/* Step 1: Order Placed By */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="text-[#E87154]" size={20} /> Purchaser Contact Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Provide the purchaser contact details so we can keep you updated on the book production and shipping progress.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchaserName" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Full Name</Label>
                    <Input
                      id="purchaserName"
                      value={purchaserName}
                      onChange={(e) => setPurchaserName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaserEmail" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Email Address</Label>
                      <Input
                        id="purchaserEmail"
                        type="email"
                        value={purchaserEmail}
                        onChange={(e) => setPurchaserEmail(e.target.value)}
                        placeholder="jane@example.com"
                        required
                        className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaserContact" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Contact Phone Number</Label>
                      <Input
                        id="purchaserContact"
                        value={purchaserContact}
                        onChange={(e) => setPurchaserContact(e.target.value)}
                        placeholder="+233..."
                        className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Child Information */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="text-[#E87154]" size={20} /> Child's Information
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This forms the basis of the birthday book story. Make sure the name is typed exactly as it should appear in the print.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="childName" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Child's Full Name</Label>
                    <Input
                      id="childName"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Ama Serwaa"
                      required
                      className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="childDob" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Date of Birth</Label>
                      <div className="relative">
                        <Input
                          id="childDob"
                          type="date"
                          value={childDob}
                          onChange={(e) => setChildDob(e.target.value)}
                          required
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="childGender" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Child's Gender</Label>
                      <Select value={childGender} onValueChange={setChildGender}>
                        <SelectTrigger className="h-12 bg-stone-50 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-4 text-slate-800">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
                          <SelectItem value="MALE" className="font-bold py-2.5 rounded-xl cursor-pointer">Male</SelectItem>
                          <SelectItem value="FEMALE" className="font-bold py-2.5 rounded-xl cursor-pointer">Female</SelectItem>
                          <SelectItem value="OTHER" className="font-bold py-2.5 rounded-xl cursor-pointer">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Story Preferences */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Heart className="text-[#E87154]" size={20} /> Story Preferences
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Help us customize the story details. What does the child love? We incorporate these details into the story illustrations.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="favColor" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Child's Favorite Color</Label>
                    <Input
                      id="favColor"
                      value={favColor}
                      onChange={(e) => setFavColor(e.target.value)}
                      placeholder="e.g. Yellow, Bright Blue"
                      required
                      className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="favFood" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Child's Favorite Food</Label>
                    <Input
                      id="favFood"
                      value={favFood}
                      onChange={(e) => setFavFood(e.target.value)}
                      placeholder="e.g. Jollof Rice, Pizza"
                      required
                      className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Photo Uploads */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ImageIcon className="text-[#E87154]" size={20} /> Photo Uploads (Requires Images)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Upload clear photos of the child. These photos are used by our illustration team to capture their features in the book.
                  </p>
                </div>

                {/* Guidelines */}
                <div className="bg-[#FFF8F6] p-5 rounded-2xl border border-[#E87154]/20 space-y-2">
                  <span className="text-[9px] font-black uppercase text-[#E87154] tracking-widest flex items-center gap-1.5">
                    <AlertCircle size={12} /> Image Quality Guidelines
                  </span>
                  <ul className="text-xs text-stone-600 font-medium space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Use a <b>clear, high-resolution photo</b> taken in good lighting (outdoors or in a bright room).</li>
                    <li>Ensure the child is <b>facing forward directly</b> towards the camera.</li>
                    <li>Avoid photos with hats, sunglasses, pacifiers, or blurry motion.</li>
                    <li>Do not crop or use screenshot images. Only upload direct camera shots.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  
                  {/* Headshot Upload */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                      1. Child's Headshot Photo <span className="text-[#E87154]">*</span>
                    </Label>
                    <input
                      ref={headshotInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "headshot")}
                    />
                    {headshotUrl ? (
                      <div className="relative group border rounded-2xl overflow-hidden aspect-square max-h-56 bg-slate-50 flex items-center justify-center shadow-inner">
                        <Image
                          src={headshotUrl}
                          alt="Child headshot"
                          width={224}
                          height={224}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => setHeadshotUrl("")}
                            className="rounded-full"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !headshotUploading && headshotInputRef.current?.click()}
                        className={`aspect-square max-h-56 border-2 border-dashed border-stone-200 hover:border-[#E87154]/30 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-stone-50/50 transition-all ${
                          headshotUploading ? "opacity-60 cursor-wait" : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                          {headshotUploading ? (
                            <Loader2 className="animate-spin text-[#E87154]" size={20} />
                          ) : (
                            <Upload size={20} />
                          )}
                        </div>
                        <div className="text-center px-4">
                          <p className="text-xs font-bold text-slate-800">Upload Headshot</p>
                          <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">PNG, JPG or WEBP</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Body Upload */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                      2. Child's Full Body Photo <span className="text-[#E87154]">*</span>
                    </Label>
                    <input
                      ref={fullBodyInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "fullBody")}
                    />
                    {fullBodyUrl ? (
                      <div className="relative group border rounded-2xl overflow-hidden aspect-square max-h-56 bg-slate-50 flex items-center justify-center shadow-inner">
                        <Image
                          src={fullBodyUrl}
                          alt="Child full body"
                          width={224}
                          height={224}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => setFullBodyUrl("")}
                            className="rounded-full"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !fullBodyUploading && fullBodyInputRef.current?.click()}
                        className={`aspect-square max-h-56 border-2 border-dashed border-stone-200 hover:border-[#E87154]/30 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-stone-50/50 transition-all ${
                          fullBodyUploading ? "opacity-60 cursor-wait" : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                          {fullBodyUploading ? (
                            <Loader2 className="animate-spin text-[#E87154]" size={20} />
                          ) : (
                            <Upload size={20} />
                          )}
                        </div>
                        <div className="text-center px-4">
                          <p className="text-xs font-bold text-slate-800">Upload Full Body</p>
                          <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1">PNG, JPG or WEBP</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Step 5: Additional Characters */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="text-[#E87154]" size={20} /> Additional Story Characters (Optional)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You can feature up to <b>3 additional people</b> in the book's story (e.g. Mother, Father, Friend, Sibling).
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {additionalCharacters.map((char, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-end p-5 bg-stone-50 rounded-2xl border border-stone-100 relative group/char">
                      <div className="flex-1 w-full space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Character Full Name</Label>
                        <Input
                          value={char.fullName}
                          onChange={(e) => updateCharacter(index, "fullName", e.target.value)}
                          placeholder="e.g. Papa Jerry"
                          className="h-11 bg-white border-none rounded-xl font-bold shadow-sm px-4"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Relationship to Child</Label>
                        <Input
                          value={char.relationship}
                          onChange={(e) => updateCharacter(index, "relationship", e.target.value)}
                          placeholder="e.g. Sibling, Mother, Sitter"
                          className="h-11 bg-white border-none rounded-xl font-bold shadow-sm px-4"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCharacter(index)}
                        className="h-11 w-11 rounded-xl text-slate-400 hover:text-red-500 shrink-0 bg-white shadow-sm hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}

                  {additionalCharacters.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCharacter}
                      className="w-full h-12 rounded-2xl border-dashed border-2 border-stone-200 hover:border-[#E87154]/40 font-black gap-2 hover:bg-stone-50"
                    >
                      <Plus size={16} /> Add Another Character ({additionalCharacters.length}/3)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-10 mt-10 border-t flex flex-row gap-4 justify-between items-center">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className="h-12 rounded-xl px-6 text-slate-400 hover:text-slate-800 font-bold gap-1.5 transition-all"
                  disabled={submitting}
                >
                  <ChevronLeft size={18} /> Back
                </Button>
              ) : (
                <div /> // spacer
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-slate-900 hover:bg-black font-black text-white h-12 rounded-xl px-8 gap-1.5 transition-all shadow-lg shadow-slate-900/10"
                >
                  Next <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#E87154] hover:bg-[#D66144] font-black text-white h-12 rounded-xl px-10 transition-all shadow-xl shadow-[#E87154]/25"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4 text-white" /> Submitting...
                    </>
                  ) : (
                    "Complete Personalization"
                  )}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
