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
  // In some production environments (like Plesk), you might want to save directly to a served folder
  // Defaults to public/uploads if not specified
  const baseUploadDir = process.env.UPLOAD_DIR_BASE 
    ? path.resolve(process.env.UPLOAD_DIR_BASE)
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
  const uploadDir = path.join(baseUploadDir, folder);
  
  console.log(`[Upload] Saving file to: ${uploadDir}/${fileName}`);

  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, fileName);

  // Write file to disk
  await fs.writeFile(filePath, buffer);

  // Return public URL path
  // If UPLOAD_DIR_BASE is used, we still assume the URL is relative to the domain root /uploads/
  return `/uploads/${folder}/${fileName}`;
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Sanitize and resolve path
    // Expecting url like: /uploads/misc/xyz.jpg
    if (!fileUrl.startsWith('/uploads/')) return false;

    const relativePath = fileUrl.replace('/uploads/', ''); 
    const baseUploadDir = process.env.UPLOAD_DIR_BASE 
        ? path.resolve(process.env.UPLOAD_DIR_BASE)
        : path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
    const fullPath = path.resolve(baseUploadDir, relativePath);

    console.log(`[Upload] Deleting file from: ${fullPath}`);

    // Security check: ensure path is within baseUploadDir
    if (!fullPath.startsWith(baseUploadDir)) {
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
export async function uploadFile(
  file: File,
  folder: string = "misc"
): Promise<string> {
  // Check if we are in a serverless environment (like Vercel) where local fs is read-only.
  // If we have Supabase configured, use it. Otherwise, if we are in local dev, allow local storage.
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) {
      return _uploadToSupabaseProvider(file, folder);
  }
  
  if (isServerless) {
      throw new Error("Local file storage is not supported in this environment. Please configure Supabase.");
  }
  
  return saveFileLocally(file, folder);
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

/**
 * Upload a raw Buffer (vs File). Used by the PDF processor pipeline
 * which generates page buffers, not File objects.
 */
export async function uploadBuffer(
  data: Buffer,
  contentType: string,
  folder: string,
  filename?: string
): Promise<string> {
  const finalName = filename ?? `${randomUUID()}.${extFromContentType(contentType)}`;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
  ) {
    const filePath = `${folder}/${finalName}`;
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filePath, data, { contentType, upsert: false });
    if (error) throw new Error(`Failed to upload buffer: ${error.message}`);
    const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(filePath);
    return publicData.publicUrl;
  }

  const baseUploadDir =
    process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const uploadDir = path.join(/*turbopackIgnore: true*/ baseUploadDir, folder);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ uploadDir, finalName), data);
  return `/uploads/${folder}/${finalName}`;
}

function extFromContentType(ct: string): string {
  if (ct === "image/webp") return "webp";
  if (ct === "image/png") return "png";
  if (ct === "image/jpeg") return "jpg";
  if (ct === "application/pdf") return "pdf";
  return "bin";
}

/**
 * Wipe all assets under flipbooks/<id>/ (local fs OR Supabase prefix).
 */
export async function deleteFlipbookAssets(flipbookId: string): Promise<void> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
  ) {
    const prefix = `flipbooks/${flipbookId}/`;
    const { data: list, error: listErr } = await supabase.storage.from("uploads").list(prefix);
    if (listErr || !list) return;
    const paths = list.map((f: { name: string }) => `${prefix}${f.name}`);
    if (paths.length > 0) await supabase.storage.from("uploads").remove(paths);
    return;
  }

  const baseUploadDir =
    process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const dir = path.join(/*turbopackIgnore: true*/ baseUploadDir, "flipbooks", flipbookId);
  await fs.rm(dir, { recursive: true, force: true });
}
