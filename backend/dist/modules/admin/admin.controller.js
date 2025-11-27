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
exports.adminRouter = void 0;
// src/modules/admin/admin.controller.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.adminRouter = express_1.default.Router();
/* Helpers */
function parseStatusQuery(value) {
    if (!value)
        return undefined;
    const s = Array.isArray(value) ? value[0] : String(value);
    return s === 'ACTIVE' || s === 'INACTIVE' ? s : undefined;
}
function parsePageLimit(req) {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    let page = pageRaw ? Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) : 1;
    let limit = limitRaw ? Number(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw) : 50;
    if (!Number.isFinite(page) || page < 1)
        page = 1;
    if (!Number.isFinite(limit) || limit < 1)
        limit = 50;
    if (limit > 500)
        limit = 500;
    return { page, limit };
}
/* Mappers from OpenAPI input → Prisma */
function mapCampaignInput(input) {
    var _a, _b, _c;
    return {
        name: input.name,
        vertical: input.vertical,
        geoRules: (_a = input.geo_rules) !== null && _a !== void 0 ? _a : null,
        supplierId: (_b = input.supplier_id) !== null && _b !== void 0 ? _b : null,
        status: (_c = input.status) !== null && _c !== void 0 ? _c : client_1.Status.ACTIVE,
        recordingDefaultEnabled: input.recording_default_enabled !== undefined
            ? input.recording_default_enabled
            : true
    };
}
function mapCampaignUpdate(input) {
    const data = {};
    if (input.name !== undefined)
        data.name = input.name;
    if (input.vertical !== undefined)
        data.vertical = input.vertical;
    if (input.geo_rules !== undefined)
        data.geoRules = input.geo_rules;
    if (input.supplier_id !== undefined)
        data.supplierId = input.supplier_id;
    if (input.status !== undefined)
        data.status = input.status;
    if (input.recording_default_enabled !== undefined) {
        data.recordingDefaultEnabled = input.recording_default_enabled;
    }
    return data;
}
function mapBuyerInput(input) {
    var _a, _b, _c, _d, _e;
    return {
        name: input.name,
        endpointType: input.endpoint_type,
        endpointValue: input.endpoint_value,
        concurrencyLimit: input.concurrency_limit,
        dailyCap: (_a = input.daily_cap) !== null && _a !== void 0 ? _a : null,
        status: (_b = input.status) !== null && _b !== void 0 ? _b : client_1.Status.ACTIVE,
        weight: (_c = input.weight) !== null && _c !== void 0 ? _c : 50,
        scheduleTimezone: (_d = input.schedule_timezone) !== null && _d !== void 0 ? _d : null,
        scheduleRules: (_e = input.schedule_rules) !== null && _e !== void 0 ? _e : null
    };
}
function mapBuyerUpdate(input) {
    const data = {};
    if (input.name !== undefined)
        data.name = input.name;
    if (input.endpoint_type !== undefined) {
        data.endpointType = input.endpoint_type;
    }
    if (input.endpoint_value !== undefined) {
        data.endpointValue = input.endpoint_value;
    }
    if (input.concurrency_limit !== undefined) {
        data.concurrencyLimit = input.concurrency_limit;
    }
    if (input.daily_cap !== undefined) {
        data.dailyCap = input.daily_cap;
    }
    if (input.status !== undefined)
        data.status = input.status;
    if (input.weight !== undefined)
        data.weight = input.weight;
    if (input.schedule_timezone !== undefined) {
        data.scheduleTimezone = input.schedule_timezone;
    }
    if (input.schedule_rules !== undefined) {
        data.scheduleRules = input.schedule_rules;
    }
    return data;
}
function mapOfferInput(input) {
    var _a, _b, _c, _d, _e, _f;
    return {
        buyerId: input.buyer_id,
        campaignId: input.campaign_id,
        pricingModel: input.pricing_model,
        payoutCents: input.payout_cents,
        bufferSeconds: (_a = input.buffer_seconds) !== null && _a !== void 0 ? _a : 60,
        attributionWindowDays: (_b = input.attribution_window_days) !== null && _b !== void 0 ? _b : 30,
        dailyCap: (_c = input.daily_cap) !== null && _c !== void 0 ? _c : null,
        priority: (_d = input.priority) !== null && _d !== void 0 ? _d : 100,
        weight: (_e = input.weight) !== null && _e !== void 0 ? _e : 50,
        isActive: (_f = input.is_active) !== null && _f !== void 0 ? _f : true
    };
}
function mapOfferUpdate(input) {
    const data = {};
    if (input.pricing_model !== undefined) {
        data.pricingModel = input.pricing_model;
    }
    if (input.payout_cents !== undefined)
        data.payoutCents = input.payout_cents;
    if (input.buffer_seconds !== undefined)
        data.bufferSeconds = input.buffer_seconds;
    if (input.attribution_window_days !== undefined) {
        data.attributionWindowDays = input.attribution_window_days;
    }
    if (input.daily_cap !== undefined)
        data.dailyCap = input.daily_cap;
    if (input.priority !== undefined)
        data.priority = input.priority;
    if (input.weight !== undefined)
        data.weight = input.weight;
    if (input.is_active !== undefined)
        data.isActive = input.is_active;
    return data;
}
/* CAMPAIGNS */
// GET /api/campaigns
exports.adminRouter.get('/campaigns', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = parsePageLimit(req);
    const status = parseStatusQuery(req.query.status);
    const where = {};
    if (status)
        where.status = status;
    const [items, total] = yield prisma.$transaction([
        prisma.campaign.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.campaign.count({ where })
    ]);
    const response = {
        data: items,
        meta: { total, page, limit }
    };
    res.json(response);
}));
// GET /api/campaigns/:id
exports.adminRouter.get('/campaigns/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const campaign = yield prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
}));
// POST /api/campaigns
exports.adminRouter.post('/campaigns', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body.name || !body.vertical) {
        return res.status(400).json({ message: 'name and vertical are required' });
    }
    const data = mapCampaignInput(body);
    const created = yield prisma.campaign.create({ data });
    res.status(201).json(created);
}));
// PATCH /api/campaigns/:id
exports.adminRouter.patch('/campaigns/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const body = req.body;
    const data = mapCampaignUpdate(body);
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No updatable fields provided' });
    }
    try {
        const updated = yield prisma.campaign.update({
            where: { id },
            data
        });
        res.json(updated);
    }
    catch (_a) {
        res.status(404).json({ message: 'Campaign not found' });
    }
}));
/* BUYERS */
// GET /api/buyers
exports.adminRouter.get('/buyers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = parsePageLimit(req);
    const status = parseStatusQuery(req.query.status);
    const where = {};
    if (status)
        where.status = status;
    const [items, total] = yield prisma.$transaction([
        prisma.buyer.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.buyer.count({ where })
    ]);
    const response = {
        data: items,
        meta: { total, page, limit }
    };
    res.json(response);
}));
// GET /api/buyers/:id
exports.adminRouter.get('/buyers/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const buyer = yield prisma.buyer.findUnique({ where: { id } });
    if (!buyer) {
        return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
}));
// POST /api/buyers
exports.adminRouter.post('/buyers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body.name ||
        !body.endpoint_type ||
        !body.endpoint_value ||
        !body.concurrency_limit) {
        return res.status(400).json({
            message: 'name, endpoint_type, endpoint_value, and concurrency_limit are required'
        });
    }
    const data = mapBuyerInput(body);
    const created = yield prisma.buyer.create({ data });
    res.status(201).json(created);
}));
// PATCH /api/buyers/:id
exports.adminRouter.patch('/buyers/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const body = req.body;
    const data = mapBuyerUpdate(body);
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No updatable fields provided' });
    }
    try {
        const updated = yield prisma.buyer.update({
            where: { id },
            data
        });
        res.json(updated);
    }
    catch (_a) {
        res.status(404).json({ message: 'Buyer not found' });
    }
}));
/* OFFERS */
// GET /api/offers
exports.adminRouter.get('/offers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = parsePageLimit(req);
    const buyerIdRaw = req.query.buyer_id;
    const campaignIdRaw = req.query.campaign_id;
    const where = {};
    if (buyerIdRaw) {
        where.buyerId = Array.isArray(buyerIdRaw)
            ? buyerIdRaw[0]
            : String(buyerIdRaw);
    }
    if (campaignIdRaw) {
        where.campaignId = Array.isArray(campaignIdRaw)
            ? campaignIdRaw[0]
            : String(campaignIdRaw);
    }
    const [items, total] = yield prisma.$transaction([
        prisma.offer.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.offer.count({ where })
    ]);
    const response = {
        data: items,
        meta: { total, page, limit }
    };
    res.json(response);
}));
// GET /api/offers/:id
exports.adminRouter.get('/offers/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const offer = yield prisma.offer.findUnique({ where: { id } });
    if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
    }
    res.json(offer);
}));
// POST /api/offers
exports.adminRouter.post('/offers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body.buyer_id || !body.campaign_id || !body.pricing_model) {
        return res.status(400).json({
            message: 'buyer_id, campaign_id, and pricing_model are required'
        });
    }
    if (body.payout_cents === undefined) {
        return res.status(400).json({ message: 'payout_cents is required' });
    }
    const data = mapOfferInput(body);
    const created = yield prisma.offer.create({ data });
    res.status(201).json(created);
}));
// PATCH /api/offers/:id
exports.adminRouter.patch('/offers/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const body = req.body;
    const data = mapOfferUpdate(body);
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No updatable fields provided' });
    }
    try {
        const updated = yield prisma.offer.update({
            where: { id },
            data
        });
        res.json(updated);
    }
    catch (_a) {
        res.status(404).json({ message: 'Offer not found' });
    }
}));
//# sourceMappingURL=admin.controller.js.map