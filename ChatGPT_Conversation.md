# Building a CPaaS-based Exchange/Router

This document chronicles the step-by-step conversation to design and build a Call Per Acquisition (CPA) based call routing and tracking system.

## Initial Problem Statement

I want to route phone calls and track their progress. Right now I’m using TrackDrive but it’s too expensive. Please help me to figure out a way to use open source software or build my own software for this purpose. Think through this step by step. Do comprehensive web research and weigh my options.

## User Context and Requirements

So here’s what’s going on. I’m using TrackDrive for call routing and most of my campaigns are on Cost Per Acquisition. I’m paying at least $100k/year in telephony costs.

I want to be able to see all of the reporting, send/receive webhooks, capture pings from my suppliers for availability and realtime bids, send pings to my buyers for availability and realtime bids, and all other regular reporting relevant to pay per call. Think through this step by step and help me to assess what I need to build this out.

I already have a Vicidial because I have call centers generating many of the calls. But much of my traffic comes from other sources. Right now, I don’t know of a way to pass the calls through to my buyers using Vicidial. If you can confirm if that’s a possibility, I’d appreciate it.

## Exploring CPaaS Solutions (Telnyx)

How do I build a CPaaS-based Exchange/Router based on Telnyx? Think through this step by step. Do comprehensive web research. Give me a detailed overview.

## Feasibility and Open Source Alternatives

How difficult would this be to build? Are there open source solutions that I can use as a reference?

There has to be a more recent open source call tracking app than OpenCall. Look harder for one.

