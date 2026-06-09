import { Hono } from "hono";
import type { Env } from "../types";

const settings = new Hono<{ Bindings: Env }>();

// GET /api/settings — public
settings.get("/", async (c) => {
  const result = await c.env.DB.prepare("SELECT key, value FROM settings").all();
  const obj: Record<string, string> = {};
  for (const row of result.results as any[]) {
    obj[row.key] = row.value;
  }
  return c.json(obj);
});

// PUT /api/settings/:key — admin
settings.put("/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json<{ value: string }>();

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  ).bind(key, value).run();

  return c.json({ success: true });
});

// PUT /api/settings — bulk update (admin)
settings.put("/", async (c) => {
  const body = await c.req.json<Record<string, string>>();
  const stmt = c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  );

  const batch = Object.entries(body).map(([key, value]) => stmt.bind(key, value));
  await c.env.DB.batch(batch);

  return c.json({ success: true });
});

export { settings };
