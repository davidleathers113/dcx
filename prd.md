

# Product Requirements Document

**Product Name (working):** Dependable Call Exchange (DCX)
**Owner:** David
**Version:** v1.1 (2025-ready, Twilio-first)
<!-- Manually updated to PRD v1.1 to capture compliance/AI/observability scope per latest review. -->

---

## 1. Problem & Opportunity

### 1.1 Problem

* Current pay-per-call stack relies heavily on **TrackDrive**, which:

  * Adds a **large markup** on telephony (you’re spending ~$100k/year).
  * Locks core business logic (routing, reporting, CPA events) in a **black-box SaaS**.
  * Limits flexibility for **custom routing, ping/post, and marketplace-style bidding**.

* You also operate **VICIdial** for in-house call centers, but:

  * It’s not well-suited as a **multi-tenant pay-per-call exchange**.
  * You lack a single place to see **all calls**, from all sources, mapped to **suppliers, buyers, campaigns, and CPA outcomes**.

### 1.2 Opportunity

Build your own CPaaS-based **Exchange/Router app** on Twilio (with future Telnyx abstraction) that:

* Owns **phone numbers**, **routing**, and **call tracking**.
* Provides transparent **profitability and CPA reporting** across all buyers/suppliers.
* Supports **ping/post and RTB-style bidding** over time.
* Integrates with **VICIdial and external suppliers/buyers** via APIs and webhooks.

This lets you:

* Capture TrackDrive’s margin.
* Control quality and compliance end-to-end.
* Treat the platform as a **defensible asset** in the Dependable ecosystem.

---

## 2. Product Vision & Scope

### 2.1 Vision

> A self-hosted, developer-friendly pay-per-call exchange that routes inbound calls in real time to the best buyer, logs all economics, and exposes clear reporting and APIs to buyers and suppliers.

### 2.2 In-Scope (v1 MVP)

* Single-carrier implementation using **Twilio** (Voice + Numbers).
* **Core routing** for inbound calls:

  * Numbers mapped to campaigns and suppliers.
  * Buyer stacks (priority routing with caps).
* **Call tracking**:

  * Create `CallSession` and durations.
  * Capture basic cost from Twilio.
* **Basic admin console** (you/internal only):

  * Manage suppliers, buyers, campaigns, offers, numbers.
  * View call logs and high-level profitability.
* **Foundations for CPA**:

  * Data model and API endpoint for conversion events.
* Simple **webhook framework**:

  * Outbound: send call events to external systems.
  * Inbound: receive leads or events.

### 2.3 Out-of-Scope (for v1, planned for v2+)

* Full buyer/supplier **self-service portals**.
* Full-featured **ping/post & RTB bidding**.
* Multi-carrier routing (Telnyx, etc.).
* Elaborate dispute flows and QA tools.
* Complex permissions & multi-tenant user management.

---

## 3. Personas & Use Cases

### 3.1 Personas

1. **Exchange Owner (You / Ops Admin)**

   * Needs: configure campaigns, onboard buyers/suppliers, debug routing, see profit.

2. **Supplier (Publisher / Call Center / Network) – v2**

   * Needs: see calls sent, payouts, disputes.

3. **Buyer (Call Center / Law Firm / Agency) – v2**

   * Needs: see calls received, conversion rates, control caps/schedules.

For v1 MVP, the **Admin persona** is primary; Buyer/Supplier use internal reports/manual comms.

### 3.2 Key v1 Use Cases

* As Admin, I can:

  1. Purchase numbers from Twilio and assign them to campaigns/suppliers.
  2. Define buyers and configure buyer stacks for each campaign.
  3. Route inbound calls on those numbers to buyers, with basic caps & fallback.
  4. View call history and see which buyer took which call.
  5. See estimated **telephony cost vs expected revenue** at a per-call and aggregated level.
  6. Receive CPA conversion events via an API and attach them to calls.
  7. Export call data (CSV/JSON) for accounting and further analysis.

---

## 4. High-Level Architecture

### 4.1 Components

1. **CPaaS Provider**

   * Twilio Voice + Numbers (TwiML Apps, webhooks).

2. **Backend Services**

   * **Telephony Service** (Twilio-facing):

     * Receives Twilio webhooks (status, call events).
     * Responds with TwiML to route calls.
     * Creates/updates call records.
   * **Routing Engine**:

     * Given campaign/supplier/call metadata, chooses buyer (and fallback stack).
   * **Core API**:

     * CRUD for suppliers, buyers, campaigns, numbers.
     * Endpoints for call and conversion data.
   * Optional: Provider abstraction layer (for future Telnyx, etc.).

3. **Database**

   * PostgreSQL (preferred) or Mongo (if leaning on Twilio sample structure).
   * Central source of truth for:

     * Suppliers, buyers, campaigns, offers.
     * Phone numbers, call sessions, call legs, conversion events.

4. **Admin Web App**

   * Next.js (or similar React-based) app.
   * Talks to backend via REST APIs.

---

## 5. Domain Model (v1)

### 5.1 Core Entities

**Supplier**

* `id`
* `name`
* `type` (internal_call_center, external_publisher, network, etc.)
* `contact_info` (email, phone)
* `status` (active/inactive)

**Buyer**

* `id`
* `name`
* `endpoint_type` (phone_number, sip, internal_queue)
* `endpoint_value` (e.g., `+15551234567`)
* `status` (active/inactive)
* `max_concurrent_calls` (int)
* `daily_cap` (int, optional)
* `schedule` (e.g., hours of operation)
* `weight` (optional for weighted routing)
* `schedule_timezone` and structured `schedule_rules` JSON

**Campaign**

* `id`
* `name`
* `vertical` (e.g., SSDI, Medicare, Final Expense)
* `geo` (allowed states/regions)
* `supplier_id` (optional default supplier)
* `status` (active/inactive)
* `recording_default_enabled`

**Offer** (buyer x campaign)

* `id`
* `campaign_id`
* `buyer_id`
* `pricing_model` (CPA, CPC, revshare, hybrid; for v1 assume CPA or fixed payout per qualified call)
* `payout_amount` (per conversion or per qualified call)
* `min_call_duration_sec` (for qualification)
* `attribution_window_days` (for CPA events)
* `daily_cap` (per buyer per campaign)
* `priority` (for routing)
* `weight` (optional, for weighted distribution)
* `is_active` flag

**PhoneNumber**

* `id`
* `twilio_sid`
* `e164` (e.g., `+15551234567`)
* `campaign_id`
* `supplier_id` (owner of source)
* `pool_type` (static, dynamic)
* `status` (active/inactive)
* `trust_profile_id` (Twilio Trust Hub linkage)
* `stir_shaken_attestation_level` (`A/B/C/UNKNOWN`)
* `a2p_brand_id` / `a2p_campaign_id` (if SMS capable)

**CallSession**

* `id`
* `public_id` (safe external identifier)
* `twilio_call_sid` (or parent if multiple legs)
* `trace_id` (internal correlation ID)
* `from_number`
* `to_number` (the DID the consumer dialed)
* `campaign_id`
* `supplier_id`
* `buyer_id` (final routed buyer)
* `offer_id`
* `start_time`
* `answer_time`
* `end_time`
* `duration_sec`
* `billable_duration_sec`
* `telephony_cost` (estimated using Twilio rates)
* `expected_revenue` (from offer)
* `status` (initiated, answered, completed, failed)
* `recording_url` (optional)
* `recording_enabled` (boolean)
* `recording_consent_source` (`IMPLICIT_IVR`, `AGENT_VERBAL`, `NONE`)
* `transcription_status` (`none`, `pending`, `completed`, `failed`)
* `transcription_text` (optional)
* `sentiment_score` (optional numeric)
* `llm_qa_score` (optional numeric)
* `disposition` (optional string/enum for v2)
* `created_by` / `updated_at` metadata

**ConversionEvent**

* `id`
* `call_session_id`
* `buyer_id`
* `event_type` (e.g., `case_filed`, `policy_issued`)
* `event_time`
* `revenue` (if variable; else lookup from offer)
* `source` (buyer_webhook, manual_import, etc.)

**CallAIJob**

* `id`
* `call_session_id`
* `job_type` (`TRANSCRIBE`, `QA_EVAL`)
* `status` (`pending`, `in_progress`, `completed`, `failed`)
* `created_at`, `updated_at`

**MessagingRegistration**

* `id`
* `phone_number_id`
* `a2p_brand_id`
* `a2p_campaign_id`
* `channel` (supplier alerts, buyer alerts, consumer notifications)

**SmsOptOut**

* `phone_number` (MSISDN)
* `opted_out_at`
* `source` (`STOP`, admin, import)
<!-- Manually added new entities to prevent disruptive migrations later. -->

### 5.2 TypeScript Model (2025 baseline)
<!-- Manually added TS-style types so engineering can lift into Prisma/OpenAPI without translation. -->

```
// enums / type aliases
export type PricingModel = 'CPA' | 'FIXED' | 'CPC' | 'REVSHARE';

export type CallStatus =
  | 'INITIATED'
  | 'RINGING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'BUSY'
  | 'NO_ANSWER';

export type TranscriptionStatus = 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
export type AIJobType = 'TRANSCRIBE' | 'QA_EVAL';

export interface Supplier {
  id: string;
  name: string;
  type: 'INTERNAL_CALL_CENTER' | 'EXTERNAL_PUBLISHER' | 'NETWORK';
  contact_email?: string;
  contact_phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface Buyer {
  id: string;
  name: string;
  endpoint_type: 'PHONE_NUMBER' | 'SIP';
  endpoint_value: string;
  concurrency_limit: number;
  daily_cap?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  weight: number;
  schedule_timezone?: string;
  schedule_rules?: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: string;
  name: string;
  vertical: string;
  geo_rules?: unknown;
  supplier_id?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  recording_default_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Offer {
  id: string;
  buyer_id: string;
  campaign_id: string;
  pricing_model: PricingModel;
  payout_cents: number;
  buffer_seconds: number;
  attribution_window_days: number;
  daily_cap?: number | null;
  priority: number;
  weight: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PhoneNumber {
  id: string;
  twilio_sid: string;
  e164: string;
  campaign_id: string;
  supplier_id: string;
  pool_type: 'STATIC' | 'DYNAMIC';
  status: 'ACTIVE' | 'INACTIVE';
  trust_profile_id?: string;
  stir_shaken_attestation?: 'A' | 'B' | 'C' | 'UNKNOWN';
  a2p_brand_id?: string;
  a2p_campaign_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CallSession {
  id: string;
  public_id: string;
  trace_id: string;
  twilio_call_sid: string;
  from_number: string;
  to_number: string;
  campaign_id: string;
  supplier_id: string;
  buyer_id?: string | null;
  offer_id?: string | null;
  status: CallStatus;
  created_at: Date;
  answered_at?: Date | null;
  ended_at?: Date | null;
  duration_seconds: number;
  billable_duration_seconds: number;
  telephony_cost_cents: number;
  revenue_estimated_cents: number;
  recording_enabled: boolean;
  recording_url?: string | null;
  recording_consent_source?: 'IMPLICIT_IVR' | 'AGENT_VERBAL' | 'NONE';
  transcription_status: TranscriptionStatus;
  transcription_text?: string | null;
  sentiment_score?: number | null;
  llm_qa_score?: number | null;
  created_by?: string | null;
  updated_at: Date;
}

export interface ConversionEvent {
  id: string;
  call_session_id: string;
  buyer_id: string;
  event_type: string;
  event_time: Date;
  revenue_cents?: number | null;
  source: 'BUYER_WEBHOOK' | 'MANUAL_IMPORT' | 'INTERNAL';
  created_at: Date;
}

export interface CallAIJob {
  id: string;
  call_session_id: string;
  job_type: AIJobType;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  created_at: Date;
  updated_at: Date;
}
```


---

## 6. Functional Requirements

### 6.1 Telephony Integration (Twilio)

**FR-1**: Configure Twilio TwiML App

* The system must expose a public endpoint (via HTTPS) to receive Twilio Voice webhooks and respond with TwiML.
* This endpoint is set as the Voice URL of a TwiML App; purchased numbers are associated with that TwiML App.

**FR-2**: Inbound Call Handling

* On inbound call:

  * Identify the called number (DID).
  * Lookup `PhoneNumber` → `campaign_id` and `supplier_id`.
  * Create a `CallSession` record with initial status `initiated`.
  * Call the Routing Engine to select buyer.
  * Generate TwiML to `<Dial>` the chosen buyer endpoint.
  * Attach `StatusCallback` URL so subsequent events update the call.

