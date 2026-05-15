"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Upload, X, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  name: string; // The hidden input name
  accept?: string;
  required?: boolean;
  defaultValue?: string;
  onUpload?: (url: string) => void;
  variant?: "default" | "avatar";
  folder?: string;
}

export function FileUpload({ 
  label, 
  name, 
  accept, 
  required, 
  defaultValue, 
  onUpload,
  variant = "default",
  folder = "misc"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(defaultValue || "");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    setFileName(selectedFile.name);
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("folder", folder);

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
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to upload";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedUrl("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onUpload) onUpload("");
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
        
        <input 
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
      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <input type="hidden" name={name} value={uploadedUrl} required={required} />

      <div 
        onClick={() => !uploading && !uploadedUrl && fileInputRef.current?.click()}
        className={cn(
          "relative group border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer",
          uploadedUrl 
            ? "bg-slate-50 border-slate-200" 
            : "bg-white border-slate-200 hover:border-[#E87154]/50 hover:bg-[#E87154]/5",
          uploading && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-lg transition-colors",
            uploadedUrl ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 group-hover:bg-[#E87154]/10 group-hover:text-[#E87154]"
          )}>
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : uploadedUrl ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {uploadedUrl ? (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {fileName || uploadedUrl.split('/').pop()}
                </span>
                <span className="text-[10px] text-green-600 font-bold uppercase italic">
                  Upload Complete
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">
                  {uploading ? "Uploading file..." : `Select ${label}`}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  Click to browse files {accept && `(${accept})`}
                </span>
              </div>
            )}
          </div>

          {uploadedUrl && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove}
              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress bar mock for visual feedback */}
        {uploading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 overflow-hidden rounded-b-xl">
            <div className="h-full bg-[#E87154] animate-progress shadow-[0_0_10px_rgba(232,113,84,0.5)]" style={{ width: '40%' }}></div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        accept={accept} 
        onChange={handleFileChange} 
        className="hidden"
      />
    </div>
  );
}
