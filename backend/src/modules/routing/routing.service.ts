// src/modules/routing/routing.service.ts
import { PrismaClient, Buyer, Offer } from '@prisma/client';
import type { components } from '@/types/api';

type RoutingDecisionRequest = components['schemas']['RoutingDecisionRequest'];
type RoutingDecisionResponse = components['schemas']['RoutingDecisionResponse'];

const prisma = new PrismaClient();

/**
 * selectBuyerFromTier
 *
 * Simple weighted selection. Returns the highest-weighted buyer.
 * Future: Could implement weighted random selection.
 */
function selectBuyerFromTier(buyers: Buyer[]): Buyer | null {
  if (buyers.length === 0) {
    return null;
  }
  // Sort by weight descending
  const sortedBuyers = [...buyers].sort((a, b) => b.weight - a.weight);
  return sortedBuyers[0];
}

/**
 * isBuyerMaxedOut
 *
 * Checks if a buyer has hit any of their defined caps.
 * This is a simplified version. A full implementation would be more robust.
 */
async function isBuyerMaxedOut(buyer: Buyer): Promise<boolean> {
  // Check daily call cap
  if (buyer.dailyCap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyCallsUsed = await prisma.callSession.count({
      where: {
        buyerId: buyer.id,
        createdAt: { gte: today }
      }
    });

    if (dailyCallsUsed >= buyer.dailyCap) {
      return true;
    }
  }

  // Check daily revenue cap
  if (buyer.revenueCapDailyCents && buyer.revenueUsedDailyCents >= buyer.revenueCapDailyCents) {
    return true;
  }

  // Check monthly revenue cap
  if (buyer.revenueCapMonthlyCents && buyer.revenueUsedMonthlyCents >= buyer.revenueCapMonthlyCents) {
    return true;
  }
  
  // Check monthly conversion cap
  if (buyer.convertedMonthlyLimit && buyer.convertedMonthlyUsed >= buyer.convertedMonthlyLimit) {
    return true;
  }

  // TODO: Add other cap checks (total revenue, total conversions, concurrency)

  return false;
}


/**
 * decideBestRoute
 *
 * Core routing engine with tier-based buyer selection.
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

  // 1) Fetch active offers for this campaign, including the buyer details.
  const offers = await prisma.offer.findMany({
    where: {
      campaignId: input.campaign_id,
      isActive: true,
      buyer: {
        status: 'ACTIVE'
      }
    },
    include: {
      buyer: true
    }
  });

  if (offers.length === 0) {
    log('no_active_offers_for_campaign', {
      campaignId: input.campaign_id
    });
    return null;
  }
  
  // 2) Group buyers by tier
  const buyersByTier: Record<number, Buyer[]> = {};
  const offersByBuyerId: Record<string, Offer> = {};

  for (const offer of offers) {
    if (offer.buyer) {
      const tier = offer.buyer.tier;
      if (!buyersByTier[tier]) {
        buyersByTier[tier] = [];
      }
      buyersByTier[tier].push(offer.buyer);
      offersByBuyerId[offer.buyer.id] = offer;
    }
  }

  const sortedTiers = Object.keys(buyersByTier).map(Number).sort((a, b) => a - b);

  // 3) Iterate through tiers to find an available buyer
  for (const tier of sortedTiers) {
    log('evaluating_tier', { tier });
    const buyersInTier = buyersByTier[tier];
    
    // For now, simple selection. Could be more complex (e.g. round-robin).
    const selectedBuyer = selectBuyerFromTier(buyersInTier);

    if (selectedBuyer) {
      log('evaluating_buyer', { buyerId: selectedBuyer.id, tier });

      // 4) Check if the buyer is maxed out
      if (await isBuyerMaxedOut(selectedBuyer)) {
        log('buyer_maxed_out', { buyerId: selectedBuyer.id });
        continue; // Try next buyer or tier
      }

      // 5) Found a valid buyer. Construct the response.
      const selectedOffer = offersByBuyerId[selectedBuyer.id];
      const destinationType = selectedBuyer.endpointType === 'SIP' ? 'SIP' : 'PHONE_NUMBER';
      
      const response: RoutingDecisionResponse = {
        buyer_id: selectedBuyer.id,
        offer_id: selectedOffer.id,
        destination_type: destinationType,
        destination_value: selectedBuyer.endpointValue,
        max_ring_seconds: 30,
        max_call_duration_seconds: 1800
      };

      log('routing_decision_made', { response });
      return response;
    }
  }

  log('no_available_buyers_after_filtering');
  return null;
}