I’m open to using Twilio. It seems like there’s more for devs. Like this:
*   [https://github.com/TwilioDevEd/call-forwarding-node](https://github.com/TwilioDevEd/call-forwarding-node)
*   [https://github.com/TwilioDevEd/call-tracking-node](https://github.com/TwilioDevEd/call-tracking-node)

## Product Requirements Document (PRD)

Write a full PRD for the app.

## 2025 PRD Audit and Upgrades

This is an exceptionally strong foundation. It is clear, scoped, and technically literate. However, does it meet 2025 best practices? Not entirely.

In 2025, a "hand-off ready" PRD has shifted from being a static list of requirements to a dynamic engineering blueprint. Modern PRDs emphasize API contracts first, AI-readiness (even if not implementing AI yet), Observability as a feature, and Regulatory Compliance (especially in telephony).

Here is the "2025 Audit" of your DCX PRD, followed by the specific upgrades needed to make it truly implementation-ready.

### 1. The 2025 Audit

| Feature         | Status      | 2025 Standard                                                              | Verdict           |
| :-------------- | :---------- | :------------------------------------------------------------------------- | :---------------- |
| Scope & Vision  | ✅ Excellent | Clear MVP vs. V2 definition.                                               | Keep.             |
| Domain Model    | ⚠️ Good     | Should be defined in TypeScript Interfaces or Zod Schemas, not just text lists. | Upgrade to Types. |
| Telephony       | ⚠️ Missing  | STIR/SHAKEN compliance and A2P 10DLC registration are mandatory now.       | Critical Add.     |
| AI Strategy     | ❌ Missing  | Even if V1 is "dumb," the data structure must support future LLM transcription/QA. | Add Data Prep.    |
| API Spec        | ⚠️ Implicit | 2025 Best Practice is "Spec-First" (OpenAPI/Swagger) before coding.        | Add Spec.         |
| Observability   | ⚠️ Basic    | Needs OpenTelemetry traces (tracking a call ID across Twilio → Server → DB). | Add Tracing.      |

### 2. Required Upgrades (The "Missing Links")

To make this PRD ready for a 2025 engineer (or yourself), add these four sections.

#### A. Regulatory Compliance (Critical for Twilio)

You cannot launch a call exchange in 2025 without addressing trust.
*   STIR/SHAKEN: How will you handle attestation? (Twilio handles some, but you need to configure profiles).
*   CNAM (Caller ID Name): Will you perform CNAM lookups on inbound calls to filter spam before routing?
*   A2P 10DLC: If you send any SMS (even fallback notifications), you need campaign registration.

#### B. The "AI Readiness" Data Strategy

Even if V1 uses simple logic, V2 will use AI. The V1 DB must be ready.
*   Requirement: Store `recording_url` not just for playback, but in a queue for future Async LLM Transcription.
*   Requirement: Create a specific field for `transcription_text` and `sentiment_score` in the CallSession table now, so the schema doesn't need a migration later.

#### C. Observability & Tracing

Debugging a lost call between Twilio and your server is a nightmare without tracing.
*   Requirement: Implement a `correlation_id`.
    *   Twilio has `CallSid`.
    *   Your system should generate a `trace_id` that is passed to every log and webhook.
*   Latency Budget: Define the "Time to TwiML." Twilio times out after ~1500ms. Your routing engine logic must complete in < 500ms.

#### D. Visual Logic

Text descriptions of routing are error-prone. 2025 PRDs rely on diagrams to prevent logic bugs.

### 3. Refined Technical Specs (Implementation Details)

To make this truly "hand-off" ready, I have converted your Domain Model and Economics into the formats a developer actually needs (TypeScript and LaTeX).

#### Updated Domain Model (TypeScript / Prisma Style)

Instead of a list, give the dev this:

```typescript
// Core Types for DCX

type PricingModel = 'CPA' | 'CPC' | 'REVSHARE' | 'FIXED';
type CallStatus = 'INITIATED' | 'RINGING' | 'IN-PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUSY' | 'NO-ANSWER';

interface Buyer {
  id: string;
  name: string;
  endpoint_type: 'PHONE_NUMBER' | 'SIP';
  endpoint_value: string;
  concurrency_limit: number; // Critical for avoiding busy signals
  weight: number; // 1-100 for weighted routing
}

interface Offer {
  id: string;
  buyer_id: string;
  campaign_id: string;
  payout: number; // stored in cents/micros to avoid floating point math
  buffer_seconds: number; // standard is usually 30s-90s
  is_active: boolean;
}

interface CallSession {
  id: string;
  twilio_call_sid: string;
  trace_id: string; // For observability

  // Timestamps
  created_at: Date;
  answered_at?: Date;
  ended_at?: Date;

  // Economics
  duration: number;
  billable_duration: number;
  revenue_estimated: number;
  cost_telephony_estimated: number;

  // Future proofing for AI
  recording_url?: string;
  transcription_status: 'NONE' | 'PENDING' | 'COMPLETED';
}
```

#### Updated Economics Logic (The Math)

To ensure the "Profit" calculation is unambiguous for the developer:
Where:
*   Revenue is realized only if:
*   Cost is calculated as:

(Note: Twilio rounds up to the nearest minute, which is a common "gotcha" in profit calculations that developers miss if not specified).

### 4. Verdict & Next Step

Verdict: This PRD is 90% ready. It is better than most, but lacks the specific "glue" (Schema, Compliance, Tracing) that prevents "death by edge-case" during development.
I can perform the following next steps to finalize this:
*   Generate the Schema: I can write the actual Prisma (`schema.prisma`) or SQL DDL code so you can spin up the DB immediately.
*   Generate the API Spec: I can write the OpenAPI (Swagger) definition for the `POST /call-routing` and `POST /webhook` endpoints.
*   Project Scaffold: I can outline the folder structure for a Next.js 15 (App Router) + Hono/Express backend monorepo.

Which would you prefer?

## OpenAPI Spec Refinement

### User Request

Emit an actual OpenAPI 3.1 YAML for the core endpoints so this is literally copy-paste into a repo.

### Agent Response & Critiques

This is a solid, professional-grade V1 spec. You have successfully integrated the "2025" requirements we discussed:
*   ✅ AI-Ready: `transcription_text`, `sentiment_score`, and `llm_qa_score` are present.
*   ✅ Observability: `trace_id` is mandatory in `CallSession`.
*   ✅ Compliance: `stir_shaken_attestation` and `trust_profile_id` are in `PhoneNumber`.

However, before you generate code from this, I have three critical critiques to prevent runtime failures and security holes.

#### 1. The "Strict Validation" Trap (Twilio Webhooks)

Critique: Your `TwilioVoiceWebhookRequest` schema is too strict.
Twilio frequently adds new parameters to their webhook payloads (e.g., `CallerCountry`, `StirPassportToken`). If you use a code generator that produces strict Zod/Pydantic validators based on this YAML, your production app will throw `400 Bad Request` errors the moment Twilio sends a parameter you didn't define, dropping calls.

Fix: Add `additionalProperties: true` (or the equivalent `x-` vendor extension depending on your generator) to the Twilio request schema. Treat that payload as "loose" by design.

#### 2. The Security Gap (Signature Validation)

Critique: You have `security: []` (public) for `/twilio/voice`.
While necessary for Twilio to reach you, this allows anyone to `curl` your endpoint and inject fake calls, potentially draining your account balance or skewing your analytics.

Fix: While you cannot use OAuth/Bearer tokens with Twilio, you must document the requirement for Request Signature Validation (checking the `X-Twilio-Signature` header).
*   Action: Add a `403` response to `/twilio/voice` documentation explicitly for "Invalid Twilio Signature."

#### 3. The Pagination "Envelope"

Critique: Your list responses (e.g., `listSuppliers`) return a raw array: `type: array`. However, `listCalls` returns an object with `total` and `items`.
Inconsistency: Front-end developers hate inconsistent pagination.

Fix: Standardize all list endpoints to use the "Envelope Pattern" used in `/api/calls`.

```yaml
# Don't do this (Raw Array)
type: array
items:
  $ref: '#/components/schemas/Supplier'

# Do this (Envelope)
type: object
properties:
  data:
    type: array
    items:
      $ref: '#/components/schemas/Supplier'
  meta:
    type: object
    properties:
      total: { type: integer }
      page: { type: integer }
      limit: { type: integer }
```

### Visualizing the Flow

To understand how this API fits into the architecture we discussed, here is the system view:
[Diagram Placeholder - *assuming a diagram would be here in a real PRD*]

And specifically for the Routing Logic, this is how the `/twilio/voice` and `/internal/routing/decide` endpoints interact. This separation is crucial: it keeps your public TwiML handler "dumb" and your private routing engine "smart."

### Next Step: The Implementation

You have the PRD (the map) and the OpenAPI Spec (the contract). The final missing piece before you can write application logic is the Database Schema.
Since you are using TypeScript/Node, Prisma is the standard for 2025.
Shall I generate the `schema.prisma` file now?
(This will include the exact relations for `Buyer ↔ Offer ↔ Campaign` and the necessary indexes for high-speed routing lookups).

### User Instruction for Refinement

This makes sense. Please do two things:
*   Refine the OpenAPI YAML: Apply the three fixes you mentioned (loosen the Twilio validation, add the 403 security response, and standardize the 'Envelope Pattern' for all list endpoints).
*   Generate the `schema.prisma`: Once the spec is fixed, generate the full Prisma schema.

For the Prisma Schema, ensure you:
*   Use `BigInt` or `Int` (cents) for all monetary values.
*   Add proper Indexes (e.g., compound indexes for finding routing rules quickly).
*   Use Enums for status fields.
*   Include the necessary relations (Buyer ↔ Offer ↔ Campaign).

## Backend Project Scaffolding

### User Request

Okay, I'm ready to build. Please generate the project scaffolding for a Node.js/Express + TypeScript + Prisma backend.
Specifically provide:
*   `package.json` dependencies (including the `openapi-typescript` tool).
*   `src/server.ts` that sets up the Express app with JSON parsing and basic error handling.
*   `src/modules/telephony/telephony.controller.ts` that implements the `/twilio/voice` endpoint (validating the signature and returning basic TwiML).
*   `src/modules/routing/routing.controller.ts` that stubs out the decision logic.

Assume I have already run `prisma init` and pasted the schema.

### Agent Response & Critiques

This response is functional but "loose." It gives you a running server, but it ignores the two most important architectural requirements we established: Observability and Strict Type Compliance.

If you use this code as-is:
*   You won't be able to debug: There is no `trace_id` generated when a call hits the server. If a call drops, you'll have to `grep` through unstructured logs.
*   You are ignoring your own contract: The controllers are manually checking fields (`if (!campaign_id...)`) instead of using the TypeScript types generated from your OpenAPI spec. This defeats the purpose of writing the spec first.

Here is the prompt to paste back to the AI to fix this and wire the engine together.

```text
"This scaffold is a start, but it fails the '2025' standards we agreed on. Please refactor the code with these specific fixes:
 * Enforce Observability: In telephony.controller.ts, generate a trace_id (UUID) immediately when the webhook hits. Attach this ID to a structured logger (or console.log context) so every subsequent log line for this call includes the ID.
 * Use the Generated Types: You added openapi-typescript to package.json, but the controllers aren't using the types! Import the generated interfaces (e.g., components['schemas']['RoutingDecisionRequest']) and use them to type req.body instead of manual if checks.
 * Wire the Logic: The telephony.controller.ts is currently a dead stub. Update it to actually call the findBestOffer logic (even if mocked) and dynamically generate the TwiML.
   * If routing returns a number -> Generate <Dial>.
   * If routing fails -> Generate <Say>Sorry...</Say>.
Give me the updated telephony.controller.ts and routing.service.ts (not controller) that connects these dots."
```

## Wiring Telephony and Routing Logic

### Agent Response & Critiques

This response is 70% there. It wires the logic, but it makes a critical data error that violates your PRD.

#### The Critique:
*   The "Ghost Call" Problem: The code routes the call but never saves it to the database. It violates FR-13 (Call Creation). If you ran this today, you would have zero records in your `CallSession` table. You cannot build a business without transaction logs.
*   The "Blind" Dial: The `<Dial>` TwiML is missing an `action` or `statusCallback` URL. Without this, your system will never know when the call ends, how long it lasted, or how much it cost. You will have a routing engine but no billing engine.

Here is the prompt to fix this immediately.

```text
"This looks clean, but it misses the most important part of the business: The Data.
You violated FR-13 (CallSession Creation). As written, this code routes calls but leaves no record in the database. We cannot bill for calls we don't track.
Please refactor telephony.controller.ts to:
 * Create the CallSession: Immediately after finding the PhoneNumber and before returning TwiML, insert a CallSession record into Prisma with the status INITIATED.
 * Fix the <Dial>: The <Dial> verb must include a action or statusCallback URL pointing to a new endpoint (e.g., /twilio/status).
 * Stub the Status Handler: Add a POST /status handler in the same controller to handle the call completion event (just log it for now), so we close the loop on the call lifecycle.
Give me the final, production-ready telephony.controller.ts that creates the session and tracks the end of the call."
```

## Implementing Call Session Tracking and Status Callback

### Agent Response & Critiques

This response is 90% there, but it falls into a classic developer trap: "I'll do the billing logic later."

#### The Critique:
*   The "Free Work" Bug: You left the billing logic (FR-14) as a comment (`// TODO`). If this code goes to production, you will route calls, incur costs from Twilio, and pay buyers, but your database will show every call as having 0 duration and $0 revenue.
*   No Economics: A "Call Exchange" is a financial instrument. The system must calculate revenue vs cost the moment the call ends.
*   Variable Scope Risk: In the `POST /voice` handler, you define `phoneNumber` inside a `try` block but logic flows might get tricky. (The current flow is safe because of the return, but it's fragile).

We need to force the AI to write the Economics Engine inside the status callback now, not later.

```text
"We are almost done, but you left the most critical part as a comment.
You implemented the 'Start' of the call, but you stubbed out the 'Money' (FR-14). We cannot ship a system that tracks calls but records 0 duration and $0 profit.
Please refactor the POST /status handler in telephony.controller.ts to fully implement the economics:
 * Fetch the Context: Retrieve the CallSession including its related Offer.
 * Map the Status: Convert Twilio's CallStatus (completed, busy, no-answer) to our Prisma CallStatus enum.
 * Calculate Revenue:
   * If CallDuration (from Twilio) >= Offer.bufferSeconds, then revenue = Offer.payoutCents.
   * Otherwise, revenue = 0.
 * Calculate Cost (Simplified V1):
   * Assume a flat rate of $0.014/min (inbound + outbound legs combined).
   * Formula: ceil(duration / 60) * 1.4 cents.
 * Update the Database: Save the final duration, status, cost, and revenue.
Give me just the updated telephony.controller.ts with this financial logic included."
```

## Implementing Economics Engine in Status Callback

### Agent Response & Critiques

This code is Production-Ready for V1. It successfully bridges the gap between raw telephony and business logic. You now have a system that tracks revenue and cost in real-time, which is the defining feature of a Call Exchange.

#### The Status:
*   Engine: ✅ Running (Telephony + Routing + Economics).
*   Data: ❌ Empty. You have no way to put Campaigns, Buyers, or Numbers into the system yet.
*   API: ⚠️ Incomplete. `server.ts` does not yet expose the `/api/...` endpoints defined in your OpenAPI spec.

Here is the prompt to build the Admin Layer so you can actually configure the system and make a test call.

```text
"This is excellent. We now have the 'Heart' (Telephony) and the 'Brain' (Routing) fully operational and financially aware.
However, the system is useless right now because the database is empty and I have no way to populate it. We need the 'Limbs' (The Admin API).
Please provide the following next steps:
 * src/modules/admin/admin.controller.ts: Implement the CRUD endpoints for Campaigns, Buyers, and Offers.
   * Crucial: Use the generated components['schemas'] types for validation.
   * Crucial: Ensure list endpoints use the { data, meta } pagination envelope we defined in the OpenAPI.
 * src/server.ts (Update): Refactor the server file to mount these new routes at /api/campaigns, /api/buyers, etc.
 * prisma/seed.ts: Provide a seed script that creates 1 Supplier, 1 Campaign, 1 Buyer, 1 Offer, and 1 Phone Number.
   * This will allow me to run npx prisma db seed and make a real test call immediately.
Go ahead."
```

Why this is the right next step:
You are shifting from "System Architecture" to "User Acceptance Testing." By asking for a Seed Script, you bypass hours of manual Postman entries and get straight to the "Does it ring?" test.

## Building the Admin Layer and Seed Script

### Agent Response & Critiques

This code is clean and follows the pattern, but it leaves your backend 50% incomplete based on the OpenAPI spec we agreed on.

#### The Critique:
*   Operational Blindness: You built the "Configuration" endpoints (Campaigns/Buyers), but you missed the "Runtime" endpoints.
    *   No `GET /api/calls`: You have no way to see the calls flowing through the system via the API.
    *   No `GET /api/numbers`: You cannot view your phone number inventory.
*   Revenue Gap: You missed `POST /api/conversions`. While the system handles duration-based revenue, it currently cannot accept offline events (like "Sale Made" or "Policy Bind"), which is a core requirement (FR-17) for a sophisticated exchange.
*   Monolithic Routing: Mounting everything in `admin.controller.ts` is an anti-pattern. High-volume read endpoints (Reporting) should be separated from low-volume write endpoints (Configuration).

Here is the prompt to finish the backend API surface so it matches the spec completely.

```text
"We are halfway there. You built the 'Configuration' API, but you missed the 'Operational' API.
According to our OpenAPI spec, we are still missing the endpoints that let me run the business day-to-day. I cannot see my calls, I cannot check my numbers, and I cannot ingest offline conversions.
Please complete the backend by generating these two new modules:
 * src/modules/reporting/reporting.controller.ts:
   * Implement GET /api/calls: Must support date filtering (from/to) and pagination envelopes.
   * Implement GET /api/numbers: List phone numbers with filters.
 * src/modules/conversion/conversion.controller.ts:
   * Implement POST /api/conversions: This is critical. It must look up the CallSession by public_id, validate the buyer_id matches, and insert a ConversionEvent.
   * Economics Logic: When a conversion is received, update the CallSession.revenueEstimatedCents if this event generates more revenue than the duration-based calculation.
Finally, provide the updated src/server.ts that mounts these new routers."
```

## Completing the Backend API Surface (Reporting & Conversion)

### Agent Response & Critiques

This response is Complete in terms of logic, but Unsafe in terms of operations.

#### The Critique:
*   The "Silent Fail" Risk: Your code uses `console.warn` if `TWILIO_AUTH_TOKEN` is missing. In a 2025 production environment, an app should crash immediately on startup if critical security credentials are missing. Do not allow the server to boot in an insecure state.
*   The "Guesswork" Gap: You have referenced various environment variables (`DATABASE_URL`, `TWILIO_AUTH_TOKEN`, `PORT`) across multiple files. A developer (or you) picking this up will struggle to know exactly what needs to be in the `.env` file without `grepping` the codebase.
*   No Instructions: We have a Ferrari engine (the code), but no keys (the `.env`) and no manual (the test scripts).

Here is the prompt to package this up for immediate execution.

```text
"The code is functionally complete, but it is not operationally safe yet. We need to lock down the configuration and provide a 'Day 1 Runbook'.
Please provide the final three artifacts to wrap up this backend:
 * src/config/env.ts: A centralized configuration file that validates environment variables on startup.
   * If DATABASE_URL or TWILIO_AUTH_TOKEN are missing, throw an error and exit the process. Do not just warn.
   * Update server.ts to import this config at the very top.
 * .env.example: A clear list of all required variables.
 * README.md (The "Day 1 Runbook"): A concise guide containing:
   * How to install & seed.
   * The "Smoke Test" cURL commands:
     * One command to Create a Campaign (Admin API).
     * One command to Simulate an Inbound Call (Telephony Webhook).
     * One command to Check the Call Logs (Reporting API).
     * One command to Post a Conversion (Conversion API).
This is the final step. Make it so I can copy-paste these files, run npm start, and see it work."
```

## Operational Safety and Day 1 Runbook

### Agent Response & Critiques

This response is Perfect. It provides the "Keys" (Env), the "Manual" (Runbook), and the "Safety Rails" (Validation) required to actually hand this off to another human.

The backend is now "Done." It is secure, observable, type-safe, and documented.

#### The Critique:
*   Verdict: 10/10. No code changes needed for the backend.
*   Observation: You now have a Ferrari engine sitting in a garage. You can't drive it because it has no steering wheel (UI). Running an exchange via cURL commands is impossible for daily operations.

It is time to build the Frontend.

```text
"This is a masterpiece of a V1 backend. You have delivered a secure, observable, and economically aware system with a complete runbook.
However, a backend without a frontend is just a fancy database. I cannot run a business using cURL commands.
Let's build the Admin UI (Next.js 15 + Shadcn UI).
Critically, I want to maintain the '2025' standard of End-to-End Type Safety. I do not want to manually re-type interfaces in the frontend.
Please provide the setup for the Frontend:
 * The Strategy: Briefly explain how we will share the openapi/dcx.yaml (or generated types) so the frontend stays in sync with the backend.
 * frontend/package.json: The dependencies for Next.js 15, openapi-fetch (the modern way to consume OpenAPI), and Shadcn.
 * frontend/src/lib/api.ts: A pre-configured API client that uses the OpenAPI definition to provide autocomplete for all backend routes (e.g., client.GET('/api/campaigns')).
 * frontend/app/page.tsx: A Dashboard Skeleton that fetches the Backend Health status and displays it, just to prove the connection works.
Assume I am creating a new folder frontend/ next to backend/.”
```

## Frontend Setup (Next.js 15 + Shadcn UI)

### Agent Response & Critiques

This response is Valid, but it skips the "Boilerplate Hell" that kills momentum.

#### The Critique:
*   Missing Init: You cannot just create `package.json` manually. You need to run `create-next-app` to generate the config files (`next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, etc.).
*   Boring Scope: A "Health Check" proves connection, but it doesn't prove Type Safety. The real test is fetching a list (like Campaigns), rendering a Table, and seeing if TypeScript protects you when you try to access `campaign.stauts` (typo) vs `campaign.status`.
*   Shadcn Reality: Real Shadcn tables (using TanStack Table) are verbose. We need the AI to generate that boilerplate so you don't have to read the docs for 2 hours.

Here is the prompt to move from "Setup" to "Feature Development".

```text
"This is good theory, but I cannot just paste package.json into a folder and expect Next.js to work. I need the initialization commands.
Also, a 'Health Check' is boring. I want to see the Type Safety in action with real data.
Please provide the next phase:
 * The Init Script: Give me the exact npx commands to:
   * Create the Next.js 15 app.
   * Initialize Shadcn UI.
   * Install the required components (table, badge, button).
 * The Campaigns Page (app/campaigns/page.tsx):
   * Fetch the data server-side using apiClient.GET('/api/campaigns').
   * Pass the typed data to a client component.
 * The Data Table (components/campaigns/table.tsx):
   * Build a Shadcn Table that renders the campaigns.
   * Crucial: Show me the Type Safety. I want to see explicit typing where campaign.status is known to be 'ACTIVE' | 'INACTIVE' (an Enum), not just string.
Show me how the OpenAPI spec powers the UI."
```

## Initializing Frontend and Displaying Campaigns (Type-Safe)

### Agent Response & Critiques

This response is Solid. It correctly sets up the type-safe foundation.

However, you are still "Read-Only." You can see campaigns, but you cannot operate the business. The core of a Call Exchange is the Calls Log—watching traffic in real-time and reconciling revenue.

Currently, if a buyer calls you and says, "I just converted lead X," you have to open a terminal and write a cURL command to get paid. That is unacceptable.

Here is the prompt to build the Operational Dashboard (The "Money" View).

```text
"Excellent. The type safety on the Campaigns table is exactly what I wanted.
But a Call Exchange isn't about configuring campaigns; it's about processing calls. Right now, I can't see my traffic or get paid without using cURL.
Let's build the 'Money' View. Please provide:
 * app/calls/page.tsx: The server component to fetch /api/calls.
 * components/calls/columns.tsx: Define the table columns.
   * Economics: Show Cost (in Red) and Revenue (in Green).
   * Profit: Calculate Revenue - Cost on the fly and display it.
 * components/calls/conversion-dialog.tsx:
   * A Shadcn Dialog that opens when I click a 'Simulate Conversion' action on a row.
   * Form: A simple input for Revenue ($).
   * Action: It must POST to /api/conversions using the typed client.
   * Refresh: On success, call router.refresh() to reload the server component and update the Revenue column instantly.
This completes the loop: I can see the call, click 'Convert', and watch the Profit turn green."
```

## Building the Operational Dashboard ("Money View")

### Agent Response & Critiques

This response is Functionally Complete and completes the "Operational Loop." You now have a working mechanism to view calls and manually inject revenue, effectively turning the lights on for your business logic.

However, the user experience is currently Fragmented. You have created several excellent pages (`/campaigns`, `/calls`, `/`), but you have no way to navigate between them without manually typing URLs in the browser address bar. A real application needs an App Shell.

Here is the prompt to bind these loose pages into a cohesive Product.

```text
"The 'Money View' is perfect. I can now track profit and inject conversions. The V1 feature set is technically complete.
However, the application feels disjointed. I am manually typing localhost:3000/calls and localhost:3000/campaigns in the URL bar.
Let's glue this together with a Professional Admin Layout.
Please provide:
 * components/layout/sidebar.tsx: A polished Sidebar navigation component.
   * Links: Dashboard (/), Campaigns (/campaigns), Calls (/calls).
   * Styling: Dark mode, using slate grays to match the existing theme. Use lucide-react for icons (LayoutDashboard, Megaphone, Phone).
 * app/layout.tsx: Refactor the root layout to implement a permanent Sidebar + Main Content structure.
 * app/page.tsx (Update): Refine the main dashboard to include 'Quick Stats' cards (Calls Today, Revenue Today) that actually fetch data from the backend, effectively replacing the boring 'Health Check'.
This turns a collection of pages into a real Application."
```

## Building the App Shell (Admin Layout with Sidebar and Dashboard Stats)

### Agent Response & Critiques

This is the final piece of the puzzle. You have a beautiful, functional application, but it has one fatal flaw: The Admin API is wide open.

Currently, anyone who can reach `http://localhost:4000/api/campaigns` can delete your entire business configuration. The OpenAPI spec defined `adminBearerAuth`, but we never implemented it in the server or the client.

Here is the prompt to lock the system down before you declare victory.

```text
"This App Shell is fantastic. It feels like a real product now.
However, we have a massive security hole: The Admin API is completely public. We built a 'Fort Knox' for Twilio signatures, but left the front door unlocked for the Admin panel.
Let's lock it down with a simple but effective API Key authentication (V1 Standard).
Please provide:
 * Backend (src/middleware/auth.ts): A middleware function that checks the Authorization: Bearer <KEY> header against a new ADMIN_API_KEY env var. Return 401 if it fails.
 * Backend (src/server.ts Update): Mount this middleware specifically to protect the /api routes (Admin + Reporting), but leave /twilio and /health public.
 * Frontend (src/lib/api.ts Update): Update the OpenAPI client to inject this API Key (from NEXT_PUBLIC_ADMIN_API_KEY) into the headers of every request.
 * Updated .env.example: Add the new key to both backend and frontend sections.
Now the system is secure by design."
```

## Implementing Admin API Key Authentication

You’re totally right: right now the Twilio door is locked but the admin side is wide open. Let’s fix that cleanly.

Below are all the pieces you asked for, plus a tiny update to `env.ts` so the new key is validated on startup (to keep your “2025 safety rails” intact).

### 1. Backend – `src/middleware/auth.ts`

API-key auth middleware for `/api` routes.

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Simple Bearer API key auth for admin/reporting APIs.
 *
 * Expects:
 *   Authorization: Bearer <ADMIN_API_KEY>
 *
 * - Skips OPTIONS to avoid breaking CORS preflight.
 * - Returns 401 on missing/invalid key.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Allow CORS preflight through without auth
  if (req.method === 'OPTIONS') {
    return next();
  }

  const header =
    req.header('authorization') || req.header('Authorization') || '';

  if (!header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token || token !== env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  return next();
}
```

### 2. Backend – `src/config/env.ts` (Update)

Add `ADMIN_API_KEY` to the validated config so the server refuses to boot without it.

```typescript
// backend/src/config/env.ts
import 'dotenv/config';

type NodeEnv = 'development' | 'test' | 'production';

interface EnvConfig {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  TWILIO_AUTH_TOKEN: string;
  ADMIN_API_KEY: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value.trim();
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return n;
}

const NODE_ENV_RAW = process.env.NODE_ENV || 'development';
const NODE_ENV: NodeEnv =
  NODE_ENV_RAW === 'production' ||
  NODE_ENV_RAW === 'test' ||
  NODE_ENV_RAW === 'development'
    ? NODE_ENV_RAW
    : 'development';

const DATABASE_URL = requireEnv('DATABASE_URL');
const TWILIO_AUTH_TOKEN = requireEnv('TWILIO_AUTH_TOKEN');
const ADMIN_API_KEY = requireEnv('ADMIN_API_KEY');
const PORT = parsePort(process.env.PORT, 4000);

export const env: EnvConfig = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  TWILIO_AUTH_TOKEN,
  ADMIN_API_KEY
};
```

### 3. Backend – `src/server.ts` (Update)

Mount the auth middleware on `/api` only (Admin + Reporting + Conversions). Twilio and health stay public.

```typescript
// backend/src/server.ts
import { env } from './config/env'; // must be first to validate env

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import createError from 'http-errors';

import { telephonyRouter } from './modules/telephony/telephony.controller';
import { routingRouter } from './modules/routing/routing.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { reportingRouter } from './modules/reporting/reporting.controller';
import { conversionRouter } from './modules/conversion/conversion.controller';
import { adminAuth } from './middleware/auth';

const app = express();

// Trust proxy if you're behind a load balancer (important for Twilio URL calculation)
app.set('trust proxy', true);

// Global middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// JSON body parsing for normal APIs
app.use(express.json());

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime_seconds: process.uptime()
  });
});

