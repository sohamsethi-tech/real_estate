import { Router } from "express";
import multer from "multer";
import { Prisma, type Role } from "@prisma/client";
import { z } from "zod";
import { db } from "../db.js";
import { actor, requireRole } from "../auth.js";
import { makeReference, slugify } from "../reference.js";
import { emailNote, sendEmail } from "../services/email.js";
import { removeStored, storeImage } from "../services/files.js";
import { probeVaultre, vaultreStatus } from "../adapters/vaultre.js";
import { config, emailConfigured } from "../config.js";
import { formatMelbourne } from "../time.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 12 } });
const editors: Role[] = ["ADMIN", "MANAGER"];
const readers: Role[] = ["ADMIN", "MANAGER", "AGENT", "CONTENT_EDITOR", "READ_ONLY"];
const writers: Role[] = ["ADMIN", "MANAGER", "CONTENT_EDITOR"];

const listingSchema = z.object({
  headline: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(8000),
  addressLine: z.string().trim().min(3).max(160),
  suburb: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(20).default("VIC"),
  postcode: z.string().trim().regex(/^\d{4}$/, "Use a 4 digit postcode"),
  listingType: z.enum(["SALE", "RENT"]),
  category: z.enum(["HOUSE", "APARTMENT", "TOWNHOUSE", "COMMERCIAL", "INDUSTRIAL", "LAND"]),
  status: z.enum(["ACTIVE", "UNDER_OFFER", "SOLD", "LEASED", "WITHDRAWN", "OFF_MARKET"]),
  priceLabel: z.string().trim().min(2).max(80),
  priceMin: z.number().int().positive().nullable().optional(),
  priceMax: z.number().int().positive().nullable().optional(),
  beds: z.number().int().min(0).max(40).nullable().optional(),
  baths: z.number().int().min(0).max(40).nullable().optional(),
  parking: z.number().int().min(0).max(40).nullable().optional(),
  landSqm: z.number().positive().nullable().optional(),
  floorSqm: z.number().positive().nullable().optional(),
  features: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  featured: z.boolean().default(false),
  archived: z.boolean().default(false),
  agentId: z.string().nullable().optional(),
});

async function uniqueSlug(headline: string, suburb: string, currentId?: string) {
  const base = slugify(`${headline}-${suburb}`);
  let slug = base;
  let n = 2;
  while (await db.listing.findFirst({ where: { slug, NOT: currentId ? { id: currentId } : undefined } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export const admin = Router();
admin.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.get("x-vg-request") !== "1") {
    return res.status(400).json({ error: "Missing request header" });
  }
  next();
});

admin.get("/overview", requireRole(...readers), async (_req, res) => {
  const [listings, leads, bookings, agents] = await Promise.all([
    db.listing.groupBy({ by: ["status"], where: { archived: false }, _count: { _all: true } }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    db.agent.count(),
  ]);
  const recentLeads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { reference: true, name: true, type: true, status: true, createdAt: true } });
  res.json({ listings, leads, bookings, agents, recentLeads, email: emailConfigured() ? "configured" : "not_configured", vaultre: vaultreStatus() });
});

admin.get("/listings", requireRole(...readers), async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const rows = await db.listing.findMany({
    where: q ? { OR: [{ headline: { contains: q, mode: "insensitive" } }, { suburb: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] }, features: { orderBy: { position: "asc" } }, agent: { select: { id: true, name: true } } },
  });
  res.json({ items: rows });
});

admin.post("/listings", requireRole(...editors), async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the property fields", issues: parsed.error.flatten().fieldErrors });
  const { features, ...data } = parsed.data;
  const listing = await db.listing.create({
    data: {
      ...data,
      reference: makeReference("P"),
      slug: await uniqueSlug(data.headline, data.suburb),
      source: "INTERNAL",
      manuallyEdited: true,
      features: { create: features.map((label, position) => ({ label, position })) },
    },
  });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "LISTING_CREATE", target: listing.reference } });
  res.status(201).json(listing);
});

admin.patch("/listings/:id", requireRole(...editors), async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the property fields", issues: parsed.error.flatten().fieldErrors });
  const existing = await db.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.source === "VAULTRE") {
    return res.status(409).json({ error: "VaultRE records are not overwritten from this screen" });
  }
  const { features, ...data } = parsed.data;
  const listing = await db.listing.update({
    where: { id: existing.id },
    data: {
      ...data,
      slug: await uniqueSlug(data.headline, data.suburb, existing.id),
      manuallyEdited: true,
      features: { deleteMany: {}, create: features.map((label, position) => ({ label, position })) },
    },
  });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "LISTING_UPDATE", target: listing.reference } });
  res.json(listing);
});

