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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telephonyRouter = void 0;
// src/modules/telephony/telephony.controller.ts
const express_1 = __importDefault(require("express"));
const twilio_1 = __importDefault(require("twilio"));
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const routing_service_1 = require("../routing/routing.service");
const { validateRequest, twiml } = twilio_1.default;
const prisma = new client_1.PrismaClient();
// Must be set in .env
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
if (!TWILIO_AUTH_TOKEN) {
    // eslint-disable-next-line no-console
    console.warn('[WARN] TWILIO_AUTH_TOKEN is not set. Twilio signature validation will fail.');
}
exports.telephonyRouter = express_1.default.Router();
// Twilio sends application/x-www-form-urlencoded by default
exports.telephonyRouter.use(['/voice', '/status'], express_1.default.urlencoded({ extended: false }));
/**
 * Utility: structured logger bound to a trace_id.
 */
function makeLogger(traceId) {
    return (event, extra) => {
        // Replace with pino/winston later
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(Object.assign({ trace_id: traceId, event }, extra)));
    };
}
/**
 * Utility: validate Twilio signature for a given request.
 */
function isValidTwilioRequest(req, authToken) {
    const signature = req.header('X-Twilio-Signature') || '';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const url = `${protocol}://${req.get('host')}${req.originalUrl}`;
    return validateRequest(authToken, signature, url, req.body);
}
/**
 * Utility: map Twilio call status to internal CallStatus enum.
 */
function mapTwilioStatusToCallStatus(twilioStatus) {
    const status = (twilioStatus || '').toLowerCase();
    switch (status) {
        case 'queued':
        case 'initiated':
            return client_1.CallStatus.INITIATED;
        case 'ringing':
            return client_1.CallStatus.RINGING;
        case 'in-progress':
            return client_1.CallStatus.IN_PROGRESS;
        case 'completed':
            return client_1.CallStatus.COMPLETED;
        case 'busy':
            return client_1.CallStatus.BUSY;
        case 'no-answer':
            return client_1.CallStatus.NO_ANSWER;
        case 'failed':
        case 'canceled':
        default:
            return client_1.CallStatus.FAILED;
    }
}
/**
 * POST /twilio/voice
 *
 * Primary Twilio Voice webhook for inbound calls & status callbacks.
 * - Generates a trace_id for observability.
 * - Validates X-Twilio-Signature.
 * - Looks up the DID → campaign/supplier via Prisma.
 * - Creates a CallSession record with status INITIATED.
 * - Calls routing engine to decide best buyer endpoint, updates CallSession with buyer/offer.
 * - Returns TwiML <Dial> to that endpoint, with statusCallback → /twilio/status.
 */
