import { Router } from "express";
import { Prisma, type ListingStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "../db.js";

const querySchema = z.object({
  type: z.enum(["SALE", "RENT"]).optional(),
  category: z.enum(["HOUSE", "APARTMENT", "TOWNHOUSE", "COMMERCIAL", "INDUSTRIAL", "LAND"]).optional(),
  suburb: z.string().max(80).optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  parking: z.coerce.number().int().min(0).optional(),
  view: z.enum(["portfolio", "sold", "featured"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});

const imageSelect = { sourceRef: true, storageKey: true, alt: true, position: true, kind: true, isPrimary: true } as const;

function categoryFilter(type?: "SALE" | "RENT", category?: string): Prisma.ListingWhereInput {
  if (category === "COMMERCIAL") return { category: { in: ["COMMERCIAL", "INDUSTRIAL"] } };
  if (category) return { category: category as Prisma.EnumCategoryFilter["equals"] };
  if (type) return { category: { notIn: ["COMMERCIAL", "INDUSTRIAL", "LAND"] } };
  return {};
}

export const listings = Router();

listings.get("/suburbs", async (_req, res) => {
  const rows = await db.listing.groupBy({
    by: ["suburb"],
    where: { archived: false, status: "ACTIVE" },
    _count: { suburb: true },
    orderBy: { _count: { suburb: "desc" } },
    take: 8,
  });
  res.json({ items: rows.map((row) => ({ suburb: row.suburb, count: row._count.suburb })) });
});

listings.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid search parameters" });
  const filters = parsed.data;
  const where: Prisma.ListingWhereInput = {
    archived: false,
    ...categoryFilter(filters.view ? undefined : filters.type, filters.view ? undefined : filters.category),
    listingType: filters.view ? undefined : filters.type,
    suburb: filters.suburb ? { contains: filters.suburb, mode: "insensitive" } : undefined,
    beds: filters.beds !== undefined ? { gte: filters.beds } : undefined,
    baths: filters.baths !== undefined ? { gte: filters.baths } : undefined,
    parking: filters.parking !== undefined ? { gte: filters.parking } : undefined,
    priceMin: filters.maxPrice !== undefined ? { lte: filters.maxPrice } : undefined,
    priceMax: filters.minPrice !== undefined ? { gte: filters.minPrice } : undefined,
  };
  if (filters.view === "portfolio") where.status = { in: ["ACTIVE", "UNDER_OFFER", "SOLD", "LEASED"] };
  else if (filters.view === "sold") where.status = "SOLD";
  else if (filters.view === "featured") {
    where.status = "ACTIVE";
    where.featured = true;
  } else where.status = "ACTIVE";

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    filters.sort === "price_asc" ? { priceMin: { sort: "asc", nulls: "last" } }
      : filters.sort === "price_desc" ? { priceMax: { sort: "desc", nulls: "last" } }
        : { createdAt: "desc" };
  const take = 12;
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      take,
      skip: (filters.page - 1) * take,
      orderBy,
      include: { images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 } },
    }),
    db.listing.count({ where }),
  ]);
  res.json({
    items: rows.map((row) => ({
      slug: row.slug,
      reference: row.reference,
      headline: row.headline,
      suburb: row.suburb,
      state: row.state,
      priceLabel: row.priceLabel,
      beds: row.beds,
      baths: row.baths,
      parking: row.parking,
      status: row.status,
      category: row.category,
      listingType: row.listingType,
      featured: row.featured,
      image: row.images[0] ? { storageKey: row.images[0].storageKey, sourceRef: row.images[0].sourceRef, alt: row.images[0].alt } : null,
    })),
    total,
    page: filters.page,
    pageSize: take,
  });
});

listings.get("/:slug", async (req, res) => {
  const listing = await db.listing.findUnique({
    where: { slug: req.params.slug },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
      features: { orderBy: { position: "asc" } },
      agent: true,
    },
  });
  if (!listing || listing.archived || listing.status === "OFF_MARKET" || listing.status === "WITHDRAWN") {
    return res.status(404).json({ error: "Not found" });
  }
  const similar = await db.listing.findMany({
    where: {
      archived: false,
      status: "ACTIVE",
      id: { not: listing.id },
      OR: [{ suburb: listing.suburb }, { category: listing.category, listingType: listing.listingType }],
    },
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { slug: true, headline: true, suburb: true, priceLabel: true, status: true, category: true },
  });
  const agent = listing.agent?.published
    ? { name: listing.agent.name, title: listing.agent.title, phone: listing.agent.phone, email: listing.agent.email, photoKey: listing.agent.photoKey }
    : null;
  res.json({
    slug: listing.slug,
    reference: listing.reference,
    headline: listing.headline,
    description: listing.description,
    status: listing.status as ListingStatus,
    category: listing.category,
    listingType: listing.listingType,
    priceLabel: listing.priceLabel,
    addressLine: listing.addressLine,
    suburb: listing.suburb,
    state: listing.state,
    postcode: listing.postcode,
    beds: listing.beds,
    baths: listing.baths,
    parking: listing.parking,
    landSqm: listing.landSqm,
    floorSqm: listing.floorSqm,
    featured: listing.featured,
    lat: listing.showExactLocation ? listing.lat : null,
    lng: listing.showExactLocation ? listing.lng : null,
    images: listing.images.map((image) => ({ ...imageSelect, ...pickImage(image) })),
    features: listing.features.map((feature) => feature.label),
    agent,
    similar,
  });
});

function pickImage(image: { sourceRef: string; storageKey: string | null; alt: string; position: number; kind: string; isPrimary: boolean }) {
  return image;
}
