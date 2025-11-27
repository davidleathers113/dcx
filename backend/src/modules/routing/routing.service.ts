// src/modules/routing/routing.service.ts
import { PrismaClient } from '@prisma/client';
import type { components } from '@/types/api';

type RoutingDecisionRequest = components['schemas']['RoutingDecisionRequest'];
type RoutingDecisionResponse = components['schemas']['RoutingDecisionResponse'];

const prisma = new PrismaClient();

/**
 * decideBestRoute
 *
 * Core routing engine:
 *  - Given a RoutingDecisionRequest (campaign, supplier, caller, etc.)
 *  - Fetch active offers for the campaign
 *  - Filter/score them (for now: simple priority + weight)
 *  - Return a RoutingDecisionResponse or null if no route
 *
 * In future:
 *  - Enforce caps (dailyCap, concurrencyLimit)
 *  - Enforce schedules (scheduleRules)
 *  - Add geotargeting, RTB, ping/post logic
 */
export async function decideBestRoute(
  input: RoutingDecisionRequest,
  traceId?: string
): Promise<RoutingDecisionResponse | null> {
  const log = (event: string, extra?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        trace_id: traceId,
        event,
        ...extra
      })
    );
  };

  log('routing_request_received', { input });

  // 1) Fetch active offers for this campaign in priority/weight order.
  const offers = await prisma.offer.findMany({
    where: {
      campaignId: input.campaign_id,
      isActive: true
    },
    orderBy: [
      { priority: 'asc' }, // lower number = higher priority
      { weight: 'desc' }   // secondary sort; real code might use randomization by weight
    ],
    include: {
      buyer: true
    },
    take: 20
  });

  if (offers.length === 0) {
    log('no_active_offers_for_campaign', {
      campaignId: input.campaign_id
    });
    return null;
  }

  // TODO (future): filter by caps, schedules, concurrency, geo, buyer health, etc.
  const selectedOffer = offers[0];
  const buyer = selectedOffer.buyer;

  if (!buyer) {
    log('offer_missing_buyer', { offerId: selectedOffer.id });
    return null;
  }

  const destinationType =
    buyer.endpointType === 'SIP' ? 'SIP' : 'PHONE_NUMBER';

  const response: RoutingDecisionResponse = {
    buyer_id: selectedOffer.buyerId,
    offer_id: selectedOffer.id,
    destination_type: destinationType,
    destination_value: buyer.endpointValue,
    max_ring_seconds: 30,
    max_call_duration_seconds: 1800
  };

  log('routing_decision_made', { response });

  return response;
}
