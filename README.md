# V Group Real Estate

The existing React/Vite website is paired with an Express/TypeScript API and a
PostgreSQL database managed through Prisma. The public website only displays
property, agent and testimonial records that exist in the database and are
eligible for publication; no real-world listing or staff profile is fabricated.

## Project layout

- `frontend/` — React 18, React Router and Vite public website and staff desk.
- `backend/` — Express API, authentication, CRM, booking, uploads, email adapter
  and Prisma schema/migrations.
- `backend/prisma/` — database schema and versioned PostgreSQL migrations.

## Local setup

Requirements: Node.js 20.19+ or 22.12+, npm, and a PostgreSQL database.

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string. Do not commit the
   real `.env` file. For Neon, use the pooled URL for application requests and
   set `DIRECT_URL` to the unpooled/direct URL for Prisma migrations. In Neon
   Console, open the project and branch, choose **Connect**, select the
   `neondb` database and the app role, then copy both the pooled and direct
   connection strings into their respective variables.
3. Optionally set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12
   characters. These create or update the initial administrator when seeding.
4. Install and initialize the backend:

   ```sh
   cd backend
   npm ci
   npm run db:setup
   npm run dev
   ```

   `db:setup` applies committed migrations and seeds page copy/FAQs. It creates
   an admin account only when the admin environment values are set. Fixture
   listing data is disabled by default.
5. In another terminal, install and start the frontend:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

   Open the Vite URL (normally `http://localhost:5173`). Its `/api` requests
   proxy to the API on port `4000`.

For schema work during local development, use `npm run db:migrate` from
`backend/`, then commit the generated Prisma migration. Use `npm run db:deploy`
for deployment environments. The migrations have not been applied to any
remote database in this repository.

## Website routes

The public routes include `/`, `/buy`, `/rent`, `/commercial`, `/land`,
`/portfolio`, `/property/:slug`, `/sell`, `/lease`, `/about`, `/services`,
`/team`, `/testimonials`, `/contact`, `/book-inspection`,
`/book-consultation`, `/privacy`, `/terms`, `/cookies`, and `/ai-disclosure`.
Unknown paths show a custom 404.

`/admin` is the staff sign-in and dashboard. Its API requires a valid staff
session and applies server-side role checks. Property, lead, booking, agent,
testimonial, FAQ, website content, settings and report operations are backed
by the existing API. Public agent and testimonial pages only display published
and approved records.

## Configuration and launch status

- PostgreSQL, production hosting/DNS, SMTP delivery, and optional VaultRE
  credentials must be configured by the business; this workspace does not
  contain those credentials.
- Email is reported as unavailable until an SMTP provider and notification
  address are configured. Booking requests remain pending until an authorised
  staff member approves them.
- VaultRE stays behind its adapter and does not write or overwrite listings
  unless configured and explicitly enabled by the business.
- The site has not been deployed or connected to `vgrouprealestate.com.au`.

## Demo deployment

The demo deployment uses a Render web service for the API and a Vercel project
for the frontend. The Vercel API and uploads handlers proxy to Render so the
staff session cookie remains same-origin with the website.

1. Import the repository into Render from `render.yaml`. Set `DATABASE_URL`
   and `DIRECT_URL` to the Neon connection for the demo database/branch.
   The Render start command runs `prisma migrate deploy` before starting the
   API. Fixture seeding stays disabled.
2. Set `CORS_ORIGIN` and `PUBLIC_SITE_URL` in Render to the Vercel deployment
   origin.
3. Import the same repository into Vercel with the root directory set to
   `frontend`. Set `BACKEND_URL` to the Render service's HTTPS origin and
   deploy.
4. Verify `/api/health` on the deployed website. Configure `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` in Render only if the demo needs staff-dashboard access;
   use a unique password and run `npm run db:seed` from a trusted environment.

Both platforms' free demo services may sleep while idle. Property listings
remain empty unless the business adds verified records.

## Validation

Run `npm run build` in both `frontend/` and `backend/`. Run `npm test` in
`backend/` for the current automated test suite.
