import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase";

export async function uploadToSupabase(
  file: File,
  folder: string = "misc"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${uuidv4()}.${extension}`;
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
