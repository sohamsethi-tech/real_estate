import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { db } from "./db.js";

export type AuthedRequest = Request & { user: User };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return hash(token);
}

export async function userFromRequest(req: Request) {
  const token = req.cookies?.vg_session as string | undefined;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

export function requireRole(...roles: User["role"][]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: "Sign in required" });
    if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: "Not permitted" });
    (req as AuthedRequest).user = user;
    next();
  };
}

export function actor(req: Request) {
  return (req as AuthedRequest).user;
}
