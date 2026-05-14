"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Upload, X, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface FileUploadProps {
  label: string;
  name: string; // The hidden input name
  accept?: string;
  required?: boolean;
  defaultValue?: string;
  onUpload?: (url: string) => void;
  variant?: "default" | "avatar";
}

export function FileUpload({ 
  label, 
  name, 
  accept, 
  required, 
  defaultValue, 
  onUpload,
  variant = "default" 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(defaultValue || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("folder", "profiles");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setUploadedUrl(data.url);
      if (onUpload) {
        onUpload(data.url);
      }
      toast.success("Uploaded successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (variant === "avatar") {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Label className="text-sm font-medium">{label} {required && "*"}</Label>
        <input type="hidden" name={name} value={uploadedUrl} required={required} />
        
        <div className="relative group">
          <div className={`w-32 h-32 rounded-full overflow-hidden border-2 ${uploadedUrl ? 'border-blue-500' : 'border-dashed border-slate-300'} bg-slate-50 flex items-center justify-center transition-all group-hover:border-blue-400`}>
            {uploadedUrl ? (
              <Image 
                src={uploadedUrl} 
                alt="Avatar Preview" 
                fill 
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <User className="w-12 h-12" />
                <span className="text-[10px] uppercase font-bold mt-1">No Image</span>
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full shadow-md w-10 h-10 border-2 border-white hover:bg-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 text-slate-600" />
            </Button>
            {uploadedUrl && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="rounded-full shadow-md w-10 h-10 border-2 border-white"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        <Input 
          type="file" 
          ref={fileInputRef}
          accept={accept} 
          onChange={handleFileChange} 
          className="hidden"
        />
        <p className="text-[10px] text-muted-foreground italic">
          Click the upload icon to select a photo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label} {required && "*"}</Label>
      
      <input type="hidden" name={name} value={uploadedUrl} required={required} />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input 
            type="file" 
            ref={fileInputRef}
            accept={accept} 
            onChange={handleFileChange} 
            disabled={uploading || !!uploadedUrl}
            className="cursor-pointer pr-10"
          />
          {uploading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            </div>
          )}
        </div>
        
        {uploadedUrl && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-100">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase">Success</span>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
