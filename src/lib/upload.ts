import { supabase } from "./supabase";
import { randomUUID } from "crypto";

export async function uploadToSupabase(
  file: File,
  folder: string = "misc"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = `${folder}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from("uploads")
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

// Legacy function for backward compatibility
export async function saveFileLocally(
  file: File,
  folder: string = "misc"
): Promise<string> {
  return uploadToSupabase(file, folder);
}

export async function deleteFromSupabase(fileUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/uploads/{filePath}
    const urlParts = fileUrl.split('/uploads/');
    if (urlParts.length < 2) {
      console.error('Invalid file URL format');
      return false;
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);
    
    if (error) {
      console.error('Failed to delete file from storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
