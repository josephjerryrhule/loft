import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from "crypto";
import { supabase } from "./supabase";

const USE_LOCAL_STORAGE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Save file to local public/uploads directory
export async function saveFileLocally(
  file: File,
  folder: string = "misc"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${randomUUID()}.${extension}`;
  
  // Define absolute path to upload directory
  // We store in public/uploads/{folder} so they are accessible via browser
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  
  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);

  // Write file to disk
  await fs.writeFile(filePath, buffer);

  // Return public URL path
  return `/uploads/${folder}/${fileName}`;
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Sanitize and resolve path
    // Expecting url like: /uploads/misc/xyz.jpg
    if (!fileUrl.startsWith('/uploads/')) return false;

    const relativePath = fileUrl.substring(1); // Remove leading slash
    const fullPath = path.join(process.cwd(), 'public', relativePath);

    // Security check: ensure path is within public/uploads
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    if (!fullPath.startsWith(uploadsRoot)) {
        console.error("Invalid file deletion path detected");
        return false;
    }
    
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Alias for backward compatibility if needed, but implementation is local now
// Internal Supabase upload implementation
async function _uploadToSupabaseProvider(
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

// Main upload function that decides based on environment
export async function uploadToSupabase(
  file: File,
  folder: string = "misc"
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
      return saveFileLocally(file, folder);
  }
  return _uploadToSupabaseProvider(file, folder);
}

export async function deleteFromSupabase(fileUrl: string): Promise<boolean> {
    if (fileUrl.startsWith('/uploads/')) {
        return deleteFile(fileUrl);
    }
    
    // Supabase deletion logic
    try {
        const urlParts = fileUrl.split('/uploads/');
        if (urlParts.length < 2) return false;
        
        const filePath = urlParts[1];
        const { error } = await supabase.storage.from('uploads').remove([filePath]);
        
        return !error;
    } catch {
        return false;
    }
}
