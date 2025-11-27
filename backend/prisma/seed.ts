// prisma/seed.ts
// Seed script for DCX backend.
// Run with: pnpm prisma db seed

import {
  PrismaClient,
  SupplierType,
  Status,
  EndpointType,
  PricingModel,
  PoolType,
  StirShakenAttestation,
  CallStatus,
  AlertSeverity,
  AlertStatus,
  NoticeCategory,
  PlatformMigrationPhase,
  PlatformMigrationRisk,
  WebhookDirection,
  LogSeverity,
  StatementStatus,
  PaymentStatus,
  SecretScope,
  TeamRole,
  IntegrationCategory,
  IntegrationStatus,
  ProviderType,
  ProviderStatus,
  LeadStage,
  RetargetListStatus,
  ImportStatus,
  SmsDirection,
  SmsStatus,
  BlastStatus,
  CallbackStatus,
  VoicemailStatus,
  RingPoolMode,
  ScheduleTargetType,
  RoutingExceptionType
} from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.routingException.deleteMany(),
    prisma.systemLog.deleteMany(),
    prisma.webhookLog.deleteMany(),
    prisma.callbackRequest.deleteMany(),
    prisma.voicemail.deleteMany(),
    prisma.smsBlastSend.deleteMany(),
    prisma.smsBlast.deleteMany(),
    prisma.smsMessage.deleteMany(),
    prisma.messagingRegistration.deleteMany(),
    prisma.smsOptOut.deleteMany(),
    prisma.leadEvent.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.leadImportJob.deleteMany(),
    prisma.retargetList.deleteMany(),
    prisma.platformMigration.deleteMany(),
    prisma.notice.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.billingPayment.deleteMany(),
    prisma.billingStatement.deleteMany(),
    prisma.carrierRate.deleteMany(),
    prisma.secretItem.deleteMany(),
    prisma.securityPreference.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.webhookSubscription.deleteMany(),
    prisma.providerAccount.deleteMany(),
    prisma.integrationConfig.deleteMany(),
    prisma.adminApiKey.deleteMany(),
    prisma.scheduleRule.deleteMany(),
    prisma.trafficSource.deleteMany(),
    prisma.conversionEvent.deleteMany(),
    prisma.callAiJob.deleteMany(),
    prisma.callSession.deleteMany(),
    prisma.phoneNumber.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.buyer.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.supplier.deleteMany()
  ]);
}

async function main() {
  console.log('Seeding DCX test data...');
  await resetDatabase();

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Test Supplier',
      type: SupplierType.EXTERNAL_PUBLISHER,
      contactEmail: 'supplier@example.com',
      contactPhone: '+15555550100',
      status: Status.ACTIVE
    }
  });

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Test Campaign - Inbound',
      vertical: 'SSDI',
      supplierId: supplier.id,
      status: Status.ACTIVE,
      recordingDefaultEnabled: true
    }
  });

  const buyer = await prisma.buyer.create({
    data: {
      name: 'Test Buyer',
      endpointType: EndpointType.PHONE_NUMBER,
      endpointValue: '+15005550006',
      concurrencyLimit: 5,
      dailyCap: 100,
      status: Status.ACTIVE,
      weight: 50,
      scheduleTimezone: 'America/New_York'
    }
  });

  const offer = await prisma.offer.create({
    data: {
      buyerId: buyer.id,
      campaignId: campaign.id,
      pricingModel: PricingModel.CPA,
      payoutCents: 10000,
      bufferSeconds: 60,
      attributionWindowDays: 30,
      dailyCap: 100,
      priority: 100,
      weight: 50,
      isActive: true
    }
  });

  const ringPool = await prisma.ringPool.create({
    data: {
      campaignId: campaign.id,
      supplierId: supplier.id,
      label: 'Core SSDI Pool',
      mode: RingPoolMode.DYNAMIC,
      targetSize: 5,
      healthyCount: 4,
      notes: 'Primary intake pool seeded for demo'
    }
  });

  const phoneNumber = await prisma.phoneNumber.create({
    data: {
      twilioSid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      e164: '+15005550006',
      campaignId: campaign.id,
      supplierId: supplier.id,
      poolType: PoolType.STATIC,
      status: Status.ACTIVE,
      trustProfileId: null,
      stirShakenAttestation: StirShakenAttestation.UNKNOWN,
      ringPoolId: ringPool.id
    }
  });

  await prisma.messagingRegistration.create({
    data: {
      phoneNumberId: phoneNumber.id,
      channel: 'supplier_alerts',
      a2pBrandId: 'BR123',
      a2pCampaignId: 'CP456'
    }
  });

  await prisma.smsOptOut.create({
    data: {
      phoneNumber: '+15555550123',
      source: 'STOP',
      optedOutAt: hoursAgo(5)
    }
  });

  const trafficSource = await prisma.trafficSource.create({
    data: {
      name: 'Meta Ads - SSDI',
      channel: 'social',
      supplierId: supplier.id,
      cplCents: 1800
    }
  });

  const completedCall = await prisma.callSession.create({
    data: {
      publicId: 'call_pub_123',
      traceId: 'trace-001',
      twilioCallSid: 'CA1111',
      fromNumber: '+15551234567',
      toNumber: phoneNumber.e164,
      campaignId: campaign.id,
      supplierId: supplier.id,
      buyerId: buyer.id,
      offerId: offer.id,
      trafficSourceId: trafficSource.id,
      status: CallStatus.COMPLETED,
      createdAt: hoursAgo(6),
      answeredAt: hoursAgo(6 - 0.05),
      endedAt: hoursAgo(6 - 0.02),
      durationSeconds: 420,
      billableDurationSeconds: 360,
      telephonyCostCents: 210,
      revenueEstimatedCents: 10000,
      recordingEnabled: true,
      recordingUrl: 'https://example.com/recording.mp3'
    }
  });

  const inProgressCall = await prisma.callSession.create({
    data: {
      publicId: 'call_pub_124',
      traceId: 'trace-002',
      twilioCallSid: 'CA2222',
      fromNumber: '+14445550123',
      toNumber: phoneNumber.e164,
      campaignId: campaign.id,
      supplierId: supplier.id,
      buyerId: buyer.id,
      offerId: offer.id,
      trafficSourceId: trafficSource.id,
      status: CallStatus.IN_PROGRESS,
      createdAt: hoursAgo(1),
      recordingEnabled: false
    }
  });

  const failedCall = await prisma.callSession.create({
    data: {
      publicId: 'call_pub_125',
      traceId: 'trace-003',
      twilioCallSid: 'CA3333',
      fromNumber: '+18885550123',
      toNumber: phoneNumber.e164,
      campaignId: campaign.id,
      supplierId: supplier.id,
      buyerId: buyer.id,
      offerId: offer.id,
      trafficSourceId: trafficSource.id,
      status: CallStatus.FAILED,
      createdAt: hoursAgo(2),
      recordingEnabled: false,
      telephonyCostCents: 30,
      revenueEstimatedCents: 0
    }
  });

  await prisma.conversionEvent.create({
    data: {
      callSessionId: completedCall.id,
      buyerId: buyer.id,
      eventType: 'CASE_FILED',
      eventTime: hoursAgo(5.5),
      revenueCents: 10000,
      source: 'BUYER_WEBHOOK'
    }
  });

  await prisma.callAiJob.create({
    data: {
      callSessionId: completedCall.id,
      jobType: 'TRANSCRIBE',
      status: 'COMPLETED'
    }
  });

  await prisma.routingException.createMany({
    data: [
      {
        callSessionId: failedCall.id,
        campaignId: campaign.id,
        buyerId: buyer.id,
        type: RoutingExceptionType.BUYER_REJECT,
        message: 'Buyer rejected call due to cap',
        occurredAt: hoursAgo(2)
      },
      {
        campaignId: campaign.id,
        type: RoutingExceptionType.CAP_BREACH,
        message: 'Campaign cap reached during burst traffic',
        occurredAt: hoursAgo(10)
      }
    ]
  });

  await prisma.systemLog.createMany({
    data: [
      {
        component: 'telephony',
        severity: LogSeverity.INFO,
        message: 'Inbound call handled',
        traceId: completedCall.traceId,
        callSessionId: completedCall.id
      },
      {
        component: 'routing',
        severity: LogSeverity.ERROR,
        message: 'Buyer concurrency limit hit',
        traceId: failedCall.traceId,
        callSessionId: failedCall.id
      }
    ]
  });

  await prisma.webhookLog.createMany({
    data: [
      {
        direction: WebhookDirection.OUTBOUND,
        event: 'CALL_COMPLETED',
        url: 'https://hooks.example.com/calls',
        statusCode: 200,
        latencyMs: 320,
        payloadDigest: 'abc123',
        traceId: completedCall.traceId
      },
      {
        direction: WebhookDirection.OUTBOUND,
        event: 'CONVERSION_RECORDED',
        url: 'https://hooks.example.com/conversions',
        statusCode: 500,
        latencyMs: 900,
        payloadDigest: 'def456',
        traceId: completedCall.traceId
      }
    ]
  });

  await prisma.alert.createMany({
    data: [
      {
        title: 'Buyer cap breached',
        description: 'Buyer SSDI HQ rejected 4 calls in 10 minutes',
        severity: AlertSeverity.WARNING,
        status: AlertStatus.OPEN,
        category: 'routing',
        affectedResource: buyer.id,
        slaMinutes: 30
      },
      {
        title: 'Twilio credential expiring',
        description: 'Primary credential rotation due in 3 days',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACKNOWLEDGED,
        category: 'security',
        affectedResource: 'provider:twilio',
        slaMinutes: 120,
        ackedAt: hoursAgo(1),
        ackedBy: 'david'
      }
    ]
  });

  await prisma.notice.createMany({
    data: [
      {
        title: 'Planned Twilio maintenance',
        body: 'Twilio will perform maintenance Saturday 02:00 UTC.',
        category: NoticeCategory.CARRIER,
        effectiveAt: daysAgo(1),
        expiresAt: daysAgo(-2)
      },
      {
        title: 'Compliance attestation refresh',
        body: 'Re-upload TRUST documents for top buyers.',
        category: NoticeCategory.COMPLIANCE,
        effectiveAt: new Date(),
        expiresAt: daysAgo(-7)
      }
    ]
  });

  await prisma.platformMigration.create({
    data: {
      sourceSystem: 'TrackDrive',
      targetSystem: 'DCX',
      owner: 'Ops Team',
      phase: PlatformMigrationPhase.BUILD,
      risk: PlatformMigrationRisk.MEDIUM,
      cutoverDate: daysAgo(-14),
      summary: 'Migrating SSDI campaigns off TrackDrive'
    }
  });

  await prisma.billingStatement.create({
    data: {
      periodStart: daysAgo(30),
      periodEnd: daysAgo(0),
      totalCostCents: 420000,
      paymentsAppliedCents: 200000,
      balanceCents: 220000,
      pdfUrl: 'https://example.com/statements/oct.pdf',
      status: StatementStatus.OPEN
    }
  });

  await prisma.billingPayment.create({
    data: {
      amountCents: 200000,
      method: 'ACH',
      reference: 'PAY123',
      status: PaymentStatus.CLEARED,
      receivedAt: daysAgo(3)
    }
  });

  await prisma.carrierRate.create({
    data: {
      carrier: 'Twilio',
      countryCode: 'US',
      prefix: '+1',
      voiceInboundRateMicro: 7500,
      voiceOutboundRateMicro: 15000,
      smsRateMicro: 50,
      effectiveAt: daysAgo(10)
    }
  });

  await prisma.secretItem.createMany({
    data: [
      {
        label: 'Twilio Auth Token',
        owner: 'platform',
        scope: SecretScope.SECURITY,
        rotationDueAt: daysAgo(-5),
        maskedValue: '******abcd'
      },
      {
        label: 'Buyer Webhook Key',
        owner: 'integrations',
        scope: SecretScope.INTEGRATION,
        rotationDueAt: daysAgo(20),
        maskedValue: '******7890'
      }
    ]
  });

  const team = await prisma.team.create({
    data: {
      name: 'Platform Ops',
      purpose: 'Owns routing + observability',
      pagerNumber: '+15556667777',
      onCallContact: 'slack:#ops'
    }
  });

  await prisma.teamMember.createMany({
    data: [
      {
        teamId: team.id,
        name: 'Alex Ops',
        role: TeamRole.OPS,
        email: 'alex@example.com',
        lastSeenAt: hoursAgo(2)
      },
      {
        teamId: team.id,
        name: 'Jordan Eng',
        role: TeamRole.ENGINEERING,
        email: 'jordan@example.com',
        lastSeenAt: hoursAgo(5)
      }
    ]
  });

  await prisma.securityPreference.create({
    data: {
      mfaRequired: true,
      ipAllowList: ['34.23.11.1/32', '54.12.0.0/16'],
      lastAuditAt: daysAgo(15),
      webhookSigningSecret: 'shh-secret',
      apiKeyRotationDays: 60,
      defaultRecordingEnabled: true,
      cdrRetentionDays: 365,
      defaultBuyerCap: 150
    }
  });

  await prisma.webhookSubscription.createMany({
    data: [
      {
        event: 'CALL_COMPLETED',
        url: 'https://hooks.example.com/calls',
        secret: 'whsec1'
      },
      {
        event: 'CONVERSION_RECORDED',
        url: 'https://hooks.example.com/conversions',
        secret: 'whsec2',
        status: Status.INACTIVE,
        failureCount: 2
      }
    ]
  });

  await prisma.providerAccount.createMany({
    data: [
      {
        type: ProviderType.TWILIO,
        label: 'Twilio - Primary',
        status: ProviderStatus.HEALTHY,
        lastHeartbeatAt: hoursAgo(0.5),
        credentialRef: 'vault:twilio-primary',
        region: 'us-east-1',
        failoverPreference: 1,
        capacityShare: 70
      },
      {
        type: ProviderType.TELNYX,
        label: 'Telnyx - Backup',
        status: ProviderStatus.DEGRADED,
        lastHeartbeatAt: hoursAgo(6),
        credentialRef: 'vault:telnyx-backup',
        region: 'us-east-1',
        failoverPreference: 2,
        capacityShare: 30
      }
    ]
  });

  await prisma.integrationConfig.createMany({
    data: [
      {
        name: 'VICIdial',
        category: IntegrationCategory.TELEPHONY,
        status: IntegrationStatus.CONNECTED,
        connected: true,
        lastSyncAt: hoursAgo(4),
        documentationUrl: 'https://docs.example.com/vicidial',
        description: 'Live dialer data sync'
      },
      {
        name: 'Slack Alerts',
        category: IntegrationCategory.NOTIFICATION,
        status: IntegrationStatus.ERROR,
        connected: false,
        lastSyncAt: hoursAgo(12),
        documentationUrl: 'https://docs.example.com/slack',
        description: 'Routes alerts to #ops'
      }
    ]
  });

  await prisma.adminApiKey.createMany({
    data: [
      {
        label: 'Analyst Dashboard',
        tokenPreview: 'dcx_live_1234',
        scopes: ['calls:read', 'reports:read'],
        lastUsedAt: hoursAgo(1)
      },
      {
        label: 'Buyer Portal',
        tokenPreview: 'dcx_live_abcd',
        scopes: ['conversions:write'],
        status: Status.INACTIVE
      }
    ]
  });

  const retargetList = await prisma.retargetList.create({
    data: {
      name: 'SSDI 30-day non-converts',
      campaignId: campaign.id,
      size: 1200,
      healthScore: 82,
      lastPushAt: daysAgo(2),
      status: RetargetListStatus.HEALTHY,
      rules: { duration: '>120', states: ['CA', 'FL'] }
    }
  });

  const leads = await prisma.$transaction([
    prisma.lead.create({
      data: {
        campaignId: campaign.id,
        supplierId: supplier.id,
        retargetListId: retargetList.id,
        firstName: 'Jamie',
        lastName: 'Smith',
        phone: '+15555550001',
        stage: LeadStage.QUALIFIED,
        source: 'Meta',
        score: 87,
        assignedTo: 'alex'
      }
    }),
    prisma.lead.create({
      data: {
        campaignId: campaign.id,
        supplierId: supplier.id,
        firstName: 'Riley',
        lastName: 'Parker',
        phone: '+15555550002',
        stage: LeadStage.NEW,
        source: 'Google',
        score: 45
      }
    })
  ]);

  await prisma.leadEvent.createMany({
    data: [
      {
        leadId: leads[0].id,
        eventType: 'CALL_SCHEDULED',
        payload: { agent: 'Alex', slot: '2025-11-28T14:00:00Z' }
      },
      {
        leadId: leads[1].id,
        eventType: 'SMS_REPLY',
        payload: { message: 'Call me tomorrow' }
      }
    ]
  });

  await prisma.leadImportJob.createMany({
    data: [
      {
        source: 'CSV Upload',
        campaignId: campaign.id,
        status: ImportStatus.COMPLETED,
        rowsTotal: 2500,
        rowsImported: 2488,
        errorCount: 12,
        errorReportUrl: 'https://example.com/import-errors.csv',
        completedAt: daysAgo(4)
      },
      {
        source: 'Zapier Sync',
        campaignId: campaign.id,
        status: ImportStatus.RUNNING,
        rowsTotal: 100,
        rowsImported: 45,
        errorCount: 0
      }
    ]
  });

  const blast = await prisma.smsBlast.create({
    data: {
      name: 'SSDI Q4 nurture',
      campaignId: campaign.id,
      status: BlastStatus.SENDING,
      audienceSize: 800,
      template: 'Need help with your SSDI claim? Call us back.',
      scheduledAt: hoursAgo(3),
      sentCount: 320,
      failedCount: 5
    }
  });

  await prisma.smsBlastSend.createMany({
    data: [
      {
        blastId: blast.id,
        phone: '+15555557001',
        status: SmsStatus.DELIVERED,
        deliveredAt: hoursAgo(2.5)
      },
      {
        blastId: blast.id,
        phone: '+15555557002',
        status: SmsStatus.FAILED,
        errorReason: 'carrier_block'
      }
    ]
  });

  await prisma.smsMessage.createMany({
    data: [
      {
        direction: SmsDirection.OUTBOUND,
        phone: '+15555550001',
        status: SmsStatus.DELIVERED,
        body: 'Thanks for speaking with us!',
        leadId: leads[0].id,
        occurredAt: hoursAgo(3)
      },
      {
        direction: SmsDirection.INBOUND,
        phone: '+15555550001',
        status: SmsStatus.RECEIVED,
        body: 'Appreciate the help',
        leadId: leads[0].id,
        occurredAt: hoursAgo(2.9)
      }
    ]
  });

  await prisma.callbackRequest.create({
    data: {
      callSessionId: failedCall.id,
      status: CallbackStatus.OPEN,
      priority: 1,
      assignedTo: 'alex',
      notes: 'Buyer voicemail reached, needs manual follow-up',
      dueAt: hoursAgo(-1)
    }
  });

  await prisma.voicemail.create({
    data: {
      callSessionId: completedCall.id,
      status: VoicemailStatus.ACTIVE,
      recordingUrl: 'https://example.com/voicemail.wav',
      transcription: 'Hi, I missed your call. Call me back.',
      assignedTo: 'jordan',
      receivedAt: hoursAgo(5.5)
    }
  });

  await prisma.scheduleRule.createMany({
    data: [
      {
        targetType: ScheduleTargetType.BUYER,
        targetId: buyer.id,
        timezone: 'America/New_York',
        daysOfWeek: [1, 2, 3, 4, 5],
        startMinutes: 8 * 60,
        endMinutes: 20 * 60,
        metadata: { shifts: 2 }
      },
      {
        targetType: ScheduleTargetType.CAMPAIGN,
        targetId: campaign.id,
        timezone: 'America/Chicago',
        daysOfWeek: [6, 0],
        startMinutes: 9 * 60,
        endMinutes: 17 * 60,
        status: Status.INACTIVE
      }
    ]
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
