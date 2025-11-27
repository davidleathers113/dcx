-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('INTERNAL_CALL_CENTER', 'EXTERNAL_PUBLISHER', 'NETWORK');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EndpointType" AS ENUM ('PHONE_NUMBER', 'SIP');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('CPA', 'FIXED', 'CPC', 'REVSHARE');

-- CreateEnum
CREATE TYPE "PoolType" AS ENUM ('STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER');

-- CreateEnum
CREATE TYPE "RecordingConsentSource" AS ENUM ('IMPLICIT_IVR', 'AGENT_VERBAL', 'NONE');

-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('NONE', 'PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StirShakenAttestation" AS ENUM ('A', 'B', 'C', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AiJobType" AS ENUM ('TRANSCRIBE', 'QA_EVAL');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint_type" "EndpointType" NOT NULL,
    "endpoint_value" TEXT NOT NULL,
    "concurrency_limit" INTEGER NOT NULL,
    "daily_cap" INTEGER,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "weight" INTEGER NOT NULL DEFAULT 50,
    "schedule_timezone" TEXT,
    "schedule_rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "geo_rules" JSONB,
    "supplier_id" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "recording_default_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "pricing_model" "PricingModel" NOT NULL,
    "payout_cents" INTEGER NOT NULL,
    "buffer_seconds" INTEGER NOT NULL DEFAULT 60,
    "attribution_window_days" INTEGER NOT NULL DEFAULT 30,
    "daily_cap" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" TEXT NOT NULL,
    "twilio_sid" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "pool_type" "PoolType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "trust_profile_id" TEXT,
    "stir_shaken_attestation" "StirShakenAttestation",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_sessions" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "trace_id" TEXT NOT NULL,
    "twilio_call_sid" TEXT NOT NULL,
    "from_number" TEXT NOT NULL,
    "to_number" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "offer_id" TEXT,
    "status" "CallStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "billable_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "telephony_cost_cents" INTEGER NOT NULL DEFAULT 0,
    "revenue_estimated_cents" INTEGER NOT NULL DEFAULT 0,
    "recording_enabled" BOOLEAN NOT NULL DEFAULT false,
    "recording_url" TEXT,
    "recording_consent_source" "RecordingConsentSource",
    "transcription_status" "TranscriptionStatus" NOT NULL DEFAULT 'NONE',
    "transcription_text" TEXT,
    "sentiment_score" DOUBLE PRECISION,
    "llm_qa_score" DOUBLE PRECISION,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_events" (
    "id" TEXT NOT NULL,
    "call_session_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "revenue_cents" INTEGER,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_ai_jobs" (
    "id" TEXT NOT NULL,
    "call_session_id" TEXT NOT NULL,
    "job_type" "AiJobType" NOT NULL,
    "status" "AiJobStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "buyers_status_idx" ON "buyers"("status");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_supplier_id_idx" ON "campaigns"("supplier_id");

-- CreateIndex
CREATE INDEX "offers_campaign_id_is_active_priority_idx" ON "offers"("campaign_id", "is_active", "priority");

-- CreateIndex
CREATE INDEX "offers_buyer_id_is_active_idx" ON "offers"("buyer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers_twilio_sid_key" ON "phone_numbers"("twilio_sid");

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers_e164_key" ON "phone_numbers"("e164");

-- CreateIndex
CREATE INDEX "phone_numbers_campaign_id_idx" ON "phone_numbers"("campaign_id");

-- CreateIndex
CREATE INDEX "phone_numbers_supplier_id_idx" ON "phone_numbers"("supplier_id");

-- CreateIndex
CREATE INDEX "phone_numbers_campaign_id_supplier_id_idx" ON "phone_numbers"("campaign_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "call_sessions_public_id_key" ON "call_sessions"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "call_sessions_twilio_call_sid_key" ON "call_sessions"("twilio_call_sid");

-- CreateIndex
CREATE INDEX "call_sessions_campaign_id_created_at_idx" ON "call_sessions"("campaign_id", "created_at");

-- CreateIndex
CREATE INDEX "call_sessions_supplier_id_created_at_idx" ON "call_sessions"("supplier_id", "created_at");

-- CreateIndex
CREATE INDEX "call_sessions_buyer_id_created_at_idx" ON "call_sessions"("buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "call_sessions_status_idx" ON "call_sessions"("status");

-- CreateIndex
CREATE INDEX "conversion_events_call_session_id_idx" ON "conversion_events"("call_session_id");

-- CreateIndex
CREATE INDEX "conversion_events_buyer_id_event_time_idx" ON "conversion_events"("buyer_id", "event_time");

-- CreateIndex
CREATE INDEX "call_ai_jobs_call_session_id_job_type_status_idx" ON "call_ai_jobs"("call_session_id", "job_type", "status");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_ai_jobs" ADD CONSTRAINT "call_ai_jobs_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
