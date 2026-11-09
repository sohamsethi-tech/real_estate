import { Router } from "express";
import rateLimit from "express-rate-limit";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../db.js";
import { config } from "../config.js";
import { hashToken, newSessionToken, userFromRequest } from "../auth.js";

export const auth = Router();
const window = rateLimit({ windowMs: 15 * 60_000, limit: 10 });

auth.post("/login", window, async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid credentials" });
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const ok = Boolean(user?.active && await argon2.verify(user.passwordHash, parsed.data.password).catch(() => false));
  if (!user || !ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = newSessionToken();
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + config.SESSION_TTL_HOURS * 3600_000),
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "LOGIN" } });
  res.cookie("vg_session", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: config.SESSION_TTL_HOURS * 3600_000,
    path: "/",
  });
  res.json({ name: user.name, role: user.role, email: user.email });
});

auth.post("/logout", async (req, res) => {
  const token = req.cookies?.vg_session as string | undefined;
  if (token) await db.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  res.clearCookie("vg_session", { path: "/" }).status(204).end();
});

auth.get("/me", async (req, res) => {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  res.json({ name: user.name, role: user.role, email: user.email });
});
