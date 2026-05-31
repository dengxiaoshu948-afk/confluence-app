import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Ensure uploads directory exists
const UPLOAD_DIR = join(process.cwd(), "uploads");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

export const uploadRouter = createRouter({
  // Get upload URL (for frontend to upload)
  getUploadUrl: publicQuery
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await ensureUploadDir();
      
      const ext = input.fileName.split(".").pop() || "bin";
      const key = `${randomUUID()}.${ext}`;
      const filePath = join(UPLOAD_DIR, key);

      return {
        uploadUrl: `/api/upload/${key}`,
        key,
        filePath,
      };
    }),
});