**FR-3**: Status Callbacks & Lifecycle

* System must handle Twilio status callbacks for:

  * `ringing`, `in-progress`, `completed`, `busy`, `failed`, etc.
* For each callback:

  * Update `CallSession` fields (answer time, end time, duration, status).
  * Save recording URL if recording is enabled.

**FR-4**: Recording (optional v1)

* Optionally record buyer leg:

  * Use TwiML or API to enable call recording.
  * Store `recording_url` on `CallSession`.

---

### 6.2 Number & Campaign Management

**FR-5**: Buy Numbers from Twilio

* Admin can:

  * Search available numbers by country/area code.
  * Purchase numbers.
  * Automatically attach numbers to the TwiML App used for routing.
* Persist new numbers into `PhoneNumber`.

**FR-6**: Assign Numbers to Campaigns/Suppliers

* Admin can:

  * Assign a `campaign_id` + `supplier_id` to each number.
  * View which numbers belong to which campaign and supplier.

**FR-7**: Campaign CRUD

* Admin can create/edit campaigns:

  * Name, vertical, geo, status.

**FR-8**: Supplier CRUD

* Admin can create/edit suppliers:

  * Name, type, status, contact info.

---

### 6.3 Buyer & Routing Management

**FR-9**: Buyer CRUD

* Admin can create/edit buyers:

  * Name, endpoint type (for v1: phone_number).
  * Endpoint value, caps, schedule.

**FR-10**: Offer Management (Buyer x Campaign)

* Admin can define offers per buyer + campaign:

  * Pricing model (CPA/fixed payout).
  * Payout amount.
  * Min call duration.
  * Daily cap.
  * Priority/weight.

**FR-11**: Routing Engine – Basic Stack Routing

* Given `campaign_id` and optional context, Routing Engine must:

  * Retrieve all active offers for that campaign.
  * Filter:

    * Buyers active by schedule (time-of-day/day-of-week).
    * Buyers not at daily cap and within concurrency limits.
  * Sort offers by priority; for ties use weight for approximate distribution.
  * Return a primary `buyer_id` + endpoint, and a fallback ordered list.

**FR-12**: First-Version Failover

* If primary buyer call fails (`busy`, `no-answer`, `failed`) before connect:

  * (v1.0 optional) At least log the failure reason.
  * (v1.1) Optionally attempt the next buyer in stack, within a defined max ring time.

---

### 6.4 Call Tracking & Economics

**FR-13**: Call Creation

* On inbound call:

  * Create `CallSession` with:

    * supplier, campaign, call_sid, buyer chosen, offer.
    * start_time from Twilio event.

**FR-14**: Call Completion

* On completion callback:

  * Update:

    * answer_time, end_time, duration_sec.
    * billable_duration_sec (initially equal to duration_sec for v1).
  * Compute:

    * `expected_revenue` = payout_amount (offer) if duration >= min_call_duration.
    * `telephony_cost` using Twilio rates (v1: approximate via static config).
    * Profit = expected_revenue – telephony_cost.

**FR-15**: Call List & Detail View

* Admin UI exposes:

  * Paginated list of calls with filters (date range, campaign, supplier, buyer).
  * Per-call detail, including:

    * Caller, called number, supplier, campaign, buyer.
    * Duration, status, recording URL.
    * Expected revenue, telephony_cost, profit.

**FR-16**: Export

* Admin can export calls (CSV/JSON) by date range.

---

### 6.5 CPA Tracking

**FR-17**: Conversion Event API

* Provide endpoint:

  * `POST /api/conversions`
  * Body includes:

    * `call_id` (internal or a public tracking id).
    * `buyer_id`.
    * `event_type`.
    * `event_time`.
    * `revenue` (optional if fixed).
* On receipt:

  * Validate call and buyer IDs.
  * Insert `ConversionEvent`.
  * Mark `CallSession` as `converted` and store effective revenue.

**FR-18**: Attribution Rules (v1 simple)

* For MVP, assume:

  * Any conversion event for a call marks that call as paid.
  * No attribution window enforced yet (just store event_time).

**FR-19**: Conversion & Profit Reporting

* Admin UI must:

  * Show conversion count and revenue per buyer, supplier, campaign over a date range.
  * Show margin = revenue – telephony_cost.

---

### 6.6 Webhooks & Integrations

**FR-20**: Outbound Webhooks for Call Events (v1 basic)

* Allow configuring **global** webhook URL(s) for outbound event notifications.
* On key events (call started, call completed, conversion received):

  * POST JSON payload to configured URLs.
* Must have basic retry strategy on 5xx failures.

**FR-21**: Inbound Lead Webhook (v1 placeholder)

* Create a stub endpoint to accept incoming leads:

  * `POST /api/leads` with basic info (name, phone, campaign).
  * For v1, store only; linking to outbound call workflows can be deferred.

---

### 6.7 Admin UI

**FR-22**: Authentication (v1 simple)

* Simple password or magic-link login for Admin (single-user / low user count).
* Session management via JWT or server sessions.

**FR-23**: Admin Screens (MVP set)

Screens:

1. **Dashboard**

   * KPIs: calls today, total minutes, estimated revenue, profit.
   * Simple charts by campaign/buyer.

2. **Suppliers**

   * List: name, type, status.
   * Detail: associated campaigns, numbers, and recent calls.

3. **Buyers**

   * List: name, status, caps.
   * Detail: offers, calls, performance.

4. **Campaigns**

   * List: name, vertical, geo, status.
   * Detail: assigned numbers, offers, performance.

5. **Numbers**

   * List: phone numbers, campaign, supplier, status.
   * Actions: assign/unassign, buy new number.

6. **Calls**

   * Table with filters.
   * Detail view: call timeline + economics + recording.

7. **Settings**

   * Twilio config (SID, auth token).
   * Webhook endpoints for outbound events.

---

## 7. Non-Functional Requirements

**NFR-1: Reliability**

* Telephony webhook endpoint must maintain >99.5% uptime.
* Response time to Twilio must be <500ms for most requests (to avoid timeouts).

**NFR-2: Scalability (v1)**

* Support:

  * 100–500 concurrent calls.
  * Tens of thousands of calls/month without performance degradation.
* DB schema and indexes must support filtering calls by date, campaign, buyer.

**NFR-3: Security**

* All external endpoints over HTTPS.
* Environment variables for Twilio creds, DB connection.
* Basic input validation on all APIs.
* Restrict access to Admin UI via auth & role checks.

**NFR-4: Observability**

* Log all webhook events with correlation ID (Twilio `CallSid`).
* Basic metrics:

  * Calls per minute, error rate, webhook failures.

**NFR-5: Compliance / Privacy (high-level)**

* Configurable data retention for recordings and PII (future).
* Ability to delete call recordings on request.

---

## 8. Implementation Phases

### Phase 1 – Core Telephony + Routing MVP

* Implement Telephony Service:

  * Handle Twilio webhooks + TwiML responses.
* Implement core entities in DB.
* Implement Routing Engine (priority-based offers).
* Implement call creation/update + basic economics.
* Build minimal Admin UI for:

  * Suppliers, buyers, campaigns, numbers, calls.
* Deploy in a dev/staging environment.
* Route a **small test campaign** off TrackDrive.

### Phase 2 – CPA & Reporting

* Add ConversionEvent API and attribution logic.
* Add conversion and margin reporting to Admin UI.
* Harden export (CSV/JSON) and webhooks for call/conversion events.
* Onboard 1–2 buyers to send conversion events via API or CSV import.

### Phase 3 – Scale-up & Early Portals

* Move more campaigns from TrackDrive.
* Add basic supplier and buyer read-only portal views.
* Add simple dispute flags at call level (manual for now).
* Begin designing ping/post and RTB interfaces (but not fully implementing).

---

## 9. Risks & Open Questions

### 9.1 Risks

* **Telephony edge cases** (timeouts, double callbacks) causing inconsistent call states.
* **Underestimating complexity** of CPA and dispute handling.
* **Migration risk** if buyer performance / answer rates differ due to routing changes.

### 9.2 Open Questions

1. How strictly do buyers need **self-service controls** (caps, schedules) in v1 vs manual ops?
2. Do you want to **normalize Twilio CallSid** into an external “Public Call ID” that’s safe to share with external parties?
3. Do you need **multi-tenant separation** (e.g., white-labeled instances) early, or is single-tenant enough for now?
4. How precise must **telephony cost** be in v1 (live rating vs simple configuration)?

