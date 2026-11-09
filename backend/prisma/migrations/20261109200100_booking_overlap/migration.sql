CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_overlap
EXCLUDE USING gist (
  "agentId" WITH =,
  tsrange("startsAt", "endsAt") WITH &&
)
WHERE ("status" IN ('PENDING', 'APPROVED'));
