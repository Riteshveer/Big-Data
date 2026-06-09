import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./routes/auth";
import { settings } from "./routes/settings";
import { projects } from "./routes/projects";
import { uploads } from "./routes/uploads";
import { blog } from "./routes/blog";
import { authMiddleware } from "./middleware/auth";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// CORS — allow your portfolio domain + localhost for dev
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://your-domain.com"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// --- Public routes (no auth required) ---
app.route("/api/auth", auth);

// Public read endpoints
app.get("/api/settings", async (c) => {
  const result = await c.env.DB.prepare("SELECT key, value FROM settings").all();
  const obj: Record<string, string> = {};
  for (const row of result.results as any[]) {
    obj[row.key] = row.value;
  }
  return c.json(obj);
});

app.get("/api/projects", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE is_published = 1 ORDER BY sort_order ASC"
  ).all();
  const projectsList = result.results.map((p: any) => ({
    ...p,
    tags: JSON.parse(p.tags || "[]"),
  }));
  return c.json(projectsList);
});

app.get("/api/projects/:slug", async (c) => {
  const slug = c.req.param("slug");
  const project = await c.env.DB.prepare("SELECT * FROM projects WHERE slug = ?").bind(slug).first();
  if (!project) return c.json({ error: "Not found" }, 404);

  const components = await c.env.DB.prepare(
    "SELECT * FROM project_components WHERE project_id = ? ORDER BY sort_order ASC"
  ).bind((project as any).id).all();

  const images = await c.env.DB.prepare(
    "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC"
  ).bind((project as any).id).all();

  // Load descriptions for each image/section
  const imagesWithDescriptions = await Promise.all(
    images.results.map(async (img: any) => {
      const descriptions = await c.env.DB.prepare(
        "SELECT * FROM section_descriptions WHERE image_id = ? ORDER BY sort_order ASC"
      ).bind(img.id).all();
      return { ...img, descriptions: descriptions.results };
    })
  );

  const diagrams = await c.env.DB.prepare(
    "SELECT * FROM diagrams WHERE project_id = ?"
  ).bind((project as any).id).all();

  return c.json({
    ...(project as any),
    tags: JSON.parse((project as any).tags || "[]"),
    components: components.results.map((comp: any) => ({ ...comp, props: JSON.parse(comp.props || "{}") })),
    images: imagesWithDescriptions,
    diagrams: diagrams.results.map((d: any) => ({ ...d, nodes: JSON.parse(d.nodes || "[]"), edges: JSON.parse(d.edges || "[]") })),
  });
});

app.get("/api/blog", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, slug, title, excerpt, cover_image_url, tags, published_at FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC"
  ).all();
  return c.json(result.results.map((p: any) => ({ ...p, tags: JSON.parse(p.tags || "[]") })));
});

app.get("/api/blog/:slug", async (c) => {
  const slug = c.req.param("slug");
  const post = await c.env.DB.prepare("SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1").bind(slug).first();
  if (!post) return c.json({ error: "Not found" }, 404);
  return c.json({ ...(post as any), tags: JSON.parse((post as any).tags || "[]") });
});

// --- Admin routes (auth required) ---
app.use("/api/admin/*", authMiddleware);

// Admin: Settings
app.put("/api/admin/settings", async (c) => {
  const body = await c.req.json<Record<string, string>>();
  const stmt = c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  );
  const batch = Object.entries(body).map(([key, value]) => stmt.bind(key, value));
  await c.env.DB.batch(batch);
  return c.json({ success: true });
});

app.put("/api/admin/settings/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json<{ value: string }>();
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  ).bind(key, value).run();
  return c.json({ success: true });
});

// Admin: Projects CRUD
app.route("/api/admin/projects", projects);

// Admin: Uploads
app.route("/api/admin/uploads", uploads);

// Admin: Blog
app.route("/api/admin/blog", blog);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

export default app;
