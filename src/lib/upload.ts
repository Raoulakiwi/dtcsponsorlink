import { put } from "@vercel/blob";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel server action limit is ~4.5 MB)

export async function uploadAsset(
  file: File,
  prefix: string
): Promise<{ url: string } | { error: string }> {
  if (!process.env.BLOBB_READ_WRITE_TOKEN) {
    return { error: "File upload is not configured (BLOBB_READ_WRITE_TOKEN). Save without uploading or add the token in Vercel." };
  }
  if (file.size <= 0) return { error: "File is empty" };
  if (file.size > MAX_SIZE) return { error: "File must be under 4 MB" };
  try {
    const name = `${prefix}/${Date.now()}-${(file.name || "file").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const blob = await put(name, file, {
      access: "public",
      token: process.env.BLOBB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  } catch (e) {
    console.error("uploadAsset:", e);
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export function isUploadConfigured(): boolean {
  return Boolean(process.env.BLOBB_READ_WRITE_TOKEN);
}