admin.delete("/listings/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const existing = await db.listing.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.query.hard === "true" && actor(req).role === "ADMIN") {
    await Promise.all(existing.images.map((image) => removeStored(image.storageKey)));
    await db.listing.delete({ where: { id: existing.id } });
    await db.auditLog.create({ data: { actorId: actor(req).id, action: "LISTING_DELETE", target: existing.reference } });
    return res.status(204).end();
  }
  await db.listing.update({ where: { id: existing.id }, data: { archived: true, status: "WITHDRAWN" } });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "LISTING_ARCHIVE", target: existing.reference } });
  res.json({ archived: true });
});

admin.post("/listings/:id/images", requireRole(...editors), upload.array("images", 12), async (req, res) => {
  const listing = await db.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ error: "Not found" });
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) return res.status(400).json({ error: "Choose at least one image" });
  const kind = req.body.kind === "FLOORPLAN" ? "FLOORPLAN" : "PHOTO";
  const current = await db.listingImage.count({ where: { listingId: listing.id } });
  if (current + files.length > 24) return res.status(400).json({ error: "A property can have up to 24 images" });
  try {
    const created = [];
    for (const [index, file] of files.entries()) {
      const storageKey = await storeImage(file.buffer, `properties/${listing.id}`);
      const image = await db.listingImage.create({
        data: {
          listingId: listing.id,
          sourceRef: storageKey,
          storageKey,
          alt: `${listing.headline} photograph`,
          position: current + index,
          kind,
          isPrimary: current === 0 && index === 0 && kind === "PHOTO",
        },
      });
      created.push(image);
    }
    res.status(201).json({ items: created });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not store that image" });
  }
});