// Telephony webhooks (Twilio, public but signature-protected)
app.use('/twilio', telephonyRouter);

// Internal routing API (you may put this behind VPN / infra security)
app.use('/internal', routingRouter);

// ---- Protected Admin / Reporting / Conversion APIs ----

// All /api/* routes require valid ADMIN_API_KEY
app.use('/api', adminAuth);

// Admin API (configuration): /api/campaigns, /api/buyers, /api/offers
app.use('/api', adminRouter);

// Reporting API (runtime views): /api/calls, /api/numbers
app.use('/api', reportingRouter);

// Conversion API (offline events): /api/conversions
app.use('/api', conversionRouter);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404, 'Not Found'));
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  const response: any = { message };
  if (env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
});

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DCX backend listening on port ${PORT} (${env.NODE_ENV})`);
});
```

### 4. Frontend – `src/lib/api.ts` (Update)

Inject the admin API key into every request from the frontend client.

⚠️ For a real multi-user SaaS you’d use proper auth (sessions, JWT, etc.).
For this single-tenant Admin console, you explicitly asked for a simple API key and are okay with `NEXT_PUBLIC_...`, so we’ll follow that.

```typescript
// frontend/src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const adminApiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

/**
 * Typed API client for the DCX backend.
 *
 * Adds:
 *   Authorization: Bearer <NEXT_PUBLIC_ADMIN_API_KEY>
 * to all requests, so protected /api routes succeed.
 */
export const apiClient = createClient<paths>({
  baseUrl,
  headers: {
    ...(adminApiKey
      ? { Authorization: `Bearer ${adminApiKey}` }
      : {})
  }
});
```

