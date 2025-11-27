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
exports.conversionRouter = void 0;
// src/modules/conversion/conversion.controller.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.conversionRouter = express_1.default.Router();
/**
 * POST /api/conversions
 *
 * Buyer → DCX conversion webhook.
 * - Looks up CallSession by call_public_id.
 * - Validates buyer_id matches the call’s buyerId.
 * - Inserts a ConversionEvent.
 * - Economics: if revenue_cents from this event is greater than
 *   current revenueEstimatedCents, update the CallSession.
 */
exports.conversionRouter.post('/conversions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body.call_public_id || !body.buyer_id || !body.event_type || !body.event_time) {
        return res.status(400).json({
            message: 'call_public_id, buyer_id, event_type, and event_time are required'
        });
    }
    // 1) Fetch CallSession by public ID (external-safe identifier)
    const session = yield prisma.callSession.findUnique({
        where: { publicId: body.call_public_id },
        include: {
            offer: true
        }
    });
    if (!session) {
        return res.status(404).json({ message: 'Call not found' });
    }
    // 2) Validate buyer_id matches
    if (!session.buyerId || session.buyerId !== body.buyer_id) {
        return res.status(400).json({
            message: 'buyer_id does not match the buyer associated with this call'
        });
    }
    // 3) Insert ConversionEvent
    const revenueCentsFromEvent = typeof body.revenue_cents === 'number' ? body.revenue_cents : null;
    const conversion = yield prisma.conversionEvent.create({
        data: {
            callSessionId: session.id,
            buyerId: body.buyer_id,
            eventType: body.event_type,
            eventTime: new Date(body.event_time),
            revenueCents: revenueCentsFromEvent,
            source: 'BUYER_WEBHOOK'
        }
    });
    // 4) Economics: bump revenueEstimatedCents if this event yields more revenue
    if (typeof revenueCentsFromEvent === 'number' &&
        revenueCentsFromEvent > session.revenueEstimatedCents) {
        yield prisma.callSession.update({
            where: { id: session.id },
            data: {
                revenueEstimatedCents: revenueCentsFromEvent
            }
        });
    }
    const response = {
        id: conversion.id,
        call_session_id: conversion.callSessionId,
        status: 'ACCEPTED'
    };
    return res.status(201).json(response);
}));
//# sourceMappingURL=conversion.controller.js.map