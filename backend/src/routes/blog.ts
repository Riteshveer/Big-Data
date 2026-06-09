import { Hono } from "hono";
import type { Env } from "../types";

const blog = new Hono<{ Bindings: Env }>();

// GET /api/blog — public (published only)
blog.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, slug, title, excerpt, cover_image_url, tags, published_at FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC"
  ).all();

  const posts = result.results.map((p: any) => ({
    ...p,
    tags: JSON.parse(p.tags || "[]"),
  }));

  return c.json(posts);
});

// GET /api/blog/all — admin (includes drafts)
blog.get("/all", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM blog_posts ORDER BY created_at DESC"
  ).all();

  const posts = result.results.map((p: any) => ({
    ...p,
    tags: JSON.parse(p.tags || "[]"),
  }));

  return c.json(posts);
});

// GET /api/blog/:slug — public
blog.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const post = await c.env.DB.prepare(
    "SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1"
  ).bind(slug).first();

  if (!post) return c.json({ error: "Not found" }, 404);

  return c.json({ ...(post as any), tags: JSON.parse((post as any).tags || "[]") });
});

// POST /api/blog — admin (create)
blog.post("/", async (c) => {
  const body = await c.req.json();
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await c.env.DB.prepare(
    `INSERT INTO blog_posts (slug, title, content, excerpt, cover_image_url, tags, is_published, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    slug,
    body.title,
    body.content,
    body.excerpt || null,
    body.cover_image_url || null,
    JSON.stringify(body.tags || []),
    body.is_published ? 1 : 0,
    body.is_published ? new Date().toISOString() : null,
  ).run();

  return c.json({ slug, success: true }, 201);
});

// PUT /api/blog/:slug — admin (update)
blog.put("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  const wasPublished = await c.env.DB.prepare(
    "SELECT is_published, published_at FROM blog_posts WHERE slug = ?"
  ).bind(slug).first();

  const nowPublishing = body.is_published && !(wasPublished as any)?.is_published;

  await c.env.DB.prepare(
    `UPDATE blog_posts SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      excerpt = ?,
      cover_image_url = ?,
      tags = COALESCE(?, tags),
      is_published = COALESCE(?, is_published),
      published_at = COALESCE(?, published_at),
      updated_at = datetime('now')
    WHERE slug = ?`
  ).bind(
    body.title || null,
    body.content || null,
    body.excerpt !== undefined ? body.excerpt : null,
    body.cover_image_url !== undefined ? body.cover_image_url : null,
    body.tags ? JSON.stringify(body.tags) : null,
    body.is_published !== undefined ? (body.is_published ? 1 : 0) : null,
    nowPublishing ? new Date().toISOString() : null,
    slug,
  ).run();

  return c.json({ success: true });
});

// DELETE /api/blog/:slug — admin
blog.delete("/:slug", async (c) => {
  const slug = c.req.param("slug");
  await c.env.DB.prepare("DELETE FROM blog_posts WHERE slug = ?").bind(slug).run();
  return c.json({ success: true });
});

export { blog };
