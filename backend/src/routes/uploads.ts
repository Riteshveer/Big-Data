import { Hono } from "hono";
import type { Env } from "../types";

const uploads = new Hono<{ Bindings: Env }>();

// POST /api/uploads — admin (upload file to Cloudinary)
uploads.post("/", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = c.env;

  // Upload to Cloudinary using unsigned upload via REST API
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "portfolio";

  // Generate signature
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Build upload form
  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", CLOUDINARY_API_KEY);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("signature", signature);
  uploadForm.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: uploadForm }
  );

  if (!res.ok) {
    const err = await res.text();
    return c.json({ error: `Cloudinary upload failed: ${err}` }, 500);
  }

  const result: any = await res.json();
  const url = result.secure_url;
  const publicId = result.public_id;

  // Track in DB
  await c.env.DB.prepare(
    "INSERT INTO uploads (filename, r2_key, url, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)"
  ).bind(file.name, publicId, url, file.type, file.size).run();

  return c.json({ url, r2Key: publicId, filename: file.name, size: file.size }, 201);
});

// GET /api/uploads — admin (list uploaded files)
uploads.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM uploads ORDER BY created_at DESC LIMIT 100"
  ).all();

  return c.json(result.results);
});

// DELETE /api/uploads/:id — admin
uploads.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const upload = await c.env.DB.prepare(
    "SELECT r2_key FROM uploads WHERE id = ?"
  ).bind(id).first();

  if (upload) {
    // Delete from Cloudinary
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = c.env;
    const publicId = (upload as any).r2_key;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const deleteForm = new FormData();
    deleteForm.append("public_id", publicId);
    deleteForm.append("api_key", CLOUDINARY_API_KEY);
    deleteForm.append("timestamp", timestamp);
    deleteForm.append("signature", signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body: deleteForm }
    );

    await c.env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(id).run();
  }

  return c.json({ success: true });
});

export { uploads };
