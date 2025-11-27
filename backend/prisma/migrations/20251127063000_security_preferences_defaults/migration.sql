-- Manually added to capture default preference controls in security settings.
ALTER TABLE "security_preferences"
  ADD COLUMN "default_recording_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "cdr_retention_days" INTEGER NOT NULL DEFAULT 365,
  ADD COLUMN "default_buyer_cap" INTEGER;