admin.patch("/listings/:id/images", requireRole(...editors), async (req, res) => {
  const parsed = z.object({
    items: z.array(z.object({ id: z.string(), position: z.number().int().min(0), isPrimary: z.boolean() })).min(1),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid image order" });
  const primaryCount = parsed.data.items.filter((item) => item.isPrimary).length;
  if (primaryCount > 1) return res.status(400).json({ error: "Choose one primary image" });
  await db.$transaction(parsed.data.items.map((item) => db.listingImage.updateMany({
    where: { id: item.id, listingId: req.params.id },
    data: { position: item.position, isPrimary: item.isPrimary },
  })));
  res.json({ ok: true });
});

admin.delete("/listings/:id/images/:imageId", requireRole(...editors), async (req, res) => {
  const image = await db.listingImage.findFirst({ where: { id: req.params.imageId, listingId: req.params.id } });
  if (!image) return res.status(404).json({ error: "Not found" });
  await db.$transaction(async (tx) => {
    await tx.listingImage.delete({ where: { id: image.id } });
    if (image.isPrimary) {
      const nextPrimary = await tx.listingImage.findFirst({
        where: { listingId: req.params.id, kind: "PHOTO" },
        orderBy: { position: "asc" },
      });
      if (nextPrimary) await tx.listingImage.update({ where: { id: nextPrimary.id }, data: { isPrimary: true } });
    }
  });
  await removeStored(image.storageKey);
  res.status(204).end();
});

admin.get("/leads", requireRole(...readers), async (req, res) => {
  const status = z.enum(["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "INSPECTION_SCHEDULED", "NEGOTIATION", "CONVERTED", "LOST"]).optional().safeParse(req.query.status).data;
  const q = String(req.query.q ?? "").trim();
  const where: Prisma.LeadWhereInput = {
    status,
    OR: q ? [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ] : undefined,
  };
  const items = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { events: { orderBy: { createdAt: "desc" } }, assignedTo: { select: { id: true, name: true } }, agent: { select: { id: true, name: true } } },
  });
  res.json({ items });
});

admin.patch("/leads/:id", requireRole(...editors), async (req, res) => {
  const parsed = z.object({
    status: z.enum(["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "INSPECTION_SCHEDULED", "NEGOTIATION", "CONVERTED", "LOST"]).optional(),
    assignedToId: z.string().nullable().optional(),
    agentId: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid lead update" });
  const lead = await db.lead.update({
    where: { id: req.params.id },
    data: parsed.data,
  }).catch(() => null);
  if (!lead) return res.status(404).json({ error: "Not found" });
  await db.leadEvent.create({ data: { leadId: lead.id, kind: "UPDATED", detail: JSON.stringify(parsed.data), actorId: actor(req).id } });
  res.json(lead);
});

admin.post("/leads/:id/notes", requireRole(...editors, "AGENT"), async (req, res) => {
  const parsed = z.object({ detail: z.string().trim().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Write a note" });
  const lead = await db.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Not found" });
  const event = await db.leadEvent.create({ data: { leadId: lead.id, kind: "NOTE", detail: parsed.data.detail, actorId: actor(req).id } });
  res.status(201).json(event);
});

admin.get("/bookings", requireRole(...readers), async (_req, res) => {
  const items = await db.booking.findMany({
    orderBy: { startsAt: "asc" },
    take: 200,
    include: { listing: { select: { reference: true, headline: true, slug: true } }, agent: { select: { id: true, name: true } } },
  });
  res.json({
    items: items.map((item) => ({ ...item, when: formatMelbourne(item.startsAt) })),
  });
});

admin.patch("/bookings/:id", requireRole(...editors), async (req, res) => {
  const parsed = z.object({
    status: z.enum(["PENDING", "APPROVED", "DECLINED", "RESCHEDULE_REQUESTED", "CANCELLED"]),
    agentId: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid booking update" });
  const existing = await db.booking.findUnique({ where: { id: req.params.id }, include: { listing: true } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const agentId = parsed.data.agentId === undefined ? existing.agentId : parsed.data.agentId;
  if (agentId && (parsed.data.status === "PENDING" || parsed.data.status === "APPROVED")) {
    const clash = await db.booking.findFirst({
      where: {
        id: { not: existing.id },
        agentId,
        status: { in: ["PENDING", "APPROVED"] },
        startsAt: { lt: existing.endsAt },
        endsAt: { gt: existing.startsAt },
      },
    });
    if (clash) return res.status(409).json({ error: `That agent already has ${clash.reference} in this time` });
  }
  const booking = await db.booking.update({ where: { id: existing.id }, data: { status: parsed.data.status, agentId } });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "BOOKING_STATUS", target: booking.reference, detail: booking.status } });
  const email = await sendEmail({
    to: booking.customerEmail,
    subject: `Booking ${booking.reference} is ${booking.status.toLowerCase().replaceAll("_", " ")}`,
    text: [
      `Reference: ${booking.reference}`,
      `Status: ${booking.status}`,
      booking.status === "APPROVED" ? "A member of the team has approved this time." : "This request is not a confirmed appointment.",
      `Requested time: ${formatMelbourne(booking.startsAt)} (Australia/Melbourne)`,
      existing.listing ? `Property: ${existing.listing.headline}` : "",
    ].filter(Boolean).join("\n"),
    relatedType: "booking",
    relatedId: booking.id,
  });
  res.json({ ...booking, when: formatMelbourne(booking.startsAt), email: email.delivered ? "sent" : email.reason, emailNote: emailNote(email) });
});

const agentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  title: z.string().max(80).nullable().optional(),
  biography: z.string().max(4000).nullable().optional(),
  published: z.boolean().default(false),
  userId: z.string().nullable().optional(),
});

admin.get("/agents", requireRole(...readers), async (_req, res) => {
  const items = await db.agent.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true, leads: true } } } });
  res.json({ items });
});

admin.post("/agents", requireRole(...editors), async (req, res) => {
  const parsed = agentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the agent profile", issues: parsed.error.flatten().fieldErrors });
  if (parsed.data.published && !parsed.data.biography?.trim()) {
    return res.status(400).json({ error: "Add a verified biography before publishing" });
  }
  const agent = await db.agent.create({ data: { ...parsed.data, biography: parsed.data.biography?.trim() || null } });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "AGENT_CREATE", target: agent.id } });
  res.status(201).json(agent);
});

admin.patch("/agents/:id", requireRole(...editors), async (req, res) => {
  const parsed = agentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the agent profile", issues: parsed.error.flatten().fieldErrors });
  if (parsed.data.published && !parsed.data.biography?.trim()) {
    return res.status(400).json({ error: "Add a verified biography before publishing" });
  }
  const agent = await db.agent.update({ where: { id: req.params.id }, data: { ...parsed.data, biography: parsed.data.biography?.trim() || null } }).catch(() => null);
  if (!agent) return res.status(404).json({ error: "Not found" });
  res.json(agent);
});

admin.post("/agents/:id/photo", requireRole(...editors), upload.single("photo"), async (req, res) => {
  const agent = await db.agent.findUnique({ where: { id: req.params.id } });
  if (!agent) return res.status(404).json({ error: "Not found" });
  if (!req.file) return res.status(400).json({ error: "Choose a photograph" });
  try {
    const photoKey = await storeImage(req.file.buffer, `agents/${agent.id}`);
    await removeStored(agent.photoKey);
    const updated = await db.agent.update({ where: { id: agent.id }, data: { photoKey } });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not store that photograph" });
  }
});

admin.get("/staff", requireRole(...readers), async (_req, res) => {
  const items = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true, staff: true, agent: { select: { id: true, published: true } } },
  });
  res.json({ items });
});

admin.get("/testimonials", requireRole(...readers), async (_req, res) => {
  res.json({ items: await db.testimonial.findMany({ orderBy: { reviewDate: "desc" } }) });
});

admin.post("/testimonials", requireRole(...writers), async (req, res) => {
  const parsed = z.object({
    reviewer: z.string().trim().min(2).max(120),
    body: z.string().trim().min(10).max(2000),
    suburb: z.string().max(80).optional(),
    sourceNote: z.string().trim().min(3).max(200),
    reviewDate: z.string(),
    approved: z.boolean().default(false),
    featured: z.boolean().default(false),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A testimonial needs the person’s name, their words, and where it came from", issues: parsed.error.flatten().fieldErrors });
  const item = await db.testimonial.create({
    data: { ...parsed.data, reviewDate: new Date(parsed.data.reviewDate) },
  });
  res.status(201).json(item);
});

admin.patch("/testimonials/:id", requireRole(...writers), async (req, res) => {
  const parsed = z.object({ approved: z.boolean().optional(), featured: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid update" });
  const item = await db.testimonial.update({ where: { id: req.params.id }, data: parsed.data }).catch(() => null);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

admin.delete("/testimonials/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  await db.testimonial.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

admin.get("/content", requireRole(...readers), async (_req, res) => {
  res.json({ items: await db.websiteContent.findMany({ orderBy: { key: "asc" } }) });
});

admin.put("/content/:key", requireRole(...writers), async (req, res) => {
  const parsed = z.object({ title: z.string().trim().min(2).max(160), body: z.string().trim().min(2).max(20000), published: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the page content" });
  const item = await db.websiteContent.upsert({
    where: { key: req.params.key },
    create: { key: req.params.key, ...parsed.data },
    update: parsed.data,
  });
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "CONTENT_UPDATE", target: item.key } });
  res.json(item);
});

admin.get("/faqs", requireRole(...readers), async (_req, res) => {
  res.json({ items: await db.faq.findMany({ orderBy: { position: "asc" } }) });
});

admin.post("/faqs", requireRole(...writers), async (req, res) => {
  const parsed = z.object({
    question: z.string().trim().min(5).max(200),
    answer: z.string().trim().min(5).max(4000),
    published: z.boolean().default(false),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the question and answer" });
  const count = await db.faq.count();
  const item = await db.faq.create({
    data: { ...parsed.data, key: slugify(parsed.data.question).slice(0, 40) + "-" + makeReference("E").slice(-4).toLowerCase(), position: count },
  });
  res.status(201).json(item);
});

admin.patch("/faqs/:id", requireRole(...writers), async (req, res) => {
  const parsed = z.object({
    question: z.string().trim().min(5).max(200).optional(),
    answer: z.string().trim().min(5).max(4000).optional(),
    published: z.boolean().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the question and answer" });
  const item = await db.faq.update({ where: { id: req.params.id }, data: parsed.data }).catch(() => null);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

admin.get("/settings", requireRole(...readers), async (_req, res) => {
  res.json({
    email: emailConfigured() ? "configured" : "not_configured",
    notifyEmail: config.NOTIFY_EMAIL ? "set" : "missing",
    vaultre: vaultreStatus(),
    fixtures: config.SEED_FIXTURES ? "seed_enabled" : "off",
    siteUrl: config.PUBLIC_SITE_URL,
  });
});

admin.post("/integrations/vaultre/probe", requireRole("ADMIN"), async (req, res) => {
  const result = await probeVaultre();
  await db.auditLog.create({ data: { actorId: actor(req).id, action: "VAULTRE_PROBE", detail: result.probed ? String(result.httpStatus) : "not_configured" } });
  await db.syncRun.create({ data: { finishedAt: new Date(), ok: result.probed && result.httpStatus === 200, upserted: 0, error: result.probed ? null : result.reason } });
  res.json(result);
});

admin.get("/reports", requireRole(...readers), async (_req, res) => {
  const [byLead, byBooking, byListing] = await Promise.all([
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    db.listing.groupBy({ by: ["status"], where: { archived: false }, _count: { _all: true } }),
  ]);
  res.json({ leads: byLead, bookings: byBooking, listings: byListing });
});

admin.get("/reports/enquiries.csv", requireRole("ADMIN", "MANAGER"), async (_req, res) => {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const header = ["reference", "createdAt", "type", "status", "name", "email", "phone", "suburb", "budget", "preferredContact", "message"];
  const lines = [header.join(",")];
  for (const lead of leads) {
    lines.push([lead.reference, lead.createdAt.toISOString(), lead.type, lead.status, lead.name, lead.email, lead.phone, lead.suburb, lead.budget, lead.preferredContact, lead.message].map(csvEscape).join(","));
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(lines.join("\n"));
});
