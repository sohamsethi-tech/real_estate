import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { config } from "./config.js";
import { db } from "./db.js";
import { listings } from "./routes/listings.js";
import { leads } from "./routes/leads.js";
import { auth } from "./routes/auth.js";
import { bookings } from "./routes/bookings.js";
import { content } from "./routes/content.js";
import { admin } from "./routes/admin.js";

const pages = ["/", "/buy", "/rent", "/commercial", "/land", "/portfolio", "/sell", "/lease", "/about", "/services", "/team", "/testimonials", "/contact", "/book-inspection", "/book-consultation", "/privacy", "/terms", "/cookies", "/ai-disclosure"];

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin === config.CORS_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-VG-Request");
        return res.status(204).end();
      }
    }
    next();
  });
  app.use(express.json({ limit: "300kb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve("uploads"), { maxAge: "7d", fallthrough: false }));

  app.get("/api/health", async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: "Operational", database: "Operational" });
    } catch {
      res.status(503).json({ status: "Unavailable", database: "Unavailable" });
    }
  });
  app.use("/api/listings", listings);
  app.use("/api/leads", leads);
  app.use("/api/bookings", bookings);
  app.use("/api/content", content);
  app.use("/api/auth", auth);
  app.use("/api/admin", admin);

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${config.PUBLIC_SITE_URL.replace(/\/$/, "")}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", async (_req, res) => {
    const listings = await db.listing.findMany({
      where: { archived: false, status: { in: ["ACTIVE", "UNDER_OFFER", "SOLD", "LEASED"] } },
      select: { slug: true, updatedAt: true },
    });
    const origin = config.PUBLIC_SITE_URL.replace(/\/$/, "");
    const urls = [
      ...pages.map((page) => `<url><loc>${origin}${page}</loc></url>`),
      ...listings.map((item) => `<url><loc>${origin}/property/${item.slug}</loc><lastmod>${item.updatedAt.toISOString()}</lastmod></url>`),
    ];
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
  });

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if ("code" in err && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "That file is larger than 8 MB" });
    }
    console.error(err.name);
    res.status(500).json({ error: "Something went wrong" });
  });
  return app;
}
