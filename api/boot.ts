import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { mkdir, stat, readdir, unlink, readFile } from "fs/promises";
import { createWriteStream, createReadStream } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const app = new Hono<{ Bindings: HttpBindings }>();

// Enable CORS for APP WebView (localhost) and web browser
app.use("*", cors({
  origin: ["http://localhost", "https://vrkswoeg6jemc.kimi.site", "capacitor://localhost"],
  allowHeaders: ["Content-Type", "Authorization", "x-local-auth-token", "x-trpc-source"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 86400,
}));
const UPLOAD_DIR = join(process.cwd(), "uploads");
const CHUNK_DIR = join(process.cwd(), "uploads", ".chunks");

// 100MB per chunk, 500 chunks = 50GB max
const CHUNK_SIZE = 100 * 1024 * 1024;

// Regular file upload (up to 10GB for single file)
app.use(bodyLimit({ maxSize: 10 * 1024 * 1024 * 1024 }));

// ========== CHUNKED UPLOAD API (for large files 10GB+) ==========

// 1. Initialize chunked upload session
app.post("/api/upload/chunk/init", async (c) => {
  try {
    await mkdir(CHUNK_DIR, { recursive: true });
    const { fileName, fileSize, totalChunks } = await c.req.json();

    const uploadId = randomUUID();
    const sessionDir = join(CHUNK_DIR, uploadId);
    await mkdir(sessionDir, { recursive: true });

    // Save session metadata
    await Bun.write(
      join(sessionDir, ".meta.json"),
      JSON.stringify({ fileName, fileSize, totalChunks, uploadedChunks: [] })
    );

    return c.json({
      success: true,
      uploadId,
      chunkSize: CHUNK_SIZE,
    });
  } catch (error) {
    console.error("Chunk init error:", error);
    return c.json({ error: "Failed to initialize upload" }, 500);
  }
});

// 2. Upload a single chunk
app.post("/api/upload/chunk/:uploadId", async (c) => {
  try {
    const uploadId = c.req.param("uploadId");
    const chunkIndex = parseInt(c.req.query("index") || "0");
    const sessionDir = join(CHUNK_DIR, uploadId);

    const formData = await c.req.formData();
    const chunk = formData.get("chunk") as File;

    if (!chunk) {
      return c.json({ error: "No chunk data" }, 400);
    }

    // Stream write the chunk
    const chunkPath = join(sessionDir, `chunk_${chunkIndex}`);
    const writeStream = createWriteStream(chunkPath);
    const reader = chunk.stream().getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writeStream.write(Buffer.from(value));
      }
      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    } finally {
      reader.releaseLock();
    }

    // Update metadata
    const metaPath = join(sessionDir, ".meta.json");
    const metaRaw = await Bun.file(metaPath).text();
    const meta = JSON.parse(metaRaw);
    if (!meta.uploadedChunks.includes(chunkIndex)) {
      meta.uploadedChunks.push(chunkIndex);
    }
    await Bun.write(metaPath, JSON.stringify(meta));

    return c.json({
      success: true,
      chunkIndex,
      uploaded: meta.uploadedChunks.length,
      total: meta.totalChunks,
    });
  } catch (error) {
    console.error("Chunk upload error:", error);
    return c.json({ error: "Chunk upload failed" }, 500);
  }
});

// 3. Check which chunks are already uploaded (for resume)
app.get("/api/upload/chunk/:uploadId/status", async (c) => {
  try {
    const uploadId = c.req.param("uploadId");
    const sessionDir = join(CHUNK_DIR, uploadId);
    const metaPath = join(sessionDir, ".meta.json");

    const metaRaw = await Bun.file(metaPath).text();
    const meta = JSON.parse(metaRaw);

    return c.json({
      uploadId,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
      totalChunks: meta.totalChunks,
      uploadedChunks: meta.uploadedChunks,
      completed: meta.uploadedChunks.length >= meta.totalChunks,
    });
  } catch {
    return c.json({ error: "Upload session not found" }, 404);
  }
});

