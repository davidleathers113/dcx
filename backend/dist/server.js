"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const env_1 = require("./config/env"); // <-- must be first import to validate env
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_errors_1 = __importDefault(require("http-errors"));
const telephony_controller_1 = require("./modules/telephony/telephony.controller");
const routing_controller_1 = require("./modules/routing/routing.controller");
const admin_controller_1 = require("./modules/admin/admin.controller");
const reporting_controller_1 = require("./modules/reporting/reporting.controller");
const conversion_controller_1 = require("./modules/conversion/conversion.controller");
const app = (0, express_1.default)();
// Trust proxy if you're behind a load balancer (important for Twilio URL calculation)
app.set('trust proxy', true);
// Global middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
// JSON body parsing for normal APIs
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime_seconds: process.uptime()
    });
});
// Telephony webhooks (Twilio)
app.use('/twilio', telephony_controller_1.telephonyRouter);
// Internal routing API
app.use('/internal', routing_controller_1.routingRouter);
// Admin API (configuration): /api/campaigns, /api/buyers, /api/offers
app.use('/api', admin_controller_1.adminRouter);
// Reporting API (runtime views): /api/calls, /api/numbers
app.use('/api', reporting_controller_1.reportingRouter);
// Conversion API (offline events): /api/conversions
app.use('/api', conversion_controller_1.conversionRouter);
// 404 handler
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404, 'Not Found'));
});
// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const response = { message };
    if (env_1.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }
    res.status(status).json(response);
});
// Start server
const PORT = env_1.env.PORT;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`DCX backend listening on port ${PORT} (${env_1.env.NODE_ENV})`);
});
//# sourceMappingURL=server.js.map