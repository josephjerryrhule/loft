"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitApplication } from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Western North", "Oti"
];

const PREVIOUS_ROLES_OPTIONS = [
  "Teacher", "Teaching Assistant", "Childcare Provider", "Sunday School Teacher",
  "Camp Facilitator", "Children's Entertainer", "Reading Club Facilitator", "Other", "None of the Above"
];

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(16, "Must be at least 16 years old"),
  gender: z.enum(["MALE", "FEMALE", "PREFER_NOT_TO_SAY"], { message: "Please select a gender" }),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  residentialArea: z.string().min(1, "Residential area is required"),
  townCity: z.string().min(1, "Town/City is required"),
  region: z.string().min(1, "Region is required"),
  highestEducation: z.enum(["SHS", "DIPLOMA", "HND", "BACHELORS", "MASTERS", "OTHER"], { message: "Please select your highest education" }),
  institution: z.string().optional().or(z.literal("")),
  course: z.string().optional().or(z.literal("")),
  workedWithChildren: z.boolean({ message: "Please answer this question" }),
  childrenExperienceDesc: z.string().optional().or(z.literal("")),
  previousRoles: z.array(z.string()).min(1, "Select at least one option"),
  relevantExperience: z.string().optional().or(z.literal("")),
  groupSpeakingComfort: z.enum(["VERY_COMFORTABLE", "COMFORTABLE", "SOMEWHAT_COMFORTABLE", "NOT_COMFORTABLE"], { message: "Please select your comfort level" }),
  ledGroupActivity: z.boolean({ message: "Please answer this question" }),
  groupActivityDesc: z.string().optional().or(z.literal("")),
  whatMakesLearningFun: z.string().min(10, "Please provide a more detailed response"),
  engagementSkills: z.string().min(10, "Please provide a more detailed response"),
  whyFacilitator: z.string().min(10, "Please provide a more detailed response"),
  strengths: z.string().min(10, "Please provide a more detailed response"),
  problemSolvingExample: z.string().min(10, "Please provide a more detailed response"),
  auditionUnderstood: z.literal(true, { message: "You must acknowledge the audition requirement" }),
  willingToTravel: z.literal(true, { message: "You must be willing to travel to the audition venue" }),
  declarationAgreed: z.literal(true, { message: "You must agree to the declaration" }),
  declarationName: z.string().min(2, "Full name is required"),
  declarationDate: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: "personal", title: "Personal Information", fields: ["fullName", "dateOfBirth", "age", "gender", "phoneNumber", "whatsappNumber", "email", "residentialArea", "townCity", "region"] },
  { id: "education", title: "Education", fields: ["highestEducation", "institution", "course"] },
  { id: "experience", title: "Experience", fields: ["workedWithChildren", "childrenExperienceDesc", "previousRoles", "relevantExperience"] },
  { id: "communication", title: "Communication", fields: ["groupSpeakingComfort", "ledGroupActivity", "groupActivityDesc", "whatMakesLearningFun", "engagementSkills"] },
  { id: "short_answers", title: "Short Answers", fields: ["whyFacilitator", "strengths", "problemSolvingExample"] },
  { id: "audition", title: "Audition Info", fields: ["auditionUnderstood", "willingToTravel"] },
  { id: "declaration", title: "Declaration", fields: ["declarationAgreed", "declarationName", "declarationDate"] },
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workedWithChildren: false,
      ledGroupActivity: false,
      previousRoles: [],
      declarationDate: new Date().toISOString().split("T")[0],
    },
    mode: "onTouched",
  });

  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

  const dateOfBirth = watch("dateOfBirth");
  const workedWithChildren = watch("workedWithChildren");
  const ledGroupActivity = watch("ledGroupActivity");

  // Auto-calculate age
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setValue("dateOfBirth", dob);
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setValue("age", age);
      trigger("age");
    }
  };

  const nextStep = async () => {
    const fields = STEPS[currentStep].fields as any[];
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitApplication(data);
      if (res.success && res.applicantId) {
        router.push(`/recruitment/payment?id=${res.applicantId}`);
      } else {
        setSubmitError(res.error || "Failed to submit application");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#E87154] rounded-full z-0 transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>
          {STEPS.map((step, index) => (
            <div 
              key={step.id} 
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold bg-white transition-colors duration-300 ${
                index <= currentStep ? "border-[#E87154] text-[#E87154]" : "border-slate-200 text-slate-400"
              }`}
            >
              {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-sm font-bold text-[#E87154]">
          {STEPS[currentStep].title}
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900">
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Fields marked with (*) are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 pb-8 space-y-6">
            {submitError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {submitError}
              </div>
            )}

            {/* SECTION 1: Personal Info */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full Name *</Label>
                  <Controller name="fullName" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Enter your full name" className="h-12 rounded-xl" />
                  )} />
                  {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={dateOfBirth || ""} onChange={handleDobChange} className="h-12 rounded-xl" />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Controller name="age" control={control} render={({ field }) => (
                    <Input {...field} type="number" readOnly className="h-12 rounded-xl bg-slate-50" />
                  )} />
                  {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Gender *</Label>
                  <Controller name="gender" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white">
                        <RadioGroupItem value="MALE" id="gender-male" />
                        <Label htmlFor="gender-male" className="font-medium cursor-pointer">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white">
                        <RadioGroupItem value="FEMALE" id="gender-female" />
                        <Label htmlFor="gender-female" className="font-medium cursor-pointer">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white">
                        <RadioGroupItem value="PREFER_NOT_TO_SAY" id="gender-other" />
                        <Label htmlFor="gender-other" className="font-medium cursor-pointer">Prefer not to say</Label>
                      </div>
                    </RadioGroup>
                  )} />
                  {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Controller name="phoneNumber" control={control} render={({ field }) => (
                    <Input {...field} placeholder="024XXXXXXX" className="h-12 rounded-xl" />
                  )} />
                  {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>WhatsApp Number *</Label>
                  <Controller name="whatsappNumber" control={control} render={({ field }) => (
                    <Input {...field} placeholder="024XXXXXXX" className="h-12 rounded-xl" />
                  )} />
                  {errors.whatsappNumber && <p className="text-red-500 text-xs">{errors.whatsappNumber.message}</p>}
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email Address</Label>
                  <Controller name="email" control={control} render={({ field }) => (
                    <Input {...field} type="email" placeholder="e.g. john@example.com" className="h-12 rounded-xl" />
                  )} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Residential Area *</Label>
                  <Controller name="residentialArea" control={control} render={({ field }) => (
                    <Input {...field} placeholder="e.g. East Legon" className="h-12 rounded-xl" />
                  )} />
                  {errors.residentialArea && <p className="text-red-500 text-xs">{errors.residentialArea.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Town/City *</Label>
                  <Controller name="townCity" control={control} render={({ field }) => (
                    <Input {...field} placeholder="e.g. Accra" className="h-12 rounded-xl" />
                  )} />
                  {errors.townCity && <p className="text-red-500 text-xs">{errors.townCity.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Region *</Label>
                  <Controller name="region" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {GHANA_REGIONS.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.region && <p className="text-red-500 text-xs">{errors.region.message}</p>}
                </div>
              </div>
            )}

            {/* SECTION 2: Education */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Highest Level of Education Completed *</Label>
                  <Controller name="highestEducation" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHS">SHS</SelectItem>
                        <SelectItem value="DIPLOMA">Diploma</SelectItem>
                        <SelectItem value="HND">HND</SelectItem>
                        <SelectItem value="BACHELORS">Bachelor's Degree</SelectItem>
                        <SelectItem value="MASTERS">Master's Degree</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.highestEducation && <p className="text-red-500 text-xs">{errors.highestEducation.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Institution Attended</Label>
                  <Controller name="institution" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Optional" className="h-12 rounded-xl" />
                  )} />
                </div>
                
                <div className="space-y-2">
                  <Label>Course/Program Studied</Label>
                  <Controller name="course" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Optional" className="h-12 rounded-xl" />
                  )} />
                </div>
              </div>
            )}

            {/* SECTION 3: Experience */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label>Have you worked with children before? *</Label>
                  <Controller name="workedWithChildren" control={control} render={({ field }) => (
                    <RadioGroup 
                      onValueChange={(val) => field.onChange(val === "true")} 
                      defaultValue={field.value === undefined ? undefined : String(field.value)} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="true" id="worked-yes" />
                        <Label htmlFor="worked-yes" className="font-medium cursor-pointer w-full">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="false" id="worked-no" />
                        <Label htmlFor="worked-no" className="font-medium cursor-pointer w-full">No</Label>
                      </div>
                    </RadioGroup>
                  )} />
                  {errors.workedWithChildren && <p className="text-red-500 text-xs">{errors.workedWithChildren.message}</p>}
                </div>
                
                {workedWithChildren && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Please describe your experience with children</Label>
                    <Controller name="childrenExperienceDesc" control={control} render={({ field }) => (
                      <Textarea {...field} className="min-h-[100px] rounded-xl resize-none" placeholder="Briefly describe what you did..." />
                    )} />
                  </div>
                )}
                
                <div className="space-y-4">
                  <Label>Have you ever worked in any of the following roles? (Select all that apply) *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Controller name="previousRoles" control={control} render={({ field }) => (
                      <>
                        {PREVIOUS_ROLES_OPTIONS.map((role) => (
                          <div key={role} className="flex items-center space-x-3 border rounded-xl p-3 bg-white hover:bg-slate-50 transition-colors">
                            <Checkbox 
                              id={`role-${role}`}
                              checked={field.value?.includes(role)}
                              onCheckedChange={(checked) => {
                                const newValue = checked 
                                  ? [...(field.value || []), role]
                                  : (field.value || []).filter((v) => v !== role);
                                field.onChange(newValue);
                              }}
                            />
                            <Label htmlFor={`role-${role}`} className="flex-1 cursor-pointer font-medium leading-none">{role}</Label>
                          </div>
                        ))}
                      </>
                    )} />
                  </div>
                  {errors.previousRoles && <p className="text-red-500 text-xs">{errors.previousRoles.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Please describe any relevant experience</Label>
                  <Controller name="relevantExperience" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[100px] rounded-xl resize-none" placeholder="Optional details..." />
                  )} />
                </div>
              </div>
            )}

            {/* SECTION 4: Communication */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label>How comfortable are you speaking in front of groups? *</Label>
                  <Controller name="groupSpeakingComfort" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: "VERY_COMFORTABLE", label: "Very Comfortable" },
                        { value: "COMFORTABLE", label: "Comfortable" },
                        { value: "SOMEWHAT_COMFORTABLE", label: "Somewhat Comfortable" },
                        { value: "NOT_COMFORTABLE", label: "Not Comfortable" },
                      ].map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white">
                          <RadioGroupItem value={opt.value} id={`comfort-${opt.value}`} />
                          <Label htmlFor={`comfort-${opt.value}`} className="font-medium cursor-pointer w-full">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )} />
                  {errors.groupSpeakingComfort && <p className="text-red-500 text-xs">{errors.groupSpeakingComfort.message}</p>}
                </div>
                
                <div className="space-y-4">
                  <Label>Have you ever led a group activity before? *</Label>
                  <Controller name="ledGroupActivity" control={control} render={({ field }) => (
                    <RadioGroup 
                      onValueChange={(val) => field.onChange(val === "true")} 
                      defaultValue={field.value === undefined ? undefined : String(field.value)} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="true" id="led-yes" />
                        <Label htmlFor="led-yes" className="font-medium cursor-pointer w-full">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="false" id="led-no" />
                        <Label htmlFor="led-no" className="font-medium cursor-pointer w-full">No</Label>
                      </div>
                    </RadioGroup>
                  )} />
                  {errors.ledGroupActivity && <p className="text-red-500 text-xs">{errors.ledGroupActivity.message}</p>}
                </div>
                
                {ledGroupActivity && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Briefly describe the activity</Label>
                    <Controller name="groupActivityDesc" control={control} render={({ field }) => (
                      <Textarea {...field} className="min-h-[100px] rounded-xl resize-none" placeholder="What kind of activity did you lead?" />
                    )} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>What do you think makes learning fun for children? *</Label>
                  <Controller name="whatMakesLearningFun" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[120px] rounded-xl resize-none" placeholder="Share your thoughts..." />
                  )} />
                  {errors.whatMakesLearningFun && <p className="text-red-500 text-xs">{errors.whatMakesLearningFun.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>What experience, skills, or qualities do you have that would help you engage and manage a group of children effectively? *</Label>
                  <Controller name="engagementSkills" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[120px] rounded-xl resize-none" placeholder="Describe your relevant qualities..." />
                  )} />
                  {errors.engagementSkills && <p className="text-red-500 text-xs">{errors.engagementSkills.message}</p>}
                </div>
              </div>
            )}

            {/* SECTION 5: Short Answers */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Why do you want to become a LOFT Reading Club Facilitator? *</Label>
                  <Controller name="whyFacilitator" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[120px] rounded-xl resize-none" />
                  )} />
                  {errors.whyFacilitator && <p className="text-red-500 text-xs">{errors.whyFacilitator.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>What strengths would you bring to this role? *</Label>
                  <Controller name="strengths" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[120px] rounded-xl resize-none" />
                  )} />
                  {errors.strengths && <p className="text-red-500 text-xs">{errors.strengths.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Describe a situation where you had to think quickly and solve a problem. *</Label>
                  <Controller name="problemSolvingExample" control={control} render={({ field }) => (
                    <Textarea {...field} className="min-h-[120px] rounded-xl resize-none" placeholder="Share a specific example..." />
                  )} />
                  {errors.problemSolvingExample && <p className="text-red-500 text-xs">{errors.problemSolvingExample.message}</p>}
                </div>
              </div>
            )}

            {/* SECTION 6: Audition Info */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base">Have you read and understood that successful applicants will be required to attend a physical audition? *</Label>
                  <Controller name="auditionUnderstood" control={control} render={({ field }) => (
                    <RadioGroup 
                      onValueChange={(val) => field.onChange(val === "true")} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="true" id="audition-yes" />
                        <Label htmlFor="audition-yes" className="font-medium cursor-pointer w-full">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="false" id="audition-no" />
                        <Label htmlFor="audition-no" className="font-medium cursor-pointer w-full">No</Label>
                      </div>
                    </RadioGroup>
                  )} />
                  {errors.auditionUnderstood && <p className="text-red-500 text-xs">{errors.auditionUnderstood.message}</p>}
                </div>
                
                <div className="space-y-4">
                  <Label className="text-base">Are you willing to travel to the audition venue if shortlisted? *</Label>
                  <Controller name="willingToTravel" control={control} render={({ field }) => (
                    <RadioGroup 
                      onValueChange={(val) => field.onChange(val === "true")} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="true" id="travel-yes" />
                        <Label htmlFor="travel-yes" className="font-medium cursor-pointer w-full">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl px-4 py-3 bg-white w-full">
                        <RadioGroupItem value="false" id="travel-no" />
                        <Label htmlFor="travel-no" className="font-medium cursor-pointer w-full">No</Label>
                      </div>
                    </RadioGroup>
                  )} />
                  {errors.willingToTravel && <p className="text-red-500 text-xs">{errors.willingToTravel.message}</p>}
                </div>
              </div>
            )}

            {/* SECTION 7: Declaration */}
            {currentStep === 6 && (
              <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-4 text-sm text-slate-700 font-medium">
                  <p>I confirm that the information provided in this application is accurate and complete.</p>
                  <p>I understand that a <strong>GHC 100 Application & Assessment Fee</strong> is required as part of the recruitment process, that the fee is non-refundable, and that submission of this form does not guarantee selection.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 pt-2">
                    <Controller name="declarationAgreed" control={control} render={({ field }) => (
                      <Checkbox 
                        id="declaration-agree" 
                        className="mt-1 w-5 h-5"
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )} />
                    <div className="space-y-1">
                      <Label htmlFor="declaration-agree" className="font-bold cursor-pointer text-base text-slate-900">
                        I Agree *
                      </Label>
                      {errors.declarationAgreed && <p className="text-red-500 text-xs">{errors.declarationAgreed.message}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <Label>Full Name (Signature) *</Label>
                      <Controller name="declarationName" control={control} render={({ field }) => (
                        <Input {...field} placeholder="Type your full name" className="h-12 rounded-xl bg-white" />
                      )} />
                      {errors.declarationName && <p className="text-red-500 text-xs">{errors.declarationName.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Controller name="declarationDate" control={control} render={({ field }) => (
                        <Input {...field} type="date" readOnly className="h-12 rounded-xl bg-slate-100 text-slate-500" />
                      )} />
                      {errors.declarationDate && <p className="text-red-500 text-xs">{errors.declarationDate.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-slate-50/50 border-t p-6 flex justify-between items-center">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-6 rounded-xl font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl font-bold bg-[#E87154] hover:bg-[#D66144] text-white gap-2 shadow-md shadow-[#E87154]/20">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl font-bold bg-[#1a1a1a] hover:bg-black text-white gap-2 shadow-lg">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  <>Submit Application <CheckCircle2 className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