exports.telephonyRouter.post('/voice', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const traceId = (0, crypto_1.randomUUID)();
    const log = makeLogger(traceId);
    const params = req.body;
    log('twilio_voice_webhook_received', {
        CallSid: params.CallSid,
        From: params.From,
        To: params.To,
        CallStatus: params.CallStatus
    });
    if (!TWILIO_AUTH_TOKEN || !isValidTwilioRequest(req, TWILIO_AUTH_TOKEN)) {
        log('twilio_signature_invalid', {
            signature: req.header('X-Twilio-Signature') || ''
        });
        return res.status(403).send('Invalid Twilio signature');
    }
    const voiceResponse = new twiml.VoiceResponse();
    try {
        const did = params.To;
        // 1) Resolve DID → campaign + supplier
        const phoneNumber = yield prisma.phoneNumber.findUnique({
            where: { e164: did }
        });
        if (!phoneNumber) {
            log('phone_number_not_found', { did });
            voiceResponse.say({ voice: 'Polly.Matthew' }, 'Sorry, this number is not configured yet.');
            return res.type('text/xml').status(200).send(voiceResponse.toString());
        }
        // 2) Create CallSession (INITIATED) BEFORE routing (FR-13).
        //    Use Twilio parent CallSid as the key; this covers all calls even if routing fails.
        try {
            const callSession = yield prisma.callSession.create({
                data: {
                    publicId: (0, crypto_1.randomUUID)(),
                    traceId,
                    twilioCallSid: params.CallSid,
                    fromNumber: params.From,
                    toNumber: params.To,
                    campaignId: phoneNumber.campaignId,
                    supplierId: phoneNumber.supplierId,
                    status: client_1.CallStatus.INITIATED
                }
            });
            log('call_session_created', {
                callSessionId: callSession.id,
                publicId: callSession.publicId
            });
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'P2002') {
                // Unique constraint violation on twilioCallSid: fetch existing session.
                const existing = yield prisma.callSession.findUnique({
                    where: { twilioCallSid: params.CallSid }
                });
                if (existing) {
                    // eslint-disable-next-line no-console
                    console.log(JSON.stringify({
                        trace_id: existing.traceId,
                        event: 'call_session_duplicate_twilio_call_sid',
                        callSessionId: existing.id
                    }));
                }
            }
            else {
                log('call_session_create_error', {
                    errorMessage: err === null || err === void 0 ? void 0 : err.message,
                    errorCode: err === null || err === void 0 ? void 0 : err.code
                });
            }
        }
        // 3) Build typed routing request
        const routingRequest = {
            campaign_id: phoneNumber.campaignId,
            supplier_id: phoneNumber.supplierId,
            from_number: params.From,
            to_number: params.To,
            geo: null,
            timestamp: new Date().toISOString()
        };
        log('routing_request_built', { routingRequest });
        // 4) Call routing engine
        const routingDecision = yield (0, routing_service_1.decideBestRoute)(routingRequest, traceId);
        if (!routingDecision) {
            log('routing_decision_failed', {});
            voiceResponse.say({ voice: 'Polly.Matthew' }, 'Sorry, we could not connect your call at this time.');
            return res.type('text/xml').status(200).send(voiceResponse.toString());
        }
        log('routing_decision_success', { routingDecision });
        // 5) Update CallSession with buyer/offer now that we know them.
        try {
            const updated = yield prisma.callSession.update({
                where: { twilioCallSid: params.CallSid },
                data: {
                    buyerId: routingDecision.buyer_id,
                    offerId: routingDecision.offer_id
                }
            });
            log('call_session_updated_with_route', {
                callSessionId: updated.id,
                buyerId: updated.buyerId,
                offerId: updated.offerId
            });
        }
        catch (err) {
            log('call_session_update_error', {
                errorMessage: err === null || err === void 0 ? void 0 : err.message,
                errorCode: err === null || err === void 0 ? void 0 : err.code
            });
        }
        // 6) Generate <Dial> TwiML with statusCallback → /twilio/status
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const statusCallbackUrl = `${protocol}://${host}/twilio/status`;
        const dial = voiceResponse.dial({
            timeout: routingDecision.max_ring_seconds,
            timeLimit: routingDecision.max_call_duration_seconds,
            statusCallback: statusCallbackUrl,
            statusCallbackMethod: 'POST',
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        }); // Twilio typings may not include statusCallbackEvent; cast to any.
        if (routingDecision.destination_type === 'PHONE_NUMBER') {
            dial.number(routingDecision.destination_value);
        }
        else {
            dial.sip(routingDecision.destination_value);
        }
        return res.type('text/xml').status(200).send(voiceResponse.toString());
    }
    catch (err) {
        log('telephony_handler_error', {
            errorMessage: err === null || err === void 0 ? void 0 : err.message,
            errorStack: err === null || err === void 0 ? void 0 : err.stack
        });
        // Fail gracefully for the caller
        voiceResponse.say({ voice: 'Polly.Matthew' }, 'Sorry, there was an error connecting your call.');
        return res.type('text/xml').status(200).send(voiceResponse.toString());
    }
}));
/**
 * POST /twilio/status
 *
 * Status callback for <Dial>. Twilio will send call lifecycle events here:
 * - initiated, ringing, answered, completed
 *
 * Economics (FR-14) implemented here:
 *  - Fetch CallSession with related Offer.
 *  - Map Twilio status to internal CallStatus enum.
 *  - Calculate duration from Twilio (prefer Dial leg).
 *  - Compute telephonyCostCents using flat $0.014/min:
 *        cost_cents = round(ceil(duration / 60) * 1.4)
 *  - Compute revenueEstimatedCents:
 *        if duration >= offer.bufferSeconds => payoutCents else 0
 *  - Update CallSession with final status, duration, cost, revenue.
 */
