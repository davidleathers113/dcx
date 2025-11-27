-- Manually generated to introduce supporting tables for the admin dashboards.
-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NoticeCategory" AS ENUM ('COMPLIANCE', 'CARRIER', 'RELEASE', 'PLATFORM');

-- CreateEnum
CREATE TYPE "PlatformMigrationPhase" AS ENUM ('DISCOVERY', 'BUILD', 'CUTOVER', 'VERIFY', 'COMPLETE');

-- CreateEnum
CREATE TYPE "PlatformMigrationRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "WebhookDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CLEARED', 'FAILED');

-- CreateEnum
CREATE TYPE "SecretScope" AS ENUM ('TELEPHONY', 'SECURITY', 'PLATFORM', 'INTEGRATION', 'BILLING');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'OPS', 'ENGINEERING', 'FINANCE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('TELEPHONY', 'CRM', 'ANALYTICS', 'NOTIFICATION', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONNECTED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('TWILIO', 'TELNYX', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'REVIEW', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "RetargetListStatus" AS ENUM ('HEALTHY', 'PAUSED', 'BUILDING');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SmsDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "BlastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoicemailStatus" AS ENUM ('NEW', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RingPoolMode" AS ENUM ('STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "ScheduleTargetType" AS ENUM ('BUYER', 'CAMPAIGN', 'SUPPLIER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "RoutingExceptionType" AS ENUM ('CAP_BREACH', 'BUYER_REJECT', 'TWILIO_ERROR', 'INTERNAL_ERROR', 'NO_ROUTE');

-- AlterTable
ALTER TABLE "call_sessions" ADD COLUMN     "traffic_source_id" TEXT;

-- AlterTable
ALTER TABLE "phone_numbers" ADD COLUMN     "ring_pool_id" TEXT;

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT,
    "affected_resource" TEXT,
    "sla_minutes" INTEGER,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acked_at" TIMESTAMP(3),
    "acked_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "NoticeCategory" NOT NULL,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_migrations" (
    "id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "target_system" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "phase" "PlatformMigrationPhase" NOT NULL,
    "risk" "PlatformMigrationRisk" NOT NULL,
    "cutover_date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "dependencies" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "direction" "WebhookDirection" NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "payload_digest" TEXT NOT NULL,
    "trace_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "severity" "LogSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "trace_id" TEXT,
    "call_session_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_statements" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_cost_cents" INTEGER NOT NULL,
    "payments_applied_cents" INTEGER NOT NULL DEFAULT 0,
    "balance_cents" INTEGER NOT NULL DEFAULT 0,
    "pdf_url" TEXT,
    "status" "StatementStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_payments" (
    "id" TEXT NOT NULL,
    "statement_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_rates" (
    "id" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "voice_inbound_rate_micro" INTEGER NOT NULL,
    "voice_outbound_rate_micro" INTEGER NOT NULL,
    "sms_rate_micro" INTEGER NOT NULL,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_items" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "scope" "SecretScope" NOT NULL,
    "rotation_due_at" TIMESTAMP(3) NOT NULL,
    "masked_value" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secret_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "pager_number" TEXT,
    "on_call_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT,
    "name" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_preferences" (
    "id" TEXT NOT NULL,
    "mfa_required" BOOLEAN NOT NULL,
    "ip_allow_list" JSONB,
    "last_audit_at" TIMESTAMP(3),
    "webhook_signing_secret" TEXT,
    "api_key_rotation_days" INTEGER NOT NULL DEFAULT 90,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_accounts" (
    "id" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'HEALTHY',
    "last_heartbeat_at" TIMESTAMP(3),
    "credential_ref" TEXT,
    "region" TEXT,
    "failover_preference" INTEGER NOT NULL DEFAULT 1,
    "capacity_share" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),
    "documentation_url" TEXT,
    "install_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_api_keys" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "token_preview" TEXT NOT NULL,
    "scopes" TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retarget_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaign_id" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "last_push_at" TIMESTAMP(3),
    "status" "RetargetListStatus" NOT NULL DEFAULT 'HEALTHY',
    "rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retarget_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "supplier_id" TEXT,
    "retarget_list_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "score" INTEGER,
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_import_jobs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaign_id" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "rows_total" INTEGER NOT NULL DEFAULT 0,
    "rows_imported" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_report_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lead_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_blasts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaign_id" TEXT,
    "status" "BlastStatus" NOT NULL DEFAULT 'DRAFT',
    "audience_size" INTEGER NOT NULL DEFAULT 0,
    "template" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_blasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_blast_sends" (
    "id" TEXT NOT NULL,
    "blast_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'QUEUED',
    "delivered_at" TIMESTAMP(3),
    "error_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_blast_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_messages" (
    "id" TEXT NOT NULL,
    "direction" "SmsDirection" NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL,
    "body" TEXT NOT NULL,
    "lead_id" TEXT,
    "call_session_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_registrations" (
    "id" TEXT NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "a2p_brand_id" TEXT,
    "a2p_campaign_id" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_opt_outs" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "opted_out_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_opt_outs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callback_requests" (
    "id" TEXT NOT NULL,
    "call_session_id" TEXT NOT NULL,
    "status" "CallbackStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "assigned_to" TEXT,
    "notes" TEXT,
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "callback_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voicemails" (
    "id" TEXT NOT NULL,
    "call_session_id" TEXT NOT NULL,
    "status" "VoicemailStatus" NOT NULL DEFAULT 'NEW',
    "recording_url" TEXT NOT NULL,
    "transcription" TEXT,
    "assigned_to" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voicemails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ring_pools" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "supplier_id" TEXT,
    "label" TEXT NOT NULL,
    "mode" "RingPoolMode" NOT NULL DEFAULT 'STATIC',
    "target_size" INTEGER NOT NULL DEFAULT 0,
    "healthy_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ring_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_rules" (
    "id" TEXT NOT NULL,
    "target_type" "ScheduleTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "days_of_week" INTEGER[],
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "supplier_id" TEXT,
    "cpl_cents" INTEGER,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_exceptions" (
    "id" TEXT NOT NULL,
    "call_session_id" TEXT,
    "campaign_id" TEXT,
    "buyer_id" TEXT,
    "type" "RoutingExceptionType" NOT NULL,
    "message" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "routing_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_status_severity_idx" ON "alerts"("status", "severity");

-- CreateIndex
CREATE INDEX "notices_effective_at_idx" ON "notices"("effective_at");

-- CreateIndex
CREATE INDEX "platform_migrations_phase_risk_idx" ON "platform_migrations"("phase", "risk");

-- CreateIndex
CREATE INDEX "webhook_logs_direction_created_at_idx" ON "webhook_logs"("direction", "created_at");

-- CreateIndex
CREATE INDEX "system_logs_component_severity_created_at_idx" ON "system_logs"("component", "severity", "created_at");

-- CreateIndex
CREATE INDEX "billing_statements_period_start_period_end_idx" ON "billing_statements"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "billing_payments_statement_id_received_at_idx" ON "billing_payments"("statement_id", "received_at");

-- CreateIndex
CREATE INDEX "carrier_rates_carrier_country_code_idx" ON "carrier_rates"("carrier", "country_code");

-- CreateIndex
CREATE INDEX "secret_items_scope_rotation_due_at_idx" ON "secret_items"("scope", "rotation_due_at");

-- CreateIndex
CREATE INDEX "team_members_team_id_role_idx" ON "team_members"("team_id", "role");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_event_status_idx" ON "webhook_subscriptions"("event", "status");

-- CreateIndex
CREATE INDEX "leads_stage_created_at_idx" ON "leads"("stage", "created_at");

-- CreateIndex
CREATE INDEX "lead_events_lead_id_idx" ON "lead_events"("lead_id");

-- CreateIndex
CREATE INDEX "sms_blast_sends_blast_id_idx" ON "sms_blast_sends"("blast_id");

-- CreateIndex
CREATE INDEX "sms_messages_direction_occurred_at_idx" ON "sms_messages"("direction", "occurred_at");

-- CreateIndex
CREATE INDEX "messaging_registrations_channel_idx" ON "messaging_registrations"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "sms_opt_outs_phone_number_key" ON "sms_opt_outs"("phone_number");

-- CreateIndex
CREATE INDEX "callback_requests_status_priority_idx" ON "callback_requests"("status", "priority");

-- CreateIndex
CREATE INDEX "voicemails_status_received_at_idx" ON "voicemails"("status", "received_at");

-- CreateIndex
CREATE INDEX "ring_pools_campaign_id_supplier_id_idx" ON "ring_pools"("campaign_id", "supplier_id");

-- CreateIndex
CREATE INDEX "schedule_rules_target_type_target_id_idx" ON "schedule_rules"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "routing_exceptions_occurred_at_idx" ON "routing_exceptions"("occurred_at");

-- CreateIndex
CREATE INDEX "call_sessions_traffic_source_id_idx" ON "call_sessions"("traffic_source_id");

-- CreateIndex
CREATE INDEX "phone_numbers_ring_pool_id_idx" ON "phone_numbers"("ring_pool_id");

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_ring_pool_id_fkey" FOREIGN KEY ("ring_pool_id") REFERENCES "ring_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_traffic_source_id_fkey" FOREIGN KEY ("traffic_source_id") REFERENCES "traffic_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "billing_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retarget_lists" ADD CONSTRAINT "retarget_lists_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_retarget_list_id_fkey" FOREIGN KEY ("retarget_list_id") REFERENCES "retarget_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_import_jobs" ADD CONSTRAINT "lead_import_jobs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_blasts" ADD CONSTRAINT "sms_blasts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_blast_sends" ADD CONSTRAINT "sms_blast_sends_blast_id_fkey" FOREIGN KEY ("blast_id") REFERENCES "sms_blasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_registrations" ADD CONSTRAINT "messaging_registrations_phone_number_id_fkey" FOREIGN KEY ("phone_number_id") REFERENCES "phone_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callback_requests" ADD CONSTRAINT "callback_requests_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voicemails" ADD CONSTRAINT "voicemails_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ring_pools" ADD CONSTRAINT "ring_pools_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ring_pools" ADD CONSTRAINT "ring_pools_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_sources" ADD CONSTRAINT "traffic_sources_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_exceptions" ADD CONSTRAINT "routing_exceptions_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_exceptions" ADD CONSTRAINT "routing_exceptions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_exceptions" ADD CONSTRAINT "routing_exceptions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