If `NEXT_PUBLIC_ADMIN_API_KEY` is missing, requests will go without the header and you’ll see `401`s — which is good feedback in dev.

### 5. Updated `.env.example`

Add the new key for backend and frontend so the “Day 1 Runbook” is still complete.

```dotenv
# .env.example
# Copy this file to `.env` in the backend root and fill in the values.

# Node environment
NODE_ENV=development

# HTTP server port
PORT=4000

# PostgreSQL connection string
# Example:
# DATABASE_URL="postgresql://user:password@localhost:5432/dcx?schema=public"
DATABASE_URL="postgresql://user:password@localhost:5432/dcx?schema=public"

# Twilio Auth Token (from your Twilio Console)
# Used to validate X-Twilio-Signature on /twilio/voice and /twilio/status.
TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"

# Admin API Key (backend)
# Used by adminAuth middleware to protect /api routes.
ADMIN_API_KEY="super_secret_admin_api_key_here"


# -------------------------------------------------------------------
# Frontend configuration (in /frontend/.env.local)
# -------------------------------------------------------------------
# Example .env.local for the frontend (Next.js):
#
# NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
# NEXT_PUBLIC_ADMIN_API_KEY="super_secret_admin_api_key_here"
#
# Ensure NEXT_PUBLIC_ADMIN_API_KEY matches ADMIN_API_KEY above.
```

In practice you’ll:

Set `ADMIN_API_KEY` in backend `.env`.

Set `NEXT_PUBLIC_ADMIN_API_KEY` in frontend `.env.local` to the same value.

Restart both backend and frontend.

Now:

`/twilio/*` and `/health` are still reachable without auth (but Twilio webhooks are STIR/SHAKEN-style signature-protected).

`/api/*` (Admin, Reporting, Conversions) requires `Authorization: Bearer <ADMIN_API_KEY>`.

The frontend automatically includes that header via the typed client, so the app “just works” — but `cURL` or a random browser tab hitting `/api/campaigns` gets a clean `401`.
