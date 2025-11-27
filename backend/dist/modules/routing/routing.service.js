"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideBestRoute = decideBestRoute;
// src/modules/routing/routing.service.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
function decideBestRoute(input, traceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const log = (event, extra) => {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(Object.assign({ trace_id: traceId, event }, extra)));
        };
        log('routing_request_received', { input });
        // 1) Fetch active offers for this campaign in priority/weight order.
        const offers = yield prisma.offer.findMany({
            where: {
                campaignId: input.campaign_id,
                isActive: true
            },
            orderBy: [
                { priority: 'asc' }, // lower number = higher priority
                { weight: 'desc' } // secondary sort; real code might use randomization by weight
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
        const destinationType = buyer.endpointType === 'SIP' ? 'SIP' : 'PHONE_NUMBER';
        const response = {
            buyer_id: selectedOffer.buyerId,
            offer_id: selectedOffer.id,
            destination_type: destinationType,
            destination_value: buyer.endpointValue,
            max_ring_seconds: 30,
            max_call_duration_seconds: 1800
        };
        log('routing_decision_made', { response });
        return response;
    });
}
//# sourceMappingURL=routing.service.js.map