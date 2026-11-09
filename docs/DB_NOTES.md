# Booking overlap protection

The PostgreSQL exclusion constraint preventing overlapping pending or approved
bookings for an assigned agent is maintained in
`backend/prisma/migrations/20261109200100_booking_overlap/migration.sql`.

Apply committed migrations with `npm run db:deploy` from `backend/`. Do not
apply the SQL separately; Prisma tracks the migration in `_prisma_migrations`.
The constraint intentionally does not block bookings until an agent is
assigned.
