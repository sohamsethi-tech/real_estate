import { Router } from "express";
import { db } from "../db.js";

export const content = Router();

content.get("/team", async (_req, res) => {
  const agents = await db.agent.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true, biography: true, phone: true, email: true, photoKey: true },
  });
  res.json({ items: agents });
});

content.get("/testimonials", async (_req, res) => {
  const items = await db.testimonial.findMany({
    where: { approved: true },
    orderBy: { reviewDate: "desc" },
    select: { id: true, reviewer: true, body: true, reviewDate: true, suburb: true, featured: true },
  });
  res.json({ items });
});

content.get("/faqs", async (_req, res) => {
  const items = await db.faq.findMany({
    where: { published: true },
    orderBy: { position: "asc" },
    select: { key: true, question: true, answer: true },
  });
  res.json({ items });
});

content.get("/:key", async (req, res) => {
  const page = await db.websiteContent.findUnique({ where: { key: req.params.key } });
  if (!page || !page.published) return res.status(404).json({ error: "Not found" });
  res.json({ key: page.key, title: page.title, body: page.body, updatedAt: page.updatedAt });
});