---

## 10. Regulatory & Compliance (2025 Additions)
<!-- Manually captured compliance scope so infra and ops teams cannot defer it. -->

### 10.1 STIR/SHAKEN & Caller Trust

**REQ-COM-1 – Outbound Caller Trust Profile**

* Configure Twilio Trust Hub / Verified Caller ID profiles for every DCX-owned DID (and buyer-managed numbers when DCX provisions them).
* Enforce A-level attestation wherever Twilio supports it and store per-number metadata:
  * `trust_profile_id`
  * `stir_shaken_attestation_level` (`A/B/C/UNKNOWN`)
* Surface this metadata in the admin UI for troubleshooting and export it with call logs for auditing.

### 10.2 A2P 10DLC & Messaging

**REQ-COM-2 – A2P 10DLC Registration**

* Register DCX under the appropriate A2P brand(s) and campaign(s) for supplier alerts, buyer alerts, and potential consumer notifications.
* Persist `a2p_brand_id`, `a2p_campaign_id`, and mappings between messaging-enabled DIDs and the campaigns they belong to (`MessagingRegistration` entity).

**REQ-COM-3 – Opt-out Handling**

* Implement `sms_opt_outs` storage keyed by MSISDN.
* Honor Twilio-managed `STOP/START/HELP` flows but also replicate opt-out state internally so outbound notifications avoid violations and export data is consistent.

### 10.3 Recording & Privacy

**REQ-COM-4 – Recording Consent Metadata**

* `CallSession` retains `recording_enabled` and `recording_consent_source`.
* Admin UI exposes per-campaign defaults and per-buyer overrides so restricted buyers can disable recording.

**REQ-COM-5 – Retention Policy**

* Global settings for `recording_retention_days` and `cdr_retention_days`.
* Automated cleanup job that deletes/archives recordings (and downstream AI artifacts) past retention windows, with logging tied to `trace_id`.

---

## 11. AI Readiness & Data Strategy
<!-- Manually added AI scaffolding so future LLM/transcription work needs no schema churn. -->

* v1 captures all data necessary for v2 transcription, QA, and routing intelligence even if no AI workloads run yet.

### 11.1 AI-Ready Fields

**REQ-AI-1 – Transcription Fields**

* `CallSession` includes:
  * `recording_url`
  * `transcription_status`
  * `transcription_text` (short/medium calls)
  * `sentiment_score` (-1 to 1)
  * `llm_qa_score` (0–100)
* Long-form transcripts can spill into an external store, but metadata must stay in Postgres.

### 11.2 Async Processing Queue

**REQ-AI-2 – Async Processing Queue**

* Introduce `call_ai_jobs` table/queue with `job_type` (`TRANSCRIBE`, `QA_EVAL`) and job status lifecycle.
* v1 does not need to run workers; it only needs the abstraction so v2 can attach a job runner without DB migrations.

---

## 12. Observability & Tracing
<!-- Manually layered in observability guardrails to hit the <500 ms SLA. -->

### 12.1 Correlation & Trace IDs

**REQ-OBS-1 – Correlation IDs**

* Every call gets a UUID `trace_id` plus a public `call_public_id`.
* All logs, metrics, and outbound webhooks include both `trace_id` and `twilio_call_sid`.

### 12.2 OpenTelemetry Traces

**REQ-OBS-2 – OpenTelemetry Integration**

* Instrument spans:
  * `voice_webhook` (Twilio ingress)
  * `routing_decision`
  * `db_read` / `db_write` (where high latency risk)
  * `outbound_webhook`
* Spans share the originating `trace_id` to allow distributed tracing.

### 12.3 Latency Budget

**REQ-OBS-3 – Time-to-TwiML SLA**

* 95th percentile response time for Twilio webhooks must stay under 500 ms.
* Routing must operate from in-memory/cache data; synchronous external HTTP calls are forbidden.
* Emit `routing_decision_duration_ms` histogram and alert if p95 exceeds 400 ms.

### 12.4 Health & Error Budget

**REQ-OBS-4 – Health Checks**

* `/health` endpoint validates DB connectivity and required Twilio config.

**REQ-OBS-5 – Error Budget**

