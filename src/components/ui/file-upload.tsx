"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  label: string;
  name: string; // The hidden input name
  accept?: string;
  required?: boolean;
}

export function FileUpload({ label, name, accept, required }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedUrl(data.url);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
      setFile(null); // Reset on failure
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label} {required && "*"}</Label>
      
      {/* Hidden input to store the actual URL for the form submission */}
      <input type="hidden" name={name} value={uploadedUrl} required={required} />

      <div className="flex items-center gap-4">
        <Input 
          type="file" 
          accept={accept} 
          onChange={handleFileChange} 
          disabled={uploading || !!uploadedUrl}
          className="cursor-pointer"
        />
        {uploading && <Loader2 className="animate-spin text-slate-500" />}
      </div>

      {uploadedUrl && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
           <UploadCloud size={16} />
           <span>Uploaded: {uploadedUrl}</span>
           <Button 
             type="button" 
             variant="ghost" 
             size="sm" 
             className="h-6 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
             onClick={() => {
                 setUploadedUrl("");
                 setFile(null);
             }}
           >
            Change
           </Button>
        </div>
      )}
    </div>
  );
}
