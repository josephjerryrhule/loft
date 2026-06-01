"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrderForCustomization, submitOrderCustomization } from "@/app/actions/personalization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  User, 
  Calendar, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
  Smile,
  Compass,
  Gift,
  Phone,
  MapPin,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const personalityOptions = [
  "Kind", "Funny", "Adventurous", "Caring", "Brave", 
  "Curious", "Creative", "Confident", "Shy", "Intelligent", 
  "Energetic", "Helpful", "Imaginative", "Gentle", "Determined"
];

const themeOptions = [
  "Adventure", "Magical", "Princess", "Superhero", "Nature", 
  "Animals", "Sports", "Travel", "Friendship", "Mystery", 
  "Space", "Leadership", "Confidence", "African Culture", "Fantasy"
];

const lessonOptions = [
  "Confidence", "Courage", "Kindness", "Honesty", "Resilience", 
  "Friendship", "Leadership", "Gratitude", "Self-Belief", 
  "Responsibility", "Hard Work", "Respect"
];

const occasionOptions = [
  "Birthday", "Graduation", "Christmas", "School Achievement", 
  "Confidence Gift", "Special Occasion", "Just Because"
];

export default function PersonalizationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role || "CUSTOMER";
  const ordersLink = userRole === "PARENT" ? "/parent/orders" : "/customer/orders";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  
  // Form Steps
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // --- FORM STATES ---
  
  // Section 1: Child Information
  const [childName, setChildName] = useState("");
  const [childNickname, setChildNickname] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childDob, setChildDob] = useState("");
  const [childGender, setChildGender] = useState("");

  // Section 2: Photos
  const [photoUrls, setPhotoUrls] = useState({
    closeUp: "",
    fullLength: "",
    family: "",
    siblings: "",
    friends: ""
  });
  const [uploadingStates, setUploadingStates] = useState({
    closeUp: false,
    fullLength: false,
    family: false,
    siblings: false,
    friends: false
  });

  const closeUpInputRef = useRef<HTMLInputElement>(null);
  const fullLengthInputRef = useRef<HTMLInputElement>(null);
  const familyInputRef = useRef<HTMLInputElement>(null);
  const siblingsInputRef = useRef<HTMLInputElement>(null);
  const friendsInputRef = useRef<HTMLInputElement>(null);

  // Section 3: Child's Personality
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [otherTrait, setOtherTrait] = useState("");

  // Section 4: What Does Your Child Love?
  const [favColor, setFavColor] = useState("");
  const [favAnimal, setFavAnimal] = useState("");
  const [favFood, setFavFood] = useState("");
  const [favToy, setFavToy] = useState("");
  const [favActivity, setFavActivity] = useState("");
  const [favSubject, setFavSubject] = useState("");
  const [favPlace, setFavPlace] = useState("");

  // Section 5: Special People to Include
  const [specialPeople, setSpecialPeople] = useState({
    parents: "",
    siblings: "",
    grandparents: "",
    friends: "",
    other: ""
  });

  // Section 6: Theme of the Story
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [otherTheme, setOtherTheme] = useState("");

  // Section 7: Life Lesson
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [otherLesson, setOtherLesson] = useState("");

  // Section 8: Special Memories
  const [specialMemories, setSpecialMemories] = useState("");

  // Section 9: Dedication Page
  const [includeDedication, setIncludeDedication] = useState<"Yes" | "No" | "">("");
  const [dedicationMessage, setDedicationMessage] = useState("");

  // Section 10: Book Occasion
  const [bookOccasion, setBookOccasion] = useState("");
  const [otherOccasion, setOtherOccasion] = useState("");

  // Section 11: Contact Details
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserContact, setPurchaserContact] = useState("");
  const [whatsAppContact, setWhatsAppContact] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Final Question
  const [magicalAdventure, setMagicalAdventure] = useState("");

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error("No Order ID provided.");
      router.push(ordersLink);
      return;
    }
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await getOrderForCustomization(orderId!);
      setOrder(data);
      
      // Default Contact Details from session if available
      setPurchaserName(`${data.customer.firstName} ${data.customer.lastName}`.trim());
      setPurchaserEmail(data.customer.email);
      setPurchaserContact(data.customer.phoneNumber);

      // Pre-fill with existing customization data if available
      if (data.customizationData) {
        try {
          const parsed = JSON.parse(data.customizationData);

          // Section 1: Child Info
          if (parsed.section1_childInfo) {
            setChildName(parsed.section1_childInfo.fullName || "");
            setChildNickname(parsed.section1_childInfo.preferredName || "");
            setChildAge(parsed.section1_childInfo.age || "");
            setChildDob(parsed.section1_childInfo.dob || "");
            setChildGender(parsed.section1_childInfo.gender || "");
          } else if (parsed.child) {
            // fallback to legacy child data
            setChildName(parsed.child.fullName || "");
            setChildDob(parsed.child.dob || "");
            setChildGender(parsed.child.gender === "MALE" ? "Boy" : parsed.child.gender === "FEMALE" ? "Girl" : "");
          }

          // Section 2: Photos
          if (parsed.section2_photos) {
            setPhotoUrls({
              closeUp: parsed.section2_photos.closeUp || "",
              fullLength: parsed.section2_photos.fullLength || "",
              family: parsed.section2_photos.family || "",
              siblings: parsed.section2_photos.siblings || "",
              friends: parsed.section2_photos.friends || ""
            });
          } else if (parsed.photos) {
            // fallback to legacy photos
            setPhotoUrls({
              closeUp: parsed.photos.headshot || "",
              fullLength: parsed.photos.fullBody || "",
              family: "",
              siblings: "",
              friends: ""
            });
          }

          // Section 3: Child's Personality
          if (parsed.section3_personality) {
            setSelectedTraits(parsed.section3_personality.traits || []);
            setOtherTrait(parsed.section3_personality.other || "");
          }

          // Section 4: What Does Your Child Love?
          if (parsed.section4_childLoves) {
            setFavColor(parsed.section4_childLoves.favColor || "");
            setFavAnimal(parsed.section4_childLoves.favAnimal || "");
            setFavFood(parsed.section4_childLoves.favFood || "");
            setFavToy(parsed.section4_childLoves.favToy || "");
            setFavActivity(parsed.section4_childLoves.favActivity || "");
            setFavSubject(parsed.section4_childLoves.favSubject || "");
            setFavPlace(parsed.section4_childLoves.favPlace || "");
          } else if (parsed.preferences) {
            // fallback to legacy preferences
            setFavColor(parsed.preferences.favColor || "");
            setFavFood(parsed.preferences.favFood || "");
          }

          // Section 5: Special People
          if (parsed.section5_specialPeople) {
            setSpecialPeople(parsed.section5_specialPeople);
          } else if (parsed.additionalCharacters) {
            // fallback mapping of legacy additional characters
            const parentsList: string[] = [];
            const siblingsList: string[] = [];
            const friendsList: string[] = [];
            const othersList: string[] = [];
            parsed.additionalCharacters.forEach((char: any) => {
              const rel = (char.relationship || "").toLowerCase();
              if (rel.includes("parent") || rel.includes("mother") || rel.includes("father") || rel.includes("mom") || rel.includes("dad")) {
                parentsList.push(char.fullName);
              } else if (rel.includes("sibling") || rel.includes("brother") || rel.includes("sister")) {
                siblingsList.push(char.fullName);
              } else if (rel.includes("friend")) {
                friendsList.push(char.fullName);
              } else {
                othersList.push(`${char.fullName} (${char.relationship})`);
              }
            });
            setSpecialPeople({
              parents: parentsList.join(", "),
              siblings: siblingsList.join(", "),
              grandparents: "",
              friends: friendsList.join(", "),
              other: othersList.join(", ")
            });
          }

          // Section 6: Story Themes
          if (parsed.section6_theme) {
            setSelectedThemes(parsed.section6_theme.themes || []);
            setOtherTheme(parsed.section6_theme.other || "");
          }

          // Section 7: Life Lessons
          if (parsed.section7_lifeLesson) {
            setSelectedLessons(parsed.section7_lifeLesson.lessons || []);
            setOtherLesson(parsed.section7_lifeLesson.other || "");
          }

          // Section 8: Special Memories
          if (parsed.section8_specialMemories) {
            setSpecialMemories(parsed.section8_specialMemories.memories || "");
          }

          // Section 9: Dedication Page
          if (parsed.section9_dedication) {
            setIncludeDedication(parsed.section9_dedication.includeMessage || "");
            setDedicationMessage(parsed.section9_dedication.message || "");
          }

          // Section 10: Book Occasion
          if (parsed.section10_bookOccasion) {
            setBookOccasion(parsed.section10_bookOccasion.occasion || "");
            setOtherOccasion(parsed.section10_bookOccasion.other || "");
          }

          // Section 11: Contact Details
          if (parsed.section11_contactDetails) {
            setPurchaserName(parsed.section11_contactDetails.parentName || "");
            setPurchaserContact(parsed.section11_contactDetails.telephone || "");
            setWhatsAppContact(parsed.section11_contactDetails.whatsApp || "");
            setPurchaserEmail(parsed.section11_contactDetails.email || "");
            setDeliveryAddress(parsed.section11_contactDetails.deliveryAddress || "");
          } else if (parsed.purchaser) {
            // fallback to legacy contact details
            setPurchaserName(parsed.purchaser.fullName || "");
            setPurchaserContact(parsed.purchaser.contact || "");
            setPurchaserEmail(parsed.purchaser.email || "");
          }

          // Final Question
          if (parsed.finalQuestion) {
            setMagicalAdventure(parsed.finalQuestion || "");
          }
        } catch (e) {
          console.error("Error parsing existing customizationData:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order details.");
      router.push(ordersLink);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof photoUrls) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file only.");
      return;
    }

    setUploadingStates(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `my-loft-story-${orderId}`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setPhotoUrls(prev => ({ ...prev, [key]: data.url }));
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const removePhoto = (key: keyof typeof photoUrls) => {
    setPhotoUrls(prev => ({ ...prev, [key]: "" }));
    toast.success("Photo removed.");
  };

  const getInputRef = (key: string) => {
    switch (key) {
      case "closeUp": return closeUpInputRef;
      case "fullLength": return fullLengthInputRef;
      case "family": return familyInputRef;
      case "siblings": return siblingsInputRef;
      case "friends": return friendsInputRef;
      default: return null;
    }
  };

  const validateStep = () => {
    if (step === 1) {
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
      if (!photoUrls.closeUp) {
        toast.error("Close-up photo of the child is recommended & required to generate illustration features.");
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (selectedTraits.length === 0 && !otherTrait.trim()) {
        toast.error("Please select or type at least one personality trait.");
        return false;
      }
      if (!favColor.trim()) {
        toast.error("Favorite color is required.");
        return false;
      }
      if (!favAnimal.trim()) {
        toast.error("Favorite animal is required.");
        return false;
      }
      if (!favFood.trim()) {
        toast.error("Favorite food is required.");
        return false;
      }
      if (!favToy.trim()) {
        toast.error("Favorite toy is required.");
        return false;
      }
      if (!favActivity.trim()) {
        toast.error("Favorite activity is required.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (selectedThemes.length === 0 && !otherTheme.trim()) {
        toast.error("Please select or specify at least one story theme.");
        return false;
      }
      if (selectedLessons.length === 0 && !otherLesson.trim()) {
        toast.error("Please select or specify at least one life lesson.");
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!specialMemories.trim()) {
        toast.error("Special memories text is required.");
        return false;
      }
      if (!includeDedication) {
        toast.error("Please specify if you want a dedication message.");
        return false;
      }
      if (includeDedication === "Yes" && !dedicationMessage.trim()) {
        toast.error("Dedication message text is required.");
        return false;
      }
      if (!bookOccasion) {
        toast.error("Please select a book occasion.");
        return false;
      }
      if (bookOccasion === "Other" && !otherOccasion.trim()) {
        toast.error("Please specify the other book occasion.");
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
    if (!purchaserName.trim()) {
      toast.error("Parent name is required.");
      return;
    }
    if (!purchaserContact.trim()) {
      toast.error("Parent telephone is required.");
      return;
    }
    if (!purchaserEmail.trim()) {
      toast.error("Parent email is required.");
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error("Delivery address is required.");
      return;
    }
    if (!magicalAdventure.trim()) {
      toast.error("Magical adventure field is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        personalizationStatus: "SUBMITTED",
        
        // Legacy Compatibility Mapping
        purchaser: {
          fullName: purchaserName,
          contact: purchaserContact,
          email: purchaserEmail
        },
        child: {
          fullName: childName,
          dob: childDob,
          gender: childGender === "Boy" ? "MALE" : childGender === "Girl" ? "FEMALE" : "OTHER"
        },
        preferences: {
          favColor: favColor,
          favFood: favFood
        },
        photos: {
          headshot: photoUrls.closeUp,
          fullBody: photoUrls.fullLength
        },
        additionalCharacters: [
          ...(specialPeople.parents ? [{ fullName: specialPeople.parents, relationship: "Parents" }] : []),
          ...(specialPeople.siblings ? [{ fullName: specialPeople.siblings, relationship: "Siblings" }] : []),
          ...(specialPeople.friends ? [{ fullName: specialPeople.friends, relationship: "Friends" }] : [])
        ].slice(0, 3),

        // New Detailed Questionnaire Sections
        section1_childInfo: {
          fullName: childName,
          preferredName: childNickname,
          age: childAge,
          dob: childDob,
          gender: childGender
        },
        section2_photos: {
          closeUp: photoUrls.closeUp,
          fullLength: photoUrls.fullLength,
          family: photoUrls.family,
          siblings: photoUrls.siblings,
          friends: photoUrls.friends
        },
        section3_personality: {
          traits: selectedTraits,
          other: otherTrait
        },
        section4_childLoves: {
          favColor,
          favAnimal,
          favFood,
          favToy,
          favActivity,
          favSubject,
          favPlace
        },
        section5_specialPeople: {
          parents: specialPeople.parents,
          siblings: specialPeople.siblings,
          grandparents: specialPeople.grandparents,
          friends: specialPeople.friends,
          other: specialPeople.other
        },
        section6_theme: {
          themes: selectedThemes,
          other: otherTheme
        },
        section7_lifeLesson: {
          lessons: selectedLessons,
          other: otherLesson
        },
        section8_specialMemories: {
          memories: specialMemories
        },
        section9_dedication: {
          includeMessage: includeDedication,
          message: includeDedication === "Yes" ? dedicationMessage : ""
        },
        section10_bookOccasion: {
          occasion: bookOccasion,
          other: otherOccasion
        },
        section11_contactDetails: {
          parentName: purchaserName,
          telephone: purchaserContact,
          whatsApp: whatsAppContact,
          email: purchaserEmail,
          deliveryAddress: deliveryAddress
        },
        finalQuestion: magicalAdventure
      };

      const result = await submitOrderCustomization(orderId!, JSON.stringify(payload));
      if (result.success) {
        setSubmitted(true);
        toast.success("MY LOFT STORY™ personalization details submitted successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit personalization details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFFAF5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
          <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Loading MY LOFT STORY™ Questionnaire...</p>
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
              Your MY LOFT STORY™ details are safely stored! We are now working on bringing your personalized book to life.
            </p>
          </div>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-[#E87154] flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">Artwork Review</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    Our team is reviewing the child's photographs. If any photo needs to be clearer for illustration likeness, we will reach out.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-[#E87154] flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">Book Assembly & Printing</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    Once illustrations are confirmed, we inject your custom text, lessons, occasion, and memories into the printing pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => router.push(ordersLink)}
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

  const renderSectionHeader = (title: string, subtitle: string) => (
    <div className="space-y-1 pb-4 border-b border-stone-100 mb-6">
      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
        <BookOpen className="text-[#E87154]" size={18} />
        {title}
      </h3>
      <p className="text-xs text-slate-400 font-medium leading-relaxed">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFAF5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#E87154]">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] font-sans">MY LOFT STORY™</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalised Book Questionnaire</h1>
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
        <div className="relative" aria-label="Progress Tracker">
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
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "w-9 h-9 rounded-full font-black text-sm flex items-center justify-center transition-all",
                    isActive 
                      ? "bg-[#E87154] text-white ring-4 ring-[#E87154]/20 scale-110 shadow-md"
                      : isCompleted
                      ? "bg-emerald-500 text-white cursor-pointer"
                      : "bg-white text-slate-400 border border-stone-200 cursor-not-allowed"
                  )}
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
            
            {/* STEP 1: CHILD INFO & PHOTOS (SECTIONS 1 & 2) */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 1 — CHILD INFORMATION */}
                <div className="space-y-4">
                  {renderSectionHeader("SECTION 1 — Child Information", "Primary baseline details for printing the story text.")}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="childName" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                        Child's Full Name <span className="text-[#E87154]">*</span>
                      </Label>
                      <Input
                        id="childName"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="e.g. Jerry Jerry Jerry"
                        required
                        className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="childNickname" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Preferred Name / Nickname
                        </Label>
                        <Input
                          id="childNickname"
                          value={childNickname}
                          onChange={(e) => setChildNickname(e.target.value)}
                          placeholder="e.g. Jerry Jr."
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="childAge" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Age
                        </Label>
                        <Input
                          id="childAge"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          placeholder="e.g. 5 or Five"
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="childDob" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Date of Birth <span className="text-[#E87154]">*</span>
                        </Label>
                        <Input
                          id="childDob"
                          type="date"
                          value={childDob}
                          onChange={(e) => setChildDob(e.target.value)}
                          required
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Gender <span className="text-[#E87154]">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3 h-12">
                          {["Boy", "Girl"].map(gender => {
                            const isSel = childGender === gender;
                            return (
                              <button
                                key={gender}
                                type="button"
                                onClick={() => setChildGender(gender)}
                                className={cn(
                                  "h-full rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 text-sm",
                                  isSel 
                                    ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10" 
                                    : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-600"
                                )}
                              >
                                {isSel && <Check size={14} className="stroke-[3px]" />}
                                {gender}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — PHOTOS */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 2 — Photos", "Upload references for custom illustration mapping. All photos except Close-up are optional.")}
                  
                  {/* Photo Guidelines */}
                  <div className="bg-[#FFF8F6] p-5 rounded-2xl border border-[#E87154]/25 space-y-2 flex items-start gap-3">
                    <AlertCircle size={20} className="text-[#E87154] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-black uppercase text-[#E87154] tracking-wider block">
                        Illustration Reference Guidelines
                      </span>
                      <ul className="text-[11px] text-stone-600 font-medium space-y-1 list-disc pl-4 leading-relaxed">
                        <li>Upload a <b>sharp, forward-facing, well-lit close-up</b> (headshot) of your child.</li>
                        <li>Avoid screenshot images, filters, glasses, hats, or pacifiers.</li>
                        <li>Optional photos are used to customize posture, background, and extra characters.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Grid of uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {[
                      { key: "closeUp" as const, label: "Close-up Photo of Child", desc: "(Recommended & Required)", required: true },
                      { key: "fullLength" as const, label: "Full-length Photo of Child", desc: "(Optional)", required: false },
                      { key: "family" as const, label: "Family Photo", desc: "(Optional)", required: false },
                      { key: "siblings" as const, label: "Photo of Special Sibling(s)", desc: "(Optional)", required: false },
                      { key: "friends" as const, label: "Photo of Special Friend(s)", desc: "(Optional)", required: false }
                    ].map(({ key, label, desc, required }) => {
                      const url = photoUrls[key];
                      const uploading = uploadingStates[key];
                      const ref = getInputRef(key);
                      
                      return (
                        <div key={key} className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">
                            {label} {required && <span className="text-[#E87154]">*</span>} <span className="text-[9px] font-normal text-slate-400 normal-case">{desc}</span>
                          </Label>
                          <input
                            ref={ref}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, key)}
                          />
                          
                          {url ? (
                            <div className="relative group border border-stone-200 rounded-2xl overflow-hidden aspect-[4/3] bg-stone-50 flex items-center justify-center shadow-inner">
                              <img
                                src={url}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removePhoto(key)}
                                  className="rounded-full shadow-lg"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => !uploading && ref?.current?.click()}
                              className={cn(
                                "aspect-[4/3] border-2 border-dashed border-stone-200 hover:border-[#E87154]/30 rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-stone-50/50 transition-all",
                                uploading ? "opacity-60 cursor-wait" : ""
                              )}
                            >
                              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                                {uploading ? (
                                  <Loader2 className="animate-spin text-[#E87154]" size={18} />
                                ) : (
                                  <Upload size={18} />
                                )}
                              </div>
                              <div className="text-center px-4">
                                <p className="text-xs font-bold text-slate-700">Upload Photo</p>
                                <p className="text-[8px] text-stone-400 uppercase tracking-widest mt-0.5">PNG, JPG or WEBP</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONALITY & LOVES (SECTIONS 3 & 4) */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 3 — CHILD’S PERSONALITY */}
                <div className="space-y-4">
                  {renderSectionHeader("SECTION 3 — Child's Personality", "Select personality traits to shade the tone of story dialogue (multiple selections allowed).")}
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {personalityOptions.map((trait) => {
                        const isSelected = selectedTraits.includes(trait);
                        return (
                          <button
                            key={trait}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTraits(prev => prev.filter(t => t !== trait));
                              } else {
                                setSelectedTraits(prev => [...prev, trait]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                              isSelected
                                ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                                : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                            )}
                          >
                            {isSelected && <Check size={12} className="stroke-[3px]" />}
                            {trait}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const isSelected = selectedTraits.includes("Other");
                          if (isSelected) {
                            setSelectedTraits(prev => prev.filter(t => t !== "Other"));
                          } else {
                            setSelectedTraits(prev => [...prev, "Other"]);
                          }
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                          selectedTraits.includes("Other")
                            ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                            : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        {selectedTraits.includes("Other") && <Check size={12} className="stroke-[3px]" />}
                        Other
                      </button>
                    </div>

                    {selectedTraits.includes("Other") && (
                      <div className="mt-4 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="otherTrait" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Describe other personality trait(s)</Label>
                        <Input
                          id="otherTrait"
                          value={otherTrait}
                          onChange={(e) => setOtherTrait(e.target.value)}
                          placeholder="e.g. Very patient, loves to hum melodies..."
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4 — WHAT DOES YOUR CHILD LOVE? */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 4 — What Does Your Child Love?", "These specific items are referenced in illustrations and script dialog.")}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: "favColor", val: favColor, set: setFavColor, label: "Favourite Colour", placeholder: "e.g. Bright Orange", required: true },
                      { id: "favAnimal", val: favAnimal, set: setFavAnimal, label: "Favourite Animal", placeholder: "e.g. Lion cub", required: true },
                      { id: "favFood", val: favFood, set: setFavFood, label: "Favourite Food", placeholder: "e.g. Jollof Rice", required: true },
                      { id: "favToy", val: favToy, set: setFavToy, label: "Favourite Toy", placeholder: "e.g. Lego blocks", required: true },
                      { id: "favActivity", val: favActivity, set: setFavActivity, label: "Favourite Activity", placeholder: "e.g. Swimming", required: true },
                      { id: "favSubject", val: favSubject, set: setFavSubject, label: "Favourite Subject", placeholder: "e.g. Fine Art (Optional)", required: false },
                      { id: "favPlace", val: favPlace, set: setFavPlace, label: "Favourite Place", placeholder: "e.g. The playground (Optional)", required: false },
                    ].map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          {field.label} {field.required && <span className="text-[#E87154]">*</span>}
                        </Label>
                        <Input
                          id={field.id}
                          value={field.val}
                          onChange={(e) => field.set(e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SPECIAL PEOPLE & THEMES (SECTIONS 5, 6 & 7) */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 5 — SPECIAL PEOPLE TO INCLUDE */}
                <div className="space-y-4">
                  {renderSectionHeader("SECTION 5 — Special People to Include", "List special people you want mentioned or included in the story illustrations.")}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "parents", label: "Parents", placeholder: "e.g. Jerry & Ama" },
                      { key: "siblings", label: "Siblings", placeholder: "e.g. Kojo & Esi" },
                      { key: "grandparents", label: "Grandparents", placeholder: "e.g. Nana Kofi" },
                      { key: "friends", label: "Friends", placeholder: "e.g. Yao, Kofi, Kojo" },
                      { key: "other", label: "Other Special People", placeholder: "e.g. Auntie Mary" }
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`spec-${field.key}`} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          {field.label}
                        </Label>
                        <Input
                          id={`spec-${field.key}`}
                          value={(specialPeople as any)[field.key]}
                          onChange={(e) => setSpecialPeople({ ...specialPeople, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 6 — THEME OF THE STORY */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 6 — Theme of the Story", "Select story themes for your adventure book (multiple selections allowed).")}
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {themeOptions.map((theme) => {
                        const isSelected = selectedThemes.includes(theme);
                        return (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedThemes(prev => prev.filter(t => t !== theme));
                              } else {
                                setSelectedThemes(prev => [...prev, theme]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                              isSelected
                                ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                                : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                            )}
                          >
                            {isSelected && <Check size={12} className="stroke-[3px]" />}
                            {theme}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const isSelected = selectedThemes.includes("Other");
                          if (isSelected) {
                            setSelectedThemes(prev => prev.filter(t => t !== "Other"));
                          } else {
                            setSelectedThemes(prev => [...prev, "Other"]);
                          }
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                          selectedThemes.includes("Other")
                            ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                            : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        {selectedThemes.includes("Other") && <Check size={12} className="stroke-[3px]" />}
                        Other
                      </button>
                    </div>

                    {selectedThemes.includes("Other") && (
                      <div className="mt-4 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="otherTheme" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Describe other theme</Label>
                        <Input
                          id="otherTheme"
                          value={otherTheme}
                          onChange={(e) => setOtherTheme(e.target.value)}
                          placeholder="e.g. Undersea exploration..."
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 7 — LIFE LESSON */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 7 — Life Lesson", "Select core value messages you want woven into the narrative (multiple selections allowed).")}
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {lessonOptions.map((lesson) => {
                        const isSelected = selectedLessons.includes(lesson);
                        return (
                          <button
                            key={lesson}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedLessons(prev => prev.filter(l => l !== lesson));
                              } else {
                                setSelectedLessons(prev => [...prev, lesson]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                              isSelected
                                ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                                : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                            )}
                          >
                            {isSelected && <Check size={12} className="stroke-[3px]" />}
                            {lesson}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const isSelected = selectedLessons.includes("Other");
                          if (isSelected) {
                            setSelectedLessons(prev => prev.filter(l => l !== "Other"));
                          } else {
                            setSelectedLessons(prev => [...prev, "Other"]);
                          }
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                          selectedLessons.includes("Other")
                            ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                            : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        {selectedLessons.includes("Other") && <Check size={12} className="stroke-[3px]" />}
                        Other
                      </button>
                    </div>

                    {selectedLessons.includes("Other") && (
                      <div className="mt-4 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="otherLesson" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Describe other life lesson</Label>
                        <Input
                          id="otherLesson"
                          value={otherLesson}
                          onChange={(e) => setOtherLesson(e.target.value)}
                          placeholder="e.g. Caring for nature, sharing toys..."
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: MEMORIES, DEDICATION & OCCASION (SECTIONS 8, 9 & 10) */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 8 — SPECIAL MEMORIES */}
                <div className="space-y-4">
                  {renderSectionHeader("SECTION 8 — Special Memories", "Tell us something special about your child so we can personalize script anecdotes.")}
                  
                  <div className="space-y-4">
                    <div className="bg-[#FFFFAF]/20 p-5 rounded-2xl border border-amber-200/50 space-y-1 text-xs text-stone-600 font-medium">
                      <p className="font-bold text-stone-800 flex items-center gap-1.5 mb-1"><Smile size={14} className="text-amber-500" /> Ideas to get you started:</p>
                      <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                        <li>A proud moment (e.g., when they learned to ride a bike)</li>
                        <li>A funny story or unique quirk (e.g., how they love hiding keys)</li>
                        <li>Something they always say or a funny dream they shared</li>
                        <li>Something unique about their personality or habits</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialMemories" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                        Tell us something special about your child <span className="text-[#E87154]">*</span>
                      </Label>
                      <Textarea
                        id="specialMemories"
                        value={specialMemories}
                        onChange={(e) => setSpecialMemories(e.target.value)}
                        placeholder="Write details here..."
                        rows={4}
                        required
                        className="bg-stone-50 border-none rounded-2xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 py-3 text-slate-800 text-[16px]"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 9 — DEDICATION PAGE */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 9 — Dedication Page", "Personalized message printed on the book cover/dedication page.")}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                        Would you like a personal message included? <span className="text-[#E87154]">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3 h-12">
                        {["Yes", "No"].map((option) => {
                          const isSel = includeDedication === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setIncludeDedication(option as "Yes" | "No")}
                              className={cn(
                                "h-full rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 text-sm",
                                isSel 
                                  ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10" 
                                  : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-600"
                              )}
                            >
                              {isSel && <Check size={14} className="stroke-[3px]" />}
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {includeDedication === "Yes" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="dedicationMessage" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Write your message below <span className="text-[#E87154]">*</span>
                        </Label>
                        <Textarea
                          id="dedicationMessage"
                          value={dedicationMessage}
                          onChange={(e) => setDedicationMessage(e.target.value)}
                          placeholder="e.g. To our lovely daughter, you will always be our princess. Happy Birthday, we love you!"
                          rows={3}
                          required
                          className="bg-stone-50 border-none rounded-2xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 py-3 text-slate-800 text-[16px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 10 — BOOK OCCASION */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  {renderSectionHeader("SECTION 10 — Book Occasion", "What occasion is this book commemorating?")}
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {occasionOptions.map((occ) => {
                        const isSelected = bookOccasion === occ;
                        return (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => setBookOccasion(occ)}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                              isSelected
                                ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                                : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                            )}
                          >
                            {isSelected && <Check size={12} className="stroke-[3px]" />}
                            {occ}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setBookOccasion("Other")}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95",
                          bookOccasion === "Other"
                            ? "bg-[#E87154] text-white border-[#E87154] shadow-md shadow-[#E87154]/10"
                            : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        {bookOccasion === "Other" && <Check size={12} className="stroke-[3px]" />}
                        Other
                      </button>
                    </div>

                    {bookOccasion === "Other" && (
                      <div className="mt-4 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="otherOccasion" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Describe other occasion</Label>
                        <Input
                          id="otherOccasion"
                          value={otherOccasion}
                          onChange={(e) => setOtherOccasion(e.target.value)}
                          placeholder="e.g. Naming Ceremony, Baptism..."
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: CONTACT DETAILS & FINAL ADVENTURE (SECTION 11 & FINAL QUESTION) */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 11 — CONTACT DETAILS */}
                <div className="space-y-4">
                  {renderSectionHeader("SECTION 11 — Contact Details", "Your contact details so we can coordinate book draft reviews, production updates, and shipping.")}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaserName" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                        Parent / Contact Full Name <span className="text-[#E87154]">*</span>
                      </Label>
                      <Input
                        id="purchaserName"
                        value={purchaserName}
                        onChange={(e) => setPurchaserName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        autoComplete="name"
                        className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchaserEmail" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Email Address <span className="text-[#E87154]">*</span>
                        </Label>
                        <Input
                          id="purchaserEmail"
                          type="email"
                          value={purchaserEmail}
                          onChange={(e) => setPurchaserEmail(e.target.value)}
                          placeholder="jane@example.com"
                          required
                          autoComplete="email"
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchaserContact" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          Telephone Number <span className="text-[#E87154]">*</span>
                        </Label>
                        <Input
                          id="purchaserContact"
                          type="tel"
                          value={purchaserContact}
                          onChange={(e) => setPurchaserContact(e.target.value)}
                          placeholder="+233 24 000 0000"
                          required
                          autoComplete="tel"
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-1">
                        <Label htmlFor="whatsAppContact" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                          WhatsApp Number (Optional)
                        </Label>
                        <Input
                          id="whatsAppContact"
                          value={whatsAppContact}
                          onChange={(e) => setWhatsAppContact(e.target.value)}
                          placeholder="e.g. Same as above"
                          className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 text-slate-800 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                        Delivery Address <span className="text-[#E87154]">*</span>
                      </Label>
                      <Textarea
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House Number, Street Name, Suburb/Town, City, Country"
                        rows={3}
                        required
                        autoComplete="street-address"
                        className="bg-stone-50 border-none rounded-2xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 py-3 text-slate-800 text-[16px]"
                      />
                    </div>
                  </div>
                </div>

                {/* FINAL QUESTION */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="space-y-1 pb-4 border-b border-stone-100 mb-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Compass className="text-[#E87154]" size={18} />
                      FINAL QUESTION
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      This is the peak climax point. If your child could go anywhere or have any magical adventure, describe it below!
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="magicalAdventure" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">
                      If your child could have one magical adventure, what would it be? <span className="text-[#E87154]">*</span>
                    </Label>
                    <Textarea
                      id="magicalAdventure"
                      value={magicalAdventure}
                      onChange={(e) => setMagicalAdventure(e.target.value)}
                      placeholder="e.g. Flying on a friendly dragon to an island made of candy to help a sad princess find her lost key..."
                      rows={4}
                      required
                      className="bg-stone-50 border-none rounded-2xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4 py-3 text-slate-800 text-[16px]"
                    />
                  </div>
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
                  className="h-12 rounded-xl px-6 text-slate-400 hover:text-slate-800 font-bold gap-1.5 transition-all text-sm"
                  disabled={submitting}
                >
                  <ChevronLeft size={18} /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-slate-900 hover:bg-black font-black text-white h-12 rounded-xl px-8 gap-1.5 transition-all shadow-lg shadow-slate-900/10 text-sm"
                >
                  Next <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#E87154] hover:bg-[#D66144] font-black text-white h-12 rounded-xl px-10 transition-all shadow-xl shadow-[#E87154]/25 text-sm"
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

        {/* Footer Copy */}
        <div className="text-center pt-8 pb-12 space-y-2 border-t border-stone-200/50 mt-12 animate-in fade-in duration-500">
          <p className="text-sm font-black tracking-wider text-slate-800 uppercase">
            Thank you for choosing MY LOFT STORY™
          </p>
          <p className="text-xs italic text-stone-500 max-w-lg mx-auto leading-relaxed">
            "Because every child deserves to see themselves as the hero of their own story."
          </p>
        </div>

      </div>
    </div>
  );
}