exports.telephonyRouter.post('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Temporary traceId until we can correlate with DB
    let traceId = (0, crypto_1.randomUUID)();
    const params = req.body;
    const callSid = params.CallSid;
    if (!TWILIO_AUTH_TOKEN || !isValidTwilioRequest(req, TWILIO_AUTH_TOKEN)) {
        const log = makeLogger(traceId);
        log('twilio_status_signature_invalid', {
            signature: req.header('X-Twilio-Signature') || '',
            CallSid: callSid
        });
        return res.status(403).send('Invalid Twilio signature');
    }
    // Fetch CallSession including Offer for economics
    const session = yield prisma.callSession.findUnique({
        where: { twilioCallSid: callSid },
        include: {
            offer: true
        }
    });
    if (session) {
        traceId = session.traceId;
    }
    const log = makeLogger(traceId);
    // Log raw Twilio status payload
    log('twilio_status_webhook_received', {
        CallSid: callSid,
        CallStatus: params.CallStatus,
        DialCallSid: params.DialCallSid,
        DialCallStatus: params.DialCallStatus,
        CallDuration: params.CallDuration,
        DialCallDuration: params.DialCallDuration,
        Direction: params.Direction
    });
    if (!session) {
        // We can't do economics without a session. Log and bail gracefully.
        log('call_session_not_found_for_status', { CallSid: callSid });
        return res.status(200).send('OK');
    }
    // 1) Determine final status (prefer DialCallStatus if present)
    const twilioStatus = params.DialCallStatus || params.CallStatus || 'completed';
    const finalStatus = mapTwilioStatusToCallStatus(twilioStatus);
    // 2) Determine duration (seconds) — prefer Dial leg duration if present
    const rawDuration = params.DialCallDuration || params.CallDuration || '0';
    const durationSeconds = Number(rawDuration) || 0;
    // 3) Calculate telephony cost (flat $0.014/min == 1.4 cents/min)
    //    Twilio bills per full minute (ceil) typically; we approximate here.
    const billedMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const telephonyCostCents = Math.round(billedMinutes * 1.4);
    // 4) Calculate revenue: only if duration >= offer.bufferSeconds
    let revenueEstimatedCents = 0;
    if (session.offer) {
        const bufferSeconds = session.offer.bufferSeconds;
        const payoutCents = session.offer.payoutCents;
        if (durationSeconds >= bufferSeconds) {
            revenueEstimatedCents = payoutCents;
        }
        log('economics_calculated', {
            durationSeconds,
            billedMinutes,
            telephonyCostCents,
            bufferSeconds,
            payoutCents,
            revenueEstimatedCents
        });
    }
    else {
        log('offer_missing_for_session_economics', {
            callSessionId: session.id
        });
    }
    // 5) Update CallSession with economic + lifecycle data
    try {
        const now = new Date();
        yield prisma.callSession.update({
            where: { id: session.id },
            data: {
                status: finalStatus,
                // If we don't have fine-grained timestamps, we at least set endedAt + duration
                endedAt: now,
                durationSeconds,
                billableDurationSeconds: durationSeconds,
                telephonyCostCents,
                revenueEstimatedCents
            }
        });
        log('call_session_economics_updated', {
            callSessionId: session.id,
            finalStatus,
            durationSeconds,
            telephonyCostCents,
            revenueEstimatedCents
        });
    }
    catch (err) {
        log('call_session_economics_update_error', {
            callSessionId: session.id,
            errorMessage: err === null || err === void 0 ? void 0 : err.message,
            errorCode: err === null || err === void 0 ? void 0 : err.code
        });
    }
    // Twilio expects 200 OK; no TwiML required for status callbacks
    return res.status(200).send('OK');
}));
//# sourceMappingURL=telephony.controller.js.map