import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { config } from "../config.js";
import { makeReference } from "../reference.js";
import { emailNote, sendEmail } from "../services/email.js";
import { formatMelbourne, zonedToUtc } from "../time.js";

const phone = z.string().regex(/^(\+?61|0)[2-478](?:[ -]?\d){8}$/, "Enter an Australian phone number");

const schema = z.object({
  kind: z.enum(["INSPECTION", "CONSULTATION"]),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
  phone,
  date: z.string(),
  time: z.string(),
  message: z.string().max(2000).optional(),
  listingSlug: z.string().optional(),
  website: z.string().max(0).optional(),
});

export const bookings = Router();

bookings.post("/", rateLimit({ windowMs: 10 * 60_000, limit: 8 }), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the highlighted fields", issues: parsed.error.flatten().fieldErrors });
  const data = parsed.data;
  let startsAt: Date;
  try {
    startsAt = zonedToUtc(data.date, data.time);
  } catch {
    return res.status(400).json({ error: "Please check the highlighted fields", issues: { date: ["Use a valid date and time"] } });
  }
  const latest = Date.now() + 366 * 24 * 3600_000;
  if (startsAt.getTime() < Date.now() - 5 * 60_000 || startsAt.getTime() > latest) {
    return res.status(400).json({ error: "Choose a future time within the next year", issues: { date: ["Choose a future time within the next year"] } });
  }
  const listing = data.listingSlug ? await db.listing.findUnique({ where: { slug: data.listingSlug } }) : null;
  if (data.listingSlug && !listing) return res.status(400).json({ error: "That property could not be found" });
  const minutes = data.kind === "INSPECTION" ? 30 : 45;
  const reference = makeReference("B");
  const booking = await db.booking.create({
    data: {
      reference,
      kind: data.kind,
      listingId: listing?.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + minutes * 60_000),
      status: "PENDING",
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      message: data.message?.trim() || null,
    },
  });
  await db.lead.create({
    data: {
      reference: makeReference("E"),
      type: data.kind === "INSPECTION" ? "INSPECTION" : "CONSULTATION",
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message?.trim() || null,
      listingId: listing?.id,
      suburb: listing?.suburb,
      vaultreSync: "NOT_APPLICABLE",
      events: { create: { kind: "CREATED", detail: `Booking ${reference} is pending approval` } },
    },
  });
  const when = formatMelbourne(startsAt);
  const email = await sendEmail({
    to: config.NOTIFY_EMAIL || "unconfigured@localhost",
    subject: `${data.kind === "INSPECTION" ? "Inspection" : "Consultation"} request ${reference}`,
    text: [
      `Reference: ${reference}`,
      `Status: PENDING — this is not confirmed`,
      `When: ${when} (Australia/Melbourne)`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      listing ? `Property: ${listing.reference} ${listing.headline}` : "Property: not specified",
      "",
      data.message ?? "",
    ].join("\n"),
    relatedType: "booking",
    relatedId: booking.id,
  });
  res.status(201).json({
    reference,
    status: "PENDING",
    email: email.delivered ? "sent" : email.reason,
    message: `Request ${reference} is pending. It is not confirmed until a member of the team approves it. Requested time: ${when}. ${emailNote(email)}`,
  });
});
