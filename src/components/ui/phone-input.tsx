"use client";

import * as React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Shadcn-compatible wrapper
const PhoneInputComponent = React.forwardRef<any, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <PhoneInput
        international
        defaultCountry="GH"
        value={value}
        onChange={(val) => onChange(val || "")}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        numberInputProps={{
             className: "border-none bg-transparent outline-none ring-0 p-0 h-full w-full focus-visible:ring-0" // remove default input styles to blend
        }}
        {...props}
      />
    );
  }
);
PhoneInputComponent.displayName = "PhoneInput";

export { PhoneInputComponent };
