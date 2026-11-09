import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db.js";
import { config } from "../config.js";
import { makeReference } from "../reference.js";
import { emailNote, sendEmail } from "../services/email.js";

const phone = z.string().regex(/^(\+?61|0)[2-478](?:[ -]?\d){8}$/, "Enter an Australian phone number");

const schema = z.object({
  type: z.enum(["BUY", "RENT", "PROPERTY", "SELL", "LANDLORD", "COMMERCIAL", "GENERAL", "CONSULTATION", "INSPECTION"]),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
  phone,
  message: z.string().max(2000).optional(),
  suburb: z.string().max(80).optional(),
  budget: z.string().max(80).optional(),
  preferredContact: z.enum(["EMAIL", "PHONE", "EITHER"]).default("EITHER"),
  listingSlug: z.string().optional(),
  marketingConsent: z.boolean().default(false),
  source: z.string().max(80).optional(),
  campaign: z.string().max(80).optional(),
  website: z.string().max(0).optional(),
});

export const leads = Router();

leads.post("/", rateLimit({ windowMs: 10 * 60_000, limit: 10 }), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the highlighted fields", issues: parsed.error.flatten().fieldErrors });
  const { listingSlug, website: _website, ...data } = parsed.data;
  const listing = listingSlug ? await db.listing.findUnique({ where: { slug: listingSlug } }) : null;
  if (listingSlug && !listing) return res.status(400).json({ error: "That property could not be found", issues: { listingSlug: ["Unknown property"] } });
  const reference = makeReference("E");
  const lead = await db.lead.create({
    data: {
      ...data,
      reference,
      listingId: listing?.id,
      message: data.message?.trim() || null,
      suburb: data.suburb?.trim() || listing?.suburb || null,
      budget: data.budget?.trim() || null,
      vaultreSync: "NOT_APPLICABLE",
      events: { create: { kind: "CREATED", detail: reference } },
    },
  });
  const email = config.NOTIFY_EMAIL
    ? await sendEmail({
      to: config.NOTIFY_EMAIL,
      subject: `New enquiry ${lead.reference}`,
      text: [
        `Reference: ${lead.reference}`,
        `Type: ${lead.type}`,
        `Name: ${lead.name}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        listing ? `Property: ${listing.reference} ${listing.headline}` : "",
        data.suburb ? `Location: ${data.suburb}` : "",
        data.budget ? `Budget: ${data.budget}` : "",
        `Preferred contact: ${lead.preferredContact}`,
        "",
        lead.message ?? "",
      ].filter(Boolean).join("\n"),
      relatedType: "lead",
      relatedId: lead.id,
    })
    : await sendEmail({
      to: "unconfigured@localhost",
      subject: `New enquiry ${lead.reference}`,
      text: "No notification address is configured.",
      relatedType: "lead",
      relatedId: lead.id,
    });
  res.status(201).json({
    reference: lead.reference,
    email: email.delivered ? "sent" : email.reason,
    message: `Your enquiry ${lead.reference} has been received. ${emailNote(email)}`,
  });
});
