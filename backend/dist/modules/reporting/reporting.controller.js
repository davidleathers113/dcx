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
exports.reportingRouter = void 0;
// src/modules/reporting/reporting.controller.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.reportingRouter = express_1.default.Router();
/* Helpers */
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
function parseDate(value) {
    if (!value)
        return undefined;
    const s = Array.isArray(value) ? value[0] : String(value);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
}
function parseCallStatus(value) {
    if (!value)
        return undefined;
    const s = Array.isArray(value) ? value[0] : String(value);
    if (Object.values(client_1.CallStatus).includes(s)) {
        return s;
    }
    return undefined;
}
function parseStatus(value) {
    if (!value)
        return undefined;
    const s = Array.isArray(value) ? value[0] : String(value);
    if (s === 'ACTIVE' || s === 'INACTIVE') {
        return s;
    }
    return undefined;
}
/* GET /api/calls */
exports.reportingRouter.get('/calls', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = parsePageLimit(req);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const campaignIdRaw = req.query.campaign_id;
    const supplierIdRaw = req.query.supplier_id;
    const buyerIdRaw = req.query.buyer_id;
    const status = parseCallStatus(req.query.status);
    const where = {};
    if (from || to) {
        where.createdAt = {};
        if (from)
            where.createdAt.gte = from;
        if (to)
            where.createdAt.lte = to;
    }
    if (campaignIdRaw) {
        where.campaignId = Array.isArray(campaignIdRaw)
            ? campaignIdRaw[0]
            : String(campaignIdRaw);
    }
    if (supplierIdRaw) {
        where.supplierId = Array.isArray(supplierIdRaw)
            ? supplierIdRaw[0]
            : String(supplierIdRaw);
    }
    if (buyerIdRaw) {
        where.buyerId = Array.isArray(buyerIdRaw)
            ? buyerIdRaw[0]
            : String(buyerIdRaw);
    }
    if (status) {
        where.status = status;
    }
    const [items, total] = yield prisma.$transaction([
        prisma.callSession.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.callSession.count({ where })
    ]);
    const response = {
        data: items,
        meta: { total, page, limit }
    };
    res.json(response);
}));
/* GET /api/numbers */
exports.reportingRouter.get('/numbers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = parsePageLimit(req);
    const campaignIdRaw = req.query.campaign_id;
    const supplierIdRaw = req.query.supplier_id;
    const status = parseStatus(req.query.status);
    const where = {};
    if (campaignIdRaw) {
        where.campaignId = Array.isArray(campaignIdRaw)
            ? campaignIdRaw[0]
            : String(campaignIdRaw);
    }
    if (supplierIdRaw) {
        where.supplierId = Array.isArray(supplierIdRaw)
            ? supplierIdRaw[0]
            : String(supplierIdRaw);
    }
    if (status) {
        where.status = status;
    }
    const [items, total] = yield prisma.$transaction([
        prisma.phoneNumber.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.phoneNumber.count({ where })
    ]);
    const response = {
        data: items,
        meta: { total, page, limit }
    };
    res.json(response);
}));
//# sourceMappingURL=reporting.controller.js.map