process.env.NODE_ENV = "test";
process.env.EMBEDDED_POSTGRES = "true";
process.env.EMBEDDED_PORT = "54330";
process.env.EMBEDDED_DATA_DIR = ".pgdata-test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54330/vgroup?schema=public";
process.env.ADMIN_EMAIL = "admin@vgroup.local";
process.env.ADMIN_PASSWORD = "test-password-123";
process.env.ADMIN_NAME = "Test Admin";
process.env.SEED_FIXTURES = "false";
process.env.USE_FIXTURES = "false";
process.env.SESSION_TTL_HOURS = "8";
process.env.PUBLIC_SITE_URL = "http://localhost:5173";
process.env.PORT = "0";
delete process.env.SMTP_HOST;
delete process.env.NOTIFY_EMAIL;

const { execSync } = await import("node:child_process");
const { startEmbedded } = await import("./embedded.js");
const { seed } = await import("./seed.js");
const { createApp } = await import("./app.js");
const { db } = await import("./db.js");

await startEmbedded();
execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit", env: process.env });
await seed();

const app = createApp();
const server = app.listen(0);
const address = server.address();
if (!address || typeof address === "string") throw new Error("No test port");
const base = `http://127.0.0.1:${address.port}`;

async function call(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (init?.method && init.method !== "GET") headers.set("X-VG-Request", "1");
  const response = await fetch(base + path, { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) as Record<string, unknown> : {};
  return { response, data };
}

const health = await call("/api/health");
if (health.response.status !== 200) throw new Error("Health check failed");

const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@vgroup.local", password: "test-password-123" }) });
if (login.response.status !== 200) throw new Error("Login failed");
const cookie = login.response.headers.getSetCookie?.()[0]?.split(";")[0] ?? "";
if (!cookie.startsWith("vg_session=")) throw new Error("Session cookie missing");

const created = await call("/api/admin/listings", {
  method: "POST",
  headers: { cookie },
  body: JSON.stringify({
    headline: "DEV FIXTURE internal listing",
    description: "Development record created by the test suite. Not a real property.",
    addressLine: "DEV FIXTURE - not a real address",
    suburb: "Richmond",
    state: "VIC",
    postcode: "3121",
    listingType: "SALE",
    category: "HOUSE",
    status: "ACTIVE",
    priceLabel: "Contact agent",
    beds: 3,
    baths: 2,
    parking: 1,
    features: ["Test feature"],
    featured: true,
  }),
});
if (created.response.status !== 201) throw new Error(`Create listing failed ${created.response.status} ${JSON.stringify(created.data)}`);
const slug = String(created.data.slug);

const search = await call("/api/listings?type=SALE&suburb=Richmond");
const items = search.data.items as Array<{ slug: string }>;
if (!items.some((item) => item.slug === slug)) throw new Error("Public search missed the listing");

const detail = await call(`/api/listings/${slug}`);
if (detail.response.status !== 200 || detail.data.reference == null) throw new Error("Detail failed");

const enquiry = await call("/api/leads", {
  method: "POST",
  body: JSON.stringify({
    type: "PROPERTY",
    name: "Test Person",
    email: "person@example.com",
    phone: "0412345678",
    message: "Is this still available?",
    preferredContact: "EMAIL",
    listingSlug: slug,
    marketingConsent: false,
  }),
});
if (enquiry.response.status !== 201 || enquiry.data.email !== "not_configured") {
  throw new Error(`Enquiry did not stay honest about email: ${JSON.stringify(enquiry.data)}`);
}

const booking = await call("/api/bookings", {
  method: "POST",
  body: JSON.stringify({
    kind: "INSPECTION",
    name: "Test Person",
    email: "person@example.com",
    phone: "0412345678",
    date: "2026-12-01",
    time: "10:00",
    listingSlug: slug,
  }),
});
if (booking.response.status !== 201 || booking.data.status !== "PENDING") throw new Error("Booking was not left pending");

const desk = await call("/api/admin/leads?q=VG-", { headers: { cookie } });
const leads = desk.data.items as unknown[];
if (!leads.length) throw new Error("Admin desk did not show the enquiry");

const vault = await call("/api/admin/integrations/vaultre/probe", { method: "POST", headers: { cookie } });
if (vault.data.configured !== false || vault.data.writesEnabled !== false) throw new Error("VaultRE should stay closed");

await call(`/api/admin/listings/${created.data.id}?hard=true`, { method: "DELETE", headers: { cookie } });
const gone = await call(`/api/listings/${slug}`);
if (gone.response.status !== 404) throw new Error("Deleted listing still public");

console.log("Self-test passed");
server.close();
await db.$disconnect();
process.exit(0);
