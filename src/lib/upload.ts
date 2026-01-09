import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function saveFileLocally(
  file: File,
  folder: string = "misc"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  // Create unique filename
  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${uuidv4()}.${extension}`;
  const filePath = join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // Return public path
  return `/uploads/${folder}/${fileName}`;
}
