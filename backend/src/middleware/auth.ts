import { Context, Next } from "hono";
import * as jose from "jose";
import type { Env } from "../types";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    await jose.jwtVerify(token, secret);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export async function createToken(env: Env, username: string): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}
