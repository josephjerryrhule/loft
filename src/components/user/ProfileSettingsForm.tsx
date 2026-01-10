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
    };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>(user.phoneNumber || undefined);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        // Phone input value might not be in formData automatically if controlled separately,
        // but since we are using 'name' prop on PhoneInput it *might* work if it uses native input under the hood. 
        // However, standard react-phone-number-input doesn't always inject a hidden input.
        // Let's ensure we send it.
        formData.set("phoneNumber", phoneNumber || "");

        try {
            await updateProfile(formData);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4">
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
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <PhoneInput
                    defaultCountry="GH"
                    placeholder="Enter phone number"
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
                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" defaultValue={user.country || "Ghana"} placeholder="Ghana" />
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
