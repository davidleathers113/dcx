// src/modules/numbers/numbers.controller.ts
import express from 'express';

const numbersRouter = express.Router();

/**
 * NOTE: The GET /api/numbers endpoint is fully implemented in
 * reporting.controller.ts (src/modules/reporting/reporting.controller.ts:121).
 *
 * Since reportingRouter is registered before numbersRouter in server.ts,
 * the reporting.controller.ts implementation handles all /api/numbers GET requests.
 *
 * This router is reserved for future numbers-specific operations such as:
 * - POST /api/numbers (provision new number)
 * - PATCH /api/numbers/:id (update number config)
 * - DELETE /api/numbers/:id (release number)
 *
 * For the GET /api/numbers implementation, see:
 * backend/src/modules/reporting/reporting.controller.ts:121
 */

export { numbersRouter };