* Measure percentage of calls that fail before buyer connect due to internal errors and keep it below 0.5% with alerts that page ops when breached.

---

## 13. Spec-First API Surface (OpenAPI-ready)
<!-- Manually defined contracts so OpenAPI emission is straightforward. -->

### 13.1 Telephony Webhook (Twilio → DCX)

* **POST `/twilio/voice`**
  * `application/x-www-form-urlencoded`
  * Params: `CallSid`, `From`, `To`, `CallStatus`, plus Twilio standard values.
  * Idempotent per `CallSid` + `SequenceNumber`.
  * Responds with TwiML `<Dial>` for initial calls or empty `<Response/>` for callbacks.

### 13.2 Routing Decision (Internal)

* **POST `/internal/routing/decide`**
  * Auth: service-to-service (mTLS or signed token).
  * Request example:

```json
{
  "campaign_id": "camp_123",
  "supplier_id": "sup_456",
  "from_number": "+15551234567",
  "to_number": "+15559876543",
  "geo": { "country": "US", "state": "FL" },
  "timestamp": "2025-11-26T17:00:00Z"
}
```

  * Response example:

```json
{
  "buyer_id": "buyer_789",
  "offer_id": "offer_abc",
  "destination_type": "PHONE_NUMBER",
  "destination_value": "+15550001111",
  "max_ring_seconds": 30,
  "max_call_duration_seconds": 1800
}
```

### 13.3 Admin APIs (CRUD)

* Standard REST endpoints returning the JSON forms of the TypeScript interfaces:
  * `POST/GET/PATCH /api/suppliers`
  * `POST/GET/PATCH /api/buyers`
  * `POST/GET/PATCH /api/campaigns`
  * `POST/GET/PATCH /api/offers`
  * `POST /api/numbers/purchase`, `GET /api/numbers`, `PATCH /api/numbers/:id`
  * `GET /api/calls`, `GET /api/calls/:id`

### 13.4 Conversion Event API (Buyer → DCX)

* **POST `/api/conversions`**
  * Auth via per-buyer API key or OAuth client.
  * Request example:

```json
{
  "call_public_id": "call_pub_123",
  "buyer_id": "buyer_789",
  "event_type": "CASE_FILED",
  "event_time": "2025-11-26T18:20:00Z",
  "revenue_cents": 50000
}
```

  * Response example:

```json
{
  "id": "conv_001",
  "call_session_id": "call_abc",
  "status": "ACCEPTED"
}
```

### 13.5 Outbound Webhook (DCX → Integrations)

* DCX posts to configured URLs on `CALL_COMPLETED`, `CONVERSION_RECORDED`, etc.
* Example payload:

```json
{
  "event": "CALL_COMPLETED",
  "trace_id": "trace-uuid",
  "call_public_id": "call_pub_123",
  "campaign_id": "camp_123",
  "supplier_id": "sup_456",
  "buyer_id": "buyer_789",
  "status": "COMPLETED",
  "duration_seconds": 630,
  "billable_duration_seconds": 600,
  "telephony_cost_cents": 123,
  "revenue_estimated_cents": 5000,
  "occurred_at": "2025-11-26T17:05:00Z"
}
```

---

## 14. Visual Logic to Diagram

Create companion diagrams (Mermaid/Whimsical/Excalidraw) for:

1. **Inbound Call Flow:** Caller → Twilio DID → `/twilio/voice` → Routing Engine → buyer endpoint → callbacks → DB updates.
2. **Conversion Flow:** Buyer → `/api/conversions` → `ConversionEvent` insert → call update → outbound webhook → reporting.
3. **Observability Path:** Twilio webhook → `trace_id` creation → spans (`voice_webhook`, `routing_decision`, `db_write`, `outbound_webhook`).
4. **AI Enrichment Flow:** `CallSession` with `recording_url` → `call_ai_jobs` entry → async worker → transcription/sentiment/QA updates.

---

## 15. Where This Leaves Us

* Domain model is TypeScript-precise and OpenAPI-ready.
* Compliance scope (STIR/SHAKEN, A2P, recording) is explicit and testable.
* AI scaffolding exists without forcing immediate execution.
* Observability, tracing, and latency budgets are first-class.
* API surfaces are spec-first and ready for OpenAPI 3.1 emission.
