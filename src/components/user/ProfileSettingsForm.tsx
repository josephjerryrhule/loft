"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/user";
import { toast } from "sonner";
import { useState } from "react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORTED_COUNTRIES } from "@/lib/countries";

interface ProfileSettingsFormProps {
    user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
        phoneNumber: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string | null;
        role: string;
        profilePictureUrl: string | null;
    };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>(user.phoneNumber || undefined);
    
    const isAmbassador = user.role === "MANAGER" || user.role === "AFFILIATE";

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        formData.set("phoneNumber", phoneNumber || "");

        try {
            const result = await updateProfile(formData);
            if (result && result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            {isAmbassador && (
                <div className="pb-6 border-b mb-6 flex justify-center">
                    <div className="max-w-xs w-full">
                        <FileUpload 
                            label="Profile Photo (Verification Page)" 
                            name="profilePictureUrl" 
                            accept="image/*"
                            defaultValue={user.profilePictureUrl || ""}
                            variant="avatar"
                        />
                        <p className="text-[0.75rem] text-muted-foreground mt-4 text-center">
                            Recommended: Square image, min 400x400px. This photo will be shown on your public verification page.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" defaultValue={user.firstName || ""} placeholder="John" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" defaultValue={user.lastName || ""} placeholder="Doe" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" value={user.email} disabled className="bg-muted" />
                <p className="text-[0.8rem] text-muted-foreground">Email address cannot be changed.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phoneNumber">WhatsApp Number</Label>
                <PhoneInput
                    defaultCountry="GH"
                    placeholder="Enter WhatsApp number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    numberInputProps={{
                        className: "border-0 bg-transparent focus:ring-0 outline-none w-full ml-2" // styling fix
                    }}
                />
            </div>

            <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-sm font-medium">Shipping Address</h3>
                
                <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" name="address" defaultValue={user.address || ""} placeholder="123 Main St" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" defaultValue={user.city || ""} placeholder="Accra" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">State/Region</Label>
                        <Input id="state" name="state" defaultValue={user.state || ""} placeholder="Greater Accra" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" name="postalCode" defaultValue={user.postalCode || ""} placeholder="00233" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                        <Label htmlFor="country">Country</Label>
                        <Select name="country" defaultValue={user.country || "Ghana"}>
                            <SelectTrigger id="country" className="w-full h-9 border bg-transparent px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-[#E87154]/50 focus:border-[#E87154] text-left">
                                <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-stone-100 shadow-lg rounded-xl z-[100]">
                                {SORTED_COUNTRIES.map((c) => (
                                    <SelectItem key={c.code} value={c.name}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
