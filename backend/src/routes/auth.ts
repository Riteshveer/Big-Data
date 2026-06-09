import { Hono } from "hono";
import { createToken } from "../middleware/auth";
import type { Env } from "../types";

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json<{ username: string; password: string }>();

  if (body.username !== c.env.ADMIN_USERNAME || body.password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await createToken(c.env, body.username);
  return c.json({ token, expiresIn: "7d" });
});

export { auth };