// 4. Finalize - merge all chunks into final file
app.post("/api/upload/chunk/:uploadId/finalize", async (c) => {
  try {
    const uploadId = c.req.param("uploadId");
    const sessionDir = join(CHUNK_DIR, uploadId);
    const metaPath = join(sessionDir, ".meta.json");

    const metaRaw = await Bun.file(metaPath).text();
    const meta = JSON.parse(metaRaw);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = meta.fileName.split(".").pop() || "bin";
    const finalKey = `${randomUUID()}.${ext}`;
    const finalPath = join(UPLOAD_DIR, finalKey);

    // Merge chunks in order
    const finalStream = createWriteStream(finalPath);
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkPath = join(sessionDir, `chunk_${i}`);
      const chunkData = await Bun.file(chunkPath).arrayBuffer();
      finalStream.write(Buffer.from(chunkData));
    }
    finalStream.end();
    await new Promise<void>((resolve, reject) => {
      finalStream.on("finish", resolve);
      finalStream.on("error", reject);
    });

    // Clean up chunk files
    try {
      const files = await readdir(sessionDir);
      for (const f of files) {
        await unlink(join(sessionDir, f));
      }
      await Bun.file(metaPath).delete?.();
    } catch {
      // cleanup best effort
    }

    return c.json({
      success: true,
      key: finalKey,
      fileUrl: `/uploads/${finalKey}`,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
    });
  } catch (error) {
    console.error("Finalize error:", error);
    return c.json({ error: "Failed to finalize upload" }, 500);
  }
});

// ========== REGULAR FILE UPLOAD (for files < 10GB) ==========
app.post("/api/upload", async (c) => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const ext = file.name.split(".").pop() || "bin";
    const key = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOAD_DIR, key);

    // Stream write for large files
    const writeStream = createWriteStream(filePath);
    const reader = file.stream().getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writeStream.write(Buffer.from(value));
      }
      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    } finally {
      reader.releaseLock();
    }

    return c.json({
      success: true,
      key,
      fileUrl: `/uploads/${key}`,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// ========== FILE SERVING (download) ==========
app.get("/uploads/:key", async (c) => {
  const key = c.req.param("key");
  // Block access to chunk temp files
  if (key.startsWith(".") || key.includes("..")) {
    return c.json({ error: "Invalid key" }, 400);
  }
  const filePath = join(UPLOAD_DIR, key);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return c.json({ error: "Not a file" }, 404);
    }

    const ext = key.split(".").pop()?.toLowerCase() || "bin";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      zip: "application/zip",
      tar: "application/x-tar",
      gz: "application/gzip",
      json: "application/json",
      py: "text/x-python",
      js: "application/javascript",
      ts: "application/typescript",
      md: "text/markdown",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      onnx: "application/octet-stream",
      pt: "application/octet-stream",
      pth: "application/octet-stream",
      h5: "application/octet-stream",
      safetensors: "application/octet-stream",
      bin: "application/octet-stream",
      ckpt: "application/octet-stream",
      gguf: "application/octet-stream",
      wasm: "application/wasm",
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const download = c.req.query("download");

    const stream = createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileStat.size.toString(),
        ...(download === "1" ? { "Content-Disposition": `attachment; filename="${key}"` } : {}),
      },
    });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});

// ========== tRPC + Auth ==========
// OLA-H1 standalone website route
app.get("/ola-h1", async (c) => {
  try {
    const htmlPath = join(process.cwd(), "uploads", "ola-h1.html");
    const html = await readFile(htmlPath);
    c.header("Content-Type", "text/html; charset=utf-8");
    return c.body(html);
  } catch {
    return c.json({ error: "OLA-H1 page not found" }, 404);
  }
});

// Serve static OLA-H1 from public folder too
app.get("/ola-h1.html", async (c) => {
  try {
    const htmlPath = join(process.cwd(), "uploads", "ola-h1.html");
    const html = await readFile(htmlPath);
    c.header("Content-Type", "text/html; charset=utf-8");
    return c.body(html);
  } catch {
    return c.json({ error: "OLA-H1 page not found" }, 404);
  }
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
