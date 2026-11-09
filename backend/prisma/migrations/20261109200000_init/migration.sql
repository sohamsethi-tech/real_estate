-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'AGENT', 'CONTENT_EDITOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'UNDER_OFFER', 'SOLD', 'LEASED', 'WITHDRAWN', 'OFF_MARKET');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('HOUSE', 'APARTMENT', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'LAND');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('INTERNAL', 'VAULTRE', 'FIXTURE');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('BUY', 'RENT', 'PROPERTY', 'SELL', 'LANDLORD', 'COMMERCIAL', 'GENERAL', 'CONSULTATION', 'INSPECTION');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'INSPECTION_SCHEDULED', 'NEGOTIATION', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "SyncState" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'RESCHEDULE_REQUESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingKind" AS ENUM ('INSPECTION', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE', 'EITHER');

-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('PHOTO', 'FLOORPLAN');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "suburbs" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "biography" TEXT,
    "photoKey" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "vaultreId" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'INTERNAL',
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "status" "ListingStatus" NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "category" "Category" NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "addressLine" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'VIC',
    "postcode" TEXT NOT NULL,
    "beds" INTEGER,
    "baths" INTEGER,
    "parking" INTEGER,
    "landSqm" DOUBLE PRECISION,
    "floorSqm" DOUBLE PRECISION,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "showExactLocation" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "storageKey" TEXT,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "ImageKind" NOT NULL DEFAULT 'PHOTO',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingFeature" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "LeadType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "listingId" TEXT,
    "suburb" TEXT,
    "budget" TEXT,
    "preferredContact" "ContactMethod" NOT NULL DEFAULT 'EITHER',
    "source" TEXT,
    "campaign" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "agentId" TEXT,
    "vaultreSync" "SyncState" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "vaultreSyncAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "detail" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" "BookingKind" NOT NULL,
    "listingId" TEXT,
    "agentId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN,
    "upserted" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "suburb" TEXT,
    "sourceNote" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "reason" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_reference_key" ON "Listing"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_vaultreId_key" ON "Listing"("vaultreId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_status_listingType_category_idx" ON "Listing"("status", "listingType", "category");

-- CreateIndex
CREATE INDEX "Listing_suburb_idx" ON "Listing"("suburb");

-- CreateIndex
CREATE INDEX "Listing_featured_idx" ON "Listing"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_startsAt_idx" ON "Booking"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_key_key" ON "Faq"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteContent_key_key" ON "WebsiteContent"("key");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingFeature" ADD CONSTRAINT "ListingFeature_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

