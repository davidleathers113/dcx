// prisma/seed.ts
// Seed script for DCX backend.
// Run with: npx prisma db seed
// (Configure in package.json: "prisma": { "seed": "ts-node prisma/seed.ts" })

import { PrismaClient, SupplierType, Status, EndpointType, PricingModel, PoolType, StirShakenAttestation } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DCX test data...');

  // 1) Supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Test Supplier',
      type: SupplierType.EXTERNAL_PUBLISHER,
      contactEmail: 'supplier@example.com',
      contactPhone: '+15555550100',
      status: Status.ACTIVE
    }
  });

  // 2) Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Test Campaign - Inbound',
      vertical: 'SSDI',
      supplierId: supplier.id,
      status: Status.ACTIVE,
      recordingDefaultEnabled: true
    }
  });

  // 3) Buyer
  const buyer = await prisma.buyer.create({
    data: {
      name: 'Test Buyer',
      endpointType: EndpointType.PHONE_NUMBER,
      endpointValue: '+15005550006', // Twilio test number (no real call)
      concurrencyLimit: 5,
      dailyCap: 100,
      status: Status.ACTIVE,
      weight: 50,
      scheduleTimezone: 'America/New_York'
    }
  });

  // 4) Offer
  const offer = await prisma.offer.create({
    data: {
      buyerId: buyer.id,
      campaignId: campaign.id,
      pricingModel: PricingModel.CPA,
      payoutCents: 10000, // $100
      bufferSeconds: 60, // 60-second buffer
      attributionWindowDays: 30,
      dailyCap: 100,
      priority: 100,
      weight: 50,
      isActive: true
    }
  });

  // 5) Phone Number (for inbound calls)
  // NOTE: Replace e164 with your actual Twilio number when going live.
  const phoneNumber = await prisma.phoneNumber.create({
    data: {
      twilioSid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      e164: '+15005550006', // Twilio test number; swap for your real DID
      campaignId: campaign.id,
      supplierId: supplier.id,
      poolType: PoolType.STATIC,
      status: Status.ACTIVE,
      trustProfileId: null,
      stirShakenAttestation: StirShakenAttestation.UNKNOWN
    }
  });

  console.log('Seed complete:', {
    supplierId: supplier.id,
    campaignId: campaign.id,
    buyerId: buyer.id,
    offerId: offer.id,
    phoneNumber: phoneNumber.e164
  });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
