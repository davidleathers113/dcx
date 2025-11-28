/*
  Warnings:

  - A unique constraint covering the columns `[short_id]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leads_api_key]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numbers_api_key]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[short_id]` on the table `traffic_sources` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "buyers_status_idx";

-- DropIndex
DROP INDEX "phone_numbers_campaign_id_supplier_id_idx";

-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "converted_monthly_limit" INTEGER,
ADD COLUMN     "converted_monthly_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "converted_total_limit" INTEGER,
ADD COLUMN     "converted_total_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_cap_revenue_cents" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "revenue_cap_daily_cents" INTEGER,
ADD COLUMN     "revenue_cap_monthly_cents" INTEGER,
ADD COLUMN     "revenue_cap_total_cents" INTEGER,
ADD COLUMN     "revenue_used_daily_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenue_used_monthly_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenue_used_total_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "enable_public_posting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leads_api_key" TEXT,
ADD COLUMN     "numbers_api_key" TEXT,
ADD COLUMN     "short_id" TEXT;

-- AlterTable
ALTER TABLE "phone_numbers" ADD COLUMN     "traffic_source_id" TEXT;

-- AlterTable
ALTER TABLE "traffic_sources" ADD COLUMN     "call_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_call_at" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number_limit" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "recent_call_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "short_id" TEXT;

-- CreateTable
CREATE TABLE "campaign_audit_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_audit_logs_campaign_id_idx" ON "campaign_audit_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "buyers_status_tier_idx" ON "buyers"("status", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_short_id_key" ON "campaigns"("short_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_leads_api_key_key" ON "campaigns"("leads_api_key");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_numbers_api_key_key" ON "campaigns"("numbers_api_key");

-- CreateIndex
CREATE INDEX "phone_numbers_traffic_source_id_idx" ON "phone_numbers"("traffic_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_sources_short_id_key" ON "traffic_sources"("short_id");

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_traffic_source_id_fkey" FOREIGN KEY ("traffic_source_id") REFERENCES "traffic_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_audit_logs" ADD CONSTRAINT "campaign_audit_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
