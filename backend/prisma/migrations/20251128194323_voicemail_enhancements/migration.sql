/*
  Warnings:

  - You are about to drop the column `assigned_to` on the `voicemails` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VoicemailPriority" AS ENUM ('NORMAL', 'HIGH');

-- AlterTable
ALTER TABLE "voicemails" DROP COLUMN "assigned_to",
ADD COLUMN     "assigned_to_id" TEXT,
ADD COLUMN     "callback_scheduled_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" "VoicemailPriority" NOT NULL DEFAULT 'NORMAL';

-- AddForeignKey
ALTER TABLE "voicemails" ADD CONSTRAINT "voicemails_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
