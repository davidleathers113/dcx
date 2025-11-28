# DCX vs TrackDrive: Page-by-Page Improvement Analysis

**Document Purpose**: Comprehensive comparison of DCX application against TrackDrive reference implementation, identifying specific improvements needed for each page with backend implications.

**Date**: 2025-11-28
**Status**: Analysis Complete

---

## Executive Summary

TrackDrive represents a mature call exchange platform with extensive features built over years of production use. This document identifies specific improvements DCX can implement, prioritized by business impact and technical complexity.

**Key Findings**:
- TrackDrive has ~40+ data columns per entity vs DCX's ~8-12
- Advanced filtering, sorting, and bulk operations missing in DCX
- Real-time metrics and live call monitoring significantly more sophisticated
- Export/reporting capabilities far more extensive
- Wizard-based setup flows vs manual CRUD operations

---

## 1. Dashboard / Analytics Overview

### Current State (DCX)
**Page**: `/` (Dashboard)
- **Metrics Shown**: Calls (count), Revenue, Profit, Avg Minutes
- **Widgets**: 3 main widgets (Calls In Progress, Calls By Status, Average Call Length)
- **Time Ranges**: Today, Last 24h, Last 7 Days (static dropdown)
- **Interactivity**: Minimal - no drill-down capabilities
- **Data Update**: Page refresh only

### TrackDrive Implementation
**Page**: `/dashboards/analytics/overview`
- **Top Bar Metrics**:
  - Live call count with real-time updates
  - Agent CC (concurrent calls)
  - Active CC vs cap (0 / 0)
  - Converted calls count
  - Revenue total
  - Balance pill ($0.00) - clickable to billing
- **Widgets Display**:
  - Buyers table with: Yesterday/Today/Live stats, Tier, Avg Revenue, Cap Remaining, Close time
  - Traffic Source breakdown with: Yesterday/Today/Live, Avg Revenue
  - Telephone Cost aggregate
  - Total Calls count
  - Traffic Source Conversions (attempted/converted)
  - Buyer Conversions (attempted/converted)
  - Revenue Per Call metric
  - Payout total
  - Revenue total
  - Calls By Status (with drill-down links)
  - Average Call Length
  - Ongoing Calls (real-time list)
- **Interactive Date Picker**: Calendar-based range selector (not just presets)
- **Auto-refresh**: Timestamp shows last update (e.g., "Updated: 2025-11-28 12:46:36")
- **Customization**: "Edit Board" and "Change Board Appearance" buttons

### Recommended Improvements

#### High Priority

1. **Real-Time Live Call Counter**
   - **Feature**: Top bar showing live call count updating every 1-2 seconds
   - **Backend**: WebSocket endpoint `/ws/live-metrics` pushing call state changes
   - **Database**: Query `CallSession` where `status IN ('IN_PROGRESS', 'RINGING')`
   - **Implementation**: Add Redis pub/sub for call state changes

2. **Yesterday/Today Comparison Metrics**
   - **Feature**: Show yesterday's stats alongside today for each metric
   - **Backend**: New endpoint `/api/dashboard/comparative-stats?date={today}&compare_date={yesterday}`
   - **Database**: Add indexed query on `CallSession.createdAt` with date bucketing
   - **Response Format**:
     ```json
     {
       "today": { "calls": 150, "revenue": 5000, "conversions": 45 },
       "yesterday": { "calls": 130, "revenue": 4500, "conversions": 40 },
       "delta": { "calls": "+15%", "revenue": "+11%", "conversions": "+12%" }
     }
     ```

3. **Buyer Performance Table Widget**
   - **Feature**: Table showing per-buyer metrics (Yday, Tday, Live, Tier, Avg Revenue, Cap Remaining)
   - **Backend**: `/api/dashboard/buyer-performance`
   - **Database Queries**:
     - Today's calls: `SELECT buyer_id, COUNT(*), AVG(revenue), SUM(duration) FROM call_sessions WHERE DATE(created_at) = CURDATE() GROUP BY buyer_id`
     - Yesterday's calls: Same with `DATE(created_at) = CURDATE() - 1`
     - Live calls: `SELECT buyer_id, COUNT(*) FROM call_sessions WHERE status IN ('IN_PROGRESS', 'RINGING') GROUP BY buyer_id`
     - Cap remaining: Join with `buyers.concurrency_limit` and `buyers.daily_cap`
   - **New Fields Needed in Buyer Table**:
     - `tier` (INTEGER) - routing priority tier
     - `daily_cap` (INTEGER) - max calls per day
     - `daily_cap_revenue` (INTEGER) - max revenue per day in cents

4. **Traffic Source Performance Widget**
   - **Feature**: Similar table for traffic sources showing conversion performance
   - **Backend**: `/api/dashboard/traffic-source-performance`
   - **Database**: Group `CallSession` by `traffic_source_id`, calculate conversion rates
   - **New Table**: `traffic_source_conversions` to track conversion events per source

5. **Calendar-Based Date Range Picker**
   - **Feature**: Replace preset buttons with calendar widget allowing custom date ranges
   - **Frontend**: Use date-picker component (e.g., react-day-picker)
   - **Backend**: Update all dashboard endpoints to accept `from_date` and `to_date` parameters
   - **Query Optimization**: Ensure composite index on `(created_at, status, buyer_id)`

6. **Interactive Drill-Down Links**
   - **Feature**: Click any metric to navigate to filtered view (e.g., click "Failed calls: 5" → calls page filtered to failed)
   - **Backend**: Ensure all `/api/calls` endpoints support multi-filter query params
   - **Implementation**: Add `?status=FAILED&date=2025-11-28` to call links

#### Medium Priority

7. **Auto-Refresh with Timestamp**
   - **Feature**: Dashboard auto-refreshes every 30-60 seconds, showing "Updated: {timestamp}"
   - **Frontend**: Add `setInterval` with refresh logic + timestamp display
   - **Backend**: Add `Cache-Control` headers to enable client-side caching with revalidation

8. **Concurrent Call Capacity Tracking**
   - **Feature**: Show "Active CC: 5 / 25" indicating live calls vs total capacity
   - **Backend**: Calculate `SUM(buyers.concurrency_limit)` and compare to live call count
   - **Database**: Add `concurrency_used` real-time counter per buyer

9. **Converted Calls Tracking**
   - **Feature**: Show conversion count in top bar (calls that resulted in sale/lead)
   - **Backend**: Join `CallSession` with `ConversionEvent` table
   - **Database**: Ensure `ConversionEvent.call_session_id` is indexed

#### Low Priority

10. **Board Customization UI**
    - **Feature**: "Edit Board" button allowing widget rearrangement, show/hide
    - **Backend**: New table `dashboard_layouts` storing user preferences
    - **Schema**:
      ```sql
      CREATE TABLE dashboard_layouts (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        layout_config JSONB, -- widget positions, visibility
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      );
      ```

---

## 2. Campaigns Page (DCX) vs Offers Page (TrackDrive)

### Current State (DCX)
**Page**: `/campaigns`
- **Columns Shown**: Name, Vertical, Status, Created, Actions
- **Features**: Basic table with search box, status filter dropdown
- **Actions**: View (button)
- **Summary Stats**: Active count, Inactive count, Verticals count

### TrackDrive Implementation
**Page**: `/offers`
- **Columns Shown**:
  - Actions (bulk operations menu)
  - Attributes (collapsible metadata)
  - API Keys (collapsible)
  - Created (timestamp with seconds precision)
  - Paused (status badge)
  - Name (clickable to edit)
  - ID (short identifier)
  - Leads API Key (unique key per offer)
  - Numbers API Key (unique key for number provisioning)
  - Enable Public Posting Instructions (boolean)
  - Enable Public List View (boolean)
- **Actions Dropdown Per Row**: Preview, Edit, Copy, View Details
- **Top Actions Bar**:
  - Add Offer (primary button)
  - Fulltext Search
  - Filters (advanced filter sidebar)
  - Export (CSV download)
  - Refresh
  - Reset (clear all filters)
  - Bulk CSV Upload
  - New Offer (duplicate of Add)
- **Table Features**:
  - Column show/hide selector
  - Sortable columns (click header)
  - Pagination with "1 to 3 of 3" display
  - First/Previous/Next/Last buttons
  - Custom tab saving

### Recommended Improvements

#### High Priority

1. **API Key Generation Per Campaign**
   - **Feature**: Each campaign gets unique API keys for leads and numbers APIs
   - **Backend**: Add to Campaign model:
     ```typescript
     leads_api_key: string (UUID)
     numbers_api_key: string (UUID)
     ```
   - **Endpoints**:
     - `POST /api/campaigns/:id/regenerate-keys` - rotate keys
     - `GET /api/campaigns/:id/api-docs` - show usage instructions
   - **Migration**: Generate keys for existing campaigns on first request

2. **Bulk Actions System**
   - **Feature**: Checkbox column + bulk action dropdown (Pause, Activate, Delete, Export)
   - **Backend**: `POST /api/campaigns/bulk-update`
   - **Request Format**:
     ```json
     {
       "campaign_ids": ["id1", "id2", "id3"],
       "action": "pause" | "activate" | "delete",
       "reason": "Optional audit trail"
     }
     ```
   - **Database**: Add `campaign_audit_log` table for bulk operation tracking

3. **Advanced Filter Sidebar**
   - **Feature**: Clicking "Filters" opens sidebar with:
     - Status (multi-select: Active, Inactive, Archived)
     - Vertical (multi-select from available verticals)
     - Created Date Range (from/to date pickers)
     - Has Active Buyers (boolean)
     - Revenue Range (min/max)
   - **Backend**: `/api/campaigns?filters[status]=ACTIVE,INACTIVE&filters[vertical]=MEDICARE&filters[created_from]=2025-01-01`
   - **Frontend**: URL params for shareable filtered views

4. **CSV Export Functionality**
   - **Feature**: "Export" button downloads current filtered view as CSV
   - **Backend**: `GET /api/campaigns/export.csv?trackdrive_table_id=xxx`
   - **Implementation**: Use streaming CSV generation for large datasets
   - **Format**: Include all columns + audit fields (created_at, updated_at, created_by)

5. **Copy Campaign Feature**
   - **Feature**: "Copy" action duplicates campaign with "(Copy)" suffix
   - **Backend**: `POST /api/campaigns/:id/copy`
   - **Logic**:
     - Duplicate campaign with new ID
     - Set status to INACTIVE
     - Regenerate API keys
     - Copy all relationships (buyers, numbers, schedules)
     - Append " (Copy)" to name

6. **Short ID Display**
   - **Feature**: Show human-readable short ID alongside UUID
   - **Database**: Add `short_id` VARCHAR(12) column to campaigns table
   - **Generation**: Use base62 encoding of auto-increment ID or nanoid
   - **Example**: `cmih11siv00022if1pnnpawy3` → `CM-2345`

#### Medium Priority

7. **Column Customization**
   - **Feature**: "Columns" button opens modal to show/hide columns, reorder
   - **Backend**: Store preferences in `user_table_preferences` table
   - **Schema**:
     ```sql
     CREATE TABLE user_table_preferences (
       id UUID PRIMARY KEY,
       user_id UUID REFERENCES users(id),
       table_name VARCHAR(50), -- 'campaigns', 'buyers', etc.
       visible_columns JSONB,  -- ["name", "status", "created_at"]
       column_order JSONB,     -- [0, 1, 2, 3]
       updated_at TIMESTAMP
     );
     ```

8. **Sortable Columns**
   - **Feature**: Click column header to sort ascending/descending
   - **Backend**: Add `sort_by` and `sort_order` query params to `/api/campaigns`
   - **Implementation**: `?sort_by=created_at&sort_order=desc`

9. **Timestamp Precision**
   - **Feature**: Show created timestamp with seconds (e.g., "10/16/25 01:55pm 22.898s")
   - **Frontend**: Format `createdAt` with millisecond precision
   - **Backend**: Ensure timestamps include milliseconds in JSON response

10. **Public Posting Instructions**
    - **Feature**: Toggle to enable/disable public documentation for campaign API
    - **Database**: Add `enable_public_posting` BOOLEAN to campaigns
    - **Backend**: `GET /api/campaigns/:id/public-docs` returns docs if enabled, 404 if disabled

---

## 3. Buyers Page

### Current State (DCX)
**Page**: `/buyers`
- **Columns**: Name, Endpoint Type, Endpoint Value, Status, Concurrency, Daily Cap, Weight, Actions
- **Data**: 1 buyer shown with basic info
- **Actions**: View button only

### TrackDrive Implementation
**Page**: `/buyers`
- **Columns (19 total)**:
  - Actions (bulk menu)
  - **Converted Caps** (expandable section with Monthly Used, Total Used, Total Limit)
  - **Revenue Caps** (expandable section with Daily Used, Monthly Used, Total Used, Total Limit)
  - Created (timestamp)
  - Paused (status)
  - Name (buyer display name)
  - ID (notes/identifier)
  - Number (buyer phone endpoint)
  - Notes (free-text field)
  - Tier (routing priority: -10, 0, 1, 2, etc.)
  - Weight (routing weight for round-robin)
  - Revenue (payout amount per call)
  - Maxed Out (boolean indicator if caps hit)
  - Live (current concurrent calls with link to live call list)
  - Monthly Used (call count this month)
  - Total Used (lifetime call count)
  - Total Limit (lifetime call cap)
  - Daily Used (calls today)
- **Row Actions**: Pause/Resume, Edit, Copy, Delete
- **Live Call Link**: "0 / ∞" links to `/calls?buyer_id=12897623&in_progress=true`
- **Bulk CSV Upload**: Import buyers from CSV template
- **New From Template**: Pre-populated buyer creation

### Recommended Improvements

#### High Priority

1. **Converted Caps Tracking**
   - **Feature**: Track conversions (sales/leads) per buyer with monthly/total limits
   - **Database**: Add to buyers table:
     ```sql
     converted_monthly_limit INTEGER,
     converted_total_limit INTEGER,
     converted_monthly_used INTEGER DEFAULT 0,
     converted_total_used INTEGER DEFAULT 0
     ```
   - **Backend**: Increment counters when `ConversionEvent` created
   - **Endpoint**: `GET /api/buyers/:id/conversion-stats`

2. **Revenue Caps System**
   - **Feature**: Limit buyer participation by revenue thresholds (daily, monthly, total)
   - **Database**: Add to buyers table:
     ```sql
     revenue_cap_daily_cents INTEGER,
     revenue_cap_monthly_cents INTEGER,
     revenue_cap_total_cents INTEGER,
     revenue_used_daily_cents INTEGER DEFAULT 0,
     revenue_used_monthly_cents INTEGER DEFAULT 0,
     revenue_used_total_cents INTEGER DEFAULT 0
     ```
   - **Backend**: Check caps before routing call, return "maxed_out" status
   - **Cron Job**: Reset daily/monthly counters at midnight/month-end

3. **Tier-Based Routing**
   - **Feature**: Assign priority tiers to buyers (lower number = higher priority)
   - **Database**: Add `tier INTEGER DEFAULT 0` to buyers table
   - **Backend**: Routing logic tries tier -10 first, then 0, then 1, etc.
   - **Algorithm**:
     ```typescript
     async function routeCall(campaign_id: string) {
       const tiers = await prisma.buyer.groupBy({
         by: ['tier'],
         where: { status: 'ACTIVE', campaignId: campaign_id },
         orderBy: { tier: 'asc' }
       });

       for (const tier of tiers) {
         const buyer = await selectBuyerFromTier(tier.tier, campaign_id);
         if (buyer && !buyer.maxedOut) return buyer;
       }
       throw new Error('No available buyers');
     }
     ```

4. **Live Concurrent Call Display with Drill-Down**
   - **Feature**: Show "5 / 10" linking to live calls page filtered to that buyer
   - **Backend**: Real-time query `CallSession` where `buyer_id = X AND status IN ('IN_PROGRESS', 'RINGING')`
   - **Frontend**: Link format `/calls/live?buyer_id={buyer_id}`

5. **Maxed Out Indicator**
   - **Feature**: Visual badge when buyer hits any cap (conversion, revenue, or call count)
   - **Backend**: Computed field in `/api/buyers` response:
     ```typescript
     maxed_out: boolean = (
       daily_used >= daily_limit ||
       monthly_used >= monthly_limit ||
       total_used >= total_limit ||
       revenue_used_daily >= revenue_cap_daily ||
       converted_monthly_used >= converted_monthly_limit
     )
     ```
   - **Frontend**: Red badge "MAXED OUT" with tooltip explaining which cap hit

6. **Bulk CSV Upload**
   - **Feature**: Upload CSV file to create/update multiple buyers at once
   - **Backend**: `POST /api/buyers/bulk-import` accepting multipart/form-data
   - **CSV Template**:
     ```csv
     name,endpoint_type,endpoint_value,tier,weight,revenue_cents,daily_cap,monthly_cap
     "Buyer A",PHONE_NUMBER,+15551234567,0,100,1000,50,1500
     "Buyer B",PHONE_NUMBER,+15559876543,1,50,800,25,750
     ```
   - **Validation**: Parse CSV, validate each row, return errors for invalid rows
   - **Response**: `{ created: 15, updated: 3, errors: [{ row: 5, message: "Invalid phone" }] }`

#### Medium Priority

7. **Historical Usage Tracking**
   - **Feature**: Store monthly snapshots of usage to show trends
   - **Database**: New table `buyer_usage_snapshots`
     ```sql
     CREATE TABLE buyer_usage_snapshots (
       id UUID PRIMARY KEY,
       buyer_id UUID REFERENCES buyers(id),
       snapshot_date DATE,
       calls_count INTEGER,
       conversions_count INTEGER,
       revenue_cents INTEGER,
       created_at TIMESTAMP
     );
     ```
   - **Cron Job**: Daily snapshot at midnight UTC

8. **Template-Based Buyer Creation**
   - **Feature**: "New From Template" creates buyer with pre-filled common settings
   - **Backend**: Store templates in `buyer_templates` table
   - **UI**: Modal showing template options (e.g., "Standard Medicare Buyer", "High-Volume Tier 1")

9. **Notes Field for Buyers**
   - **Database**: Add `notes TEXT` column to buyers table
   - **UI**: Expand notes on hover or click, allow inline editing

10. **Weight-Based Round Robin**
    - **Feature**: Use weight field (0-100) to distribute calls proportionally
    - **Backend**: Weighted random selection algorithm
    - **Example**: Buyer A (weight 75) gets 75% of traffic, Buyer B (weight 25) gets 25%

---

## 4. Traffic Sources Page (DCX) vs TrackDrive

### Current State (DCX)
**Page**: `/traffic-sources`
- **Columns**: Name, Channel, Supplier, Status, CPL, Calls
- **Display**: Basic table with data from `/api/traffic-sources`

### TrackDrive Implementation
**Page**: `/traffic_sources`
- **Columns**:
  - Actions (bulk operations)
  - Created (timestamp)
  - Paused (status)
  - ID (identifier)
  - Notes (memo field)
  - First Name
  - Last Name
  - Company
  - Numbers (associated phone numbers)
  - Number Limit (max numbers allowed)
  - Last Call At (timestamp of most recent call)
  - Call Count (lifetime calls from this source)
  - Recent Call Count (calls in last 30 days)
- **Features**:
  - Setup wizard ("Add Traffic Sources" button launches multi-step wizard)
  - Fulltext search across all fields
  - Advanced filters sidebar
  - CSV export
  - Bulk CSV upload

### Recommended Improvements

#### High Priority

1. **Contact Information Fields**
   - **Database**: Add to traffic_sources table:
     ```sql
     first_name VARCHAR(100),
     last_name VARCHAR(100),
     company VARCHAR(200),
     email VARCHAR(255),
     phone VARCHAR(50),
     notes TEXT
     ```
   - **Purpose**: Track publisher/partner contact info for relationship management

2. **Numbers Association & Limits**
   - **Feature**: Track which phone numbers are allocated to each traffic source
   - **Database**:
     - Add `traffic_source_id` FK to `phone_numbers` table
     - Add `number_limit INTEGER` to `traffic_sources` table
   - **Backend**: `GET /api/traffic-sources/:id/numbers` returns allocated numbers
   - **Validation**: Prevent assigning more numbers than limit allows

3. **Call Activity Tracking**
   - **Database**: Add to traffic_sources table:
     ```sql
     last_call_at TIMESTAMP,
     call_count INTEGER DEFAULT 0,
     recent_call_count INTEGER DEFAULT 0  -- last 30 days
     ```
   - **Backend**: Update via trigger or cron when calls come in
   - **Trigger**:
     ```sql
     CREATE TRIGGER update_traffic_source_stats
     AFTER INSERT ON call_sessions
     FOR EACH ROW
     BEGIN
       UPDATE traffic_sources
       SET last_call_at = NEW.created_at,
           call_count = call_count + 1
       WHERE id = NEW.traffic_source_id;
     END;
     ```

4. **Setup Wizard for Traffic Sources**
   - **Feature**: Multi-step wizard replaces basic form
   - **Steps**:
     1. Basic Info (name, company, contact)
     2. Channel Selection (web, mobile, IVR, API)
     3. Number Assignment (select from available pool)
     4. Caps & Limits (daily cap, number limit)
     5. Review & Submit
   - **Backend**: Same `/api/traffic-sources` endpoint, wizard just provides better UX
   - **State Management**: Store wizard progress in session/localStorage

5. **Recent Call Count Metric**
   - **Feature**: Show activity in last 30 days to identify inactive sources
   - **Backend**: Nightly cron job:
     ```sql
     UPDATE traffic_sources ts
     SET recent_call_count = (
       SELECT COUNT(*)
       FROM call_sessions cs
       WHERE cs.traffic_source_id = ts.id
         AND cs.created_at >= NOW() - INTERVAL '30 days'
     );
     ```

#### Medium Priority

6. **Traffic Source ID Display**
   - **Database**: Add `short_id VARCHAR(12)` for human-readable IDs
   - **Example**: "TS-1234" instead of UUID

7. **Paused Status Management**
   - **Feature**: Quick pause/resume toggle without going into edit mode
   - **Backend**: `PATCH /api/traffic-sources/:id/toggle-status`
   - **Response**: Returns updated status immediately

8. **Number Pool Management UI**
   - **Feature**: Dedicated page `/traffic-sources/:id/numbers` to manage number assignments
   - **Actions**: Add numbers, remove numbers, view usage per number
   - **Backend**: Existing ring pool functionality extended

---

## 5. Calls / Call Logs Page

### Current State (DCX)
**Page**: `/calls`
- **Columns**: Basic call session data (from CallSession model)
- **Features**: Table with pagination

### TrackDrive Implementation
**Pages**:
- `/calls` - Main call logs with extensive filtering
- `/calls/live_calls` - Real-time active calls monitor
- `/calls/voicemail` - Voicemail inbox
- `/scheduled_callbacks` - Callback queue management
- `/uncompleted_calls` - Failed/abandoned calls analysis
- `/calls/report_grid` - Summary reports with aggregations
- `/companies/caller_id_lookup` - Reverse phone lookup

**Call Logs Features**:
- **Filters**: Date range, buyer, traffic source, status, duration, recording availability
- **Columns**: Timestamp, caller ID, buyer, traffic source, duration, status, recording playback, revenue, cost
- **Actions**: Play recording, download, add to callback queue, view full details
- **Export**: One-time exports, recurring scheduled reports

### Recommended Improvements

#### High Priority

1. **Live Calls Monitor Page**
   - **Feature**: Real-time dashboard showing active calls with ability to barge-in, whisper, or disconnect
   - **Page**: `/calls/live`
   - **Backend**: WebSocket endpoint `/ws/live-calls` pushing call updates
   - **Data Shown**:
     - Caller phone number
     - Buyer handling call
     - Call duration (live updating)
     - Campaign/traffic source
     - Call status (ringing, in-progress, on-hold)
   - **Actions**: Listen (join call as silent monitor), Whisper (talk to agent only), Barge (join 3-way)
   - **Implementation**: Integrate with Twilio Conference API for call control

2. **Voicemail Management System**
   - **Feature**: Dedicated page for managing voicemails left by callers
   - **Page**: `/calls/voicemail`
   - **Database**: Extend `voicemail` table with:
     ```sql
     assigned_to UUID REFERENCES users(id),
     priority VARCHAR(20) DEFAULT 'normal',
     callback_scheduled_at TIMESTAMP,
     notes TEXT,
     transcription TEXT
     ```
   - **Backend**:
     - `GET /api/calls/voicemails` - list all voicemails
     - `PATCH /api/calls/voicemails/:id/assign` - assign to team member
     - `POST /api/calls/voicemails/:id/schedule-callback` - create callback task
   - **Features**: Play audio, read AI transcription, assign to agent, mark complete

3. **Scheduled Callbacks System**
   - **Feature**: Queue system for callbacks with priority, due dates, and assignments
   - **Page**: `/calls/callbacks`
   - **Database**: Extend `callback_request` table with:
     ```sql
     due_at TIMESTAMP NOT NULL,
     priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
     assigned_to UUID REFERENCES users(id),
     status VARCHAR(20) DEFAULT 'pending',  -- pending, in-progress, completed, cancelled
     notes TEXT,
     created_by UUID REFERENCES users(id),
     completed_at TIMESTAMP,
     outcome TEXT
     ```
   - **Backend**:
     - `GET /api/calls/callbacks?status=pending&overdue=true` - fetch queue
     - `POST /api/calls/callbacks` - create new callback
     - `PATCH /api/calls/callbacks/:id/complete` - mark done with outcome
   - **Notifications**: Email/SMS reminder 30min before due time

4. **Uncompleted Calls Analysis**
   - **Feature**: Dedicated view for failed, abandoned, or no-answer calls
   - **Page**: `/calls/uncompleted`
   - **Backend**: `GET /api/calls?status=FAILED,NO_ANSWER,BUSY&completed=false`
   - **Columns**:
     - Timestamp
     - Caller ID
     - Traffic source
     - Failure reason (no buyers available, all maxed out, caller hung up)
     - Duration before failure
     - Recovery actions (add to callback queue, block number, retry)
   - **Purpose**: Identify patterns in failed calls to improve routing

5. **Call Summary Reports**
   - **Feature**: Aggregated reporting with grouping and pivots
   - **Page**: `/calls/report`
   - **Backend**: `GET /api/calls/report?group_by=buyer&date_range=last_7_days`
   - **Aggregations**:
     - Total calls by buyer/campaign/source
     - Average duration
     - Total revenue
     - Total cost
     - Conversion rate
   - **Export**: CSV/Excel with charts

6. **Caller ID Lookup**
   - **Feature**: Reverse phone number lookup to identify caller
   - **Page**: `/calls/caller-id-lookup`
   - **Backend**: `GET /api/calls/lookup?phone=+15551234567`
   - **Data Sources**:
     - Internal: Search `CallSession` history for this number
     - External: Integrate with Twilio Lookup API for carrier/caller name
     - Lead DB: Check if number exists in leads table
   - **Response**:
     ```json
     {
       "phone": "+15551234567",
       "name": "John Doe",
       "call_history_count": 5,
       "last_call": "2025-11-15T10:30:00Z",
       "carrier": "AT&T Wireless",
       "is_mobile": true,
       "is_blocked": false
     }
     ```

7. **Recording Playback & Download**
   - **Feature**: Inline audio player in call row + download button
   - **Backend**:
     - `GET /api/calls/:id/recording-url` - returns pre-signed S3 URL
     - Stream audio via CloudFront with token authentication
   - **Database**: Ensure `recording_url` field in `call_sessions` table
   - **Player**: HTML5 audio player with waveform visualization

#### Medium Priority

8. **Recurring Export Reports**
   - **Feature**: Schedule daily/weekly/monthly CSV exports emailed to stakeholders
   - **Database**: New table `scheduled_reports`
     ```sql
     CREATE TABLE scheduled_reports (
       id UUID PRIMARY KEY,
       name VARCHAR(255),
       frequency VARCHAR(20), -- daily, weekly, monthly
       filter_config JSONB,   -- same filters as /api/calls
       recipients TEXT[],     -- email addresses
       format VARCHAR(10),    -- csv, excel, pdf
       next_run_at TIMESTAMP,
       created_by UUID REFERENCES users(id)
     );
     ```
   - **Backend**: Cron job checks `next_run_at`, generates report, sends email, updates `next_run_at`

9. **Advanced Call Filters**
   - **Feature**: Filter sidebar with 15+ filter options
   - **Filters**:
     - Date range (from/to)
     - Time of day range (e.g., 9am-5pm)
     - Buyer (multi-select)
     - Traffic source (multi-select)
     - Campaign (multi-select)
     - Status (multi-select)
     - Duration range (min/max seconds)
     - Revenue range (min/max)
     - Has recording (boolean)
     - Has conversion (boolean)
     - Caller state/city (geo filter)
   - **Backend**: Build dynamic SQL WHERE clause from filter object

10. **Call Tags System**
    - **Feature**: Add custom tags to calls for organization (e.g., "quality-issue", "follow-up", "vip")
    - **Database**: Many-to-many relationship
      ```sql
      CREATE TABLE call_tags (
        id UUID PRIMARY KEY,
        name VARCHAR(50) UNIQUE,
        color VARCHAR(7), -- hex color
        created_at TIMESTAMP
      );

      CREATE TABLE call_session_tags (
        call_session_id UUID REFERENCES call_sessions(id),
        tag_id UUID REFERENCES call_tags(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP,
        PRIMARY KEY (call_session_id, tag_id)
      );
      ```
    - **Backend**:
      - `POST /api/calls/:id/tags` - add tag
      - `DELETE /api/calls/:id/tags/:tag_id` - remove tag
      - `GET /api/calls?tags=quality-issue,follow-up` - filter by tags

---

## 6. Settings / Company Pages

### Current State (DCX)
**Pages**:
- `/settings` - Basic API config display (Twilio, webhooks)
- `/settings/security` - Security posture view
- `/settings/preferences` - User preferences

### TrackDrive Implementation
**Pages**:
- `/settings/preferences` - Company-wide settings
- User profile management
- Team member invitations
- Role-based permissions
- Notification preferences
- Billing settings
- API key management

### Recommended Improvements

#### High Priority

1. **Role-Based Access Control (RBAC)**
   - **Feature**: Define roles (Admin, Manager, Agent, Viewer) with granular permissions
   - **Database**: New tables
     ```sql
     CREATE TABLE roles (
       id UUID PRIMARY KEY,
       name VARCHAR(50) UNIQUE,
       permissions JSONB, -- { "campaigns.read": true, "campaigns.write": false }
       created_at TIMESTAMP
     );

     CREATE TABLE user_roles (
       user_id UUID REFERENCES users(id),
       role_id UUID REFERENCES roles(id),
       PRIMARY KEY (user_id, role_id)
     );
     ```
   - **Backend**: Middleware checking permissions before allowing operations
   - **Permissions**:
     - `campaigns.*` - Campaign CRUD
     - `buyers.*` - Buyer CRUD
     - `calls.view` - View call logs
     - `calls.recording.listen` - Play recordings
     - `billing.view` - View billing info
     - `settings.manage` - Change company settings

2. **Team Member Invitation System**
   - **Feature**: Invite users via email, set initial role, track invitation status
   - **Backend**:
     - `POST /api/team-members/invite` - send invitation email
     - `GET /api/invitations/:token/accept` - accept invitation
   - **Database**: New table `invitations`
     ```sql
     CREATE TABLE invitations (
       id UUID PRIMARY KEY,
       email VARCHAR(255),
       role_id UUID REFERENCES roles(id),
       token VARCHAR(64) UNIQUE,
       invited_by UUID REFERENCES users(id),
       status VARCHAR(20), -- pending, accepted, expired
       expires_at TIMESTAMP,
       created_at TIMESTAMP
     );
     ```

3. **Notification Preferences**
   - **Feature**: Configure which events trigger email/SMS/Slack notifications
   - **Database**: New table `notification_preferences`
     ```sql
     CREATE TABLE notification_preferences (
       user_id UUID PRIMARY KEY REFERENCES users(id),
       email_enabled BOOLEAN DEFAULT true,
       sms_enabled BOOLEAN DEFAULT false,
       slack_enabled BOOLEAN DEFAULT false,
       notify_call_maxed_out BOOLEAN DEFAULT true,
       notify_buyer_offline BOOLEAN DEFAULT true,
       notify_daily_summary BOOLEAN DEFAULT true,
       notify_conversion BOOLEAN DEFAULT false,
       created_at TIMESTAMP,
       updated_at TIMESTAMP
     );
     ```
   - **Backend**: `PATCH /api/users/:id/notification-preferences`

4. **API Key Management Page**
   - **Feature**: View, create, revoke, and rotate API keys for integrations
   - **Page**: `/settings/api-keys`
   - **Backend**:
     - `POST /api/api-keys` - generate new key
     - `DELETE /api/api-keys/:id` - revoke key
     - `POST /api/api-keys/:id/rotate` - rotate secret
   - **Database**: Extend `admin_api_key` table with:
     ```sql
     last_used_ip VARCHAR(45),
     rate_limit_per_minute INTEGER DEFAULT 60,
     allowed_ip_ranges TEXT[],
     webhook_url VARCHAR(255) -- for webhook deliveries
     ```
   - **Security**: Show key secret only once on creation, then mask

#### Medium Priority

5. **Audit Log Viewer**
   - **Feature**: View all actions taken by users (who did what when)
   - **Page**: `/settings/audit-logs`
   - **Database**: Table already exists (`system_log`), extend with:
     ```sql
     user_id UUID REFERENCES users(id),
     action VARCHAR(100),  -- 'campaign.created', 'buyer.paused'
     resource_type VARCHAR(50),
     resource_id UUID,
     changes JSONB,  -- before/after values
     ip_address VARCHAR(45)
     ```
   - **Backend**: `GET /api/audit-logs?user_id=X&action=campaign.created&from=2025-01-01`

6. **Company Branding**
   - **Feature**: Upload logo, set primary color, customize email templates
   - **Database**: New table `company_branding`
     ```sql
     CREATE TABLE company_branding (
       id UUID PRIMARY KEY,
       logo_url VARCHAR(255),
       primary_color VARCHAR(7),
       secondary_color VARCHAR(7),
       email_header_html TEXT,
       email_footer_html TEXT,
       created_at TIMESTAMP,
       updated_at TIMESTAMP
     );
     ```

7. **Timezone & Locale Settings**
   - **Feature**: Set company timezone, date format, currency format
   - **Database**: Add to `company` table:
     ```sql
     timezone VARCHAR(50) DEFAULT 'America/New_York',
     date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
     currency VARCHAR(3) DEFAULT 'USD',
     locale VARCHAR(10) DEFAULT 'en-US'
     ```

---

## 7. Missing Pages in DCX (Present in TrackDrive)

### 1. **Agents & Softphones**
**TrackDrive Page**: `/agents`

**Purpose**: Manage internal call center agents with softphone credentials

**Features**:
- Agent roster with login credentials
- Softphone provisioning (SIP credentials)
- Agent status tracking (online, offline, on-call)
- Call assignment rules
- Performance metrics per agent

**Backend Requirements**:
- New table `agents`
  ```sql
  CREATE TABLE agents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    sip_username VARCHAR(100),
    sip_password VARCHAR(100),
    extension VARCHAR(20),
    status VARCHAR(20), -- online, offline, on-call, away
    max_concurrent_calls INTEGER DEFAULT 1,
    skills JSONB, -- ["medicare", "final_expense"]
    created_at TIMESTAMP
  );
  ```
- Integration with Twilio Client for browser-based calling

### 2. **Agent / Buyer Groups**
**TrackDrive Page**: `/buyer_groups`

**Purpose**: Create groups of buyers/agents for batch operations and round-robin routing

**Features**:
- Group creation with member selection
- Group-level settings (shared daily cap, priority)
- Route calls to group instead of individual buyer
- Group performance reporting

**Backend Requirements**:
- New tables:
  ```sql
  CREATE TABLE buyer_groups (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    routing_strategy VARCHAR(50), -- round_robin, priority, weighted
    daily_cap INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP
  );

  CREATE TABLE buyer_group_members (
    group_id UUID REFERENCES buyer_groups(id),
    buyer_id UUID REFERENCES buyers(id),
    weight INTEGER DEFAULT 100,
    priority INTEGER DEFAULT 0,
    PRIMARY KEY (group_id, buyer_id)
  );
  ```

### 3. **Schedules Management**
**TrackDrive Page**: `/schedules`

**Purpose**: Define operating hours, buyer availability schedules, holiday blackouts

**Features**:
- Weekly schedule templates (Mon-Fri 9am-5pm)
- Holiday calendar
- Buyer-specific schedules
- Timezone handling
- Exception dates (special hours)

**Backend Requirements**:
- Enhance `schedule_rule` table with:
  ```sql
  schedule_type VARCHAR(50), -- weekly, holiday, exception
  recurrence_rule TEXT, -- iCal RRULE format
  exceptions JSONB -- [{ "date": "2025-12-25", "closed": true }]
  ```

### 4. **Power Dialer**
**TrackDrive Page**: `/power_dialer`

**Purpose**: Outbound calling campaign management with progressive/predictive dialing

**Features**:
- Upload lead lists
- Dialing modes (preview, progressive, predictive)
- Agent pacing (calls per agent per hour)
- Call disposition tracking
- Voicemail drop automation

**Backend Requirements**:
- New tables:
  ```sql
  CREATE TABLE dialer_campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    dialing_mode VARCHAR(50),
    calls_per_agent_per_hour INTEGER,
    voicemail_drop_enabled BOOLEAN,
    voicemail_audio_url VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP
  );

  CREATE TABLE dialer_leads (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES dialer_campaigns(id),
    phone_number VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    custom_fields JSONB,
    status VARCHAR(50), -- new, dialing, contacted, no_answer, voicemail
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    disposition VARCHAR(50), -- connected, not_interested, callback, dnc
    created_at TIMESTAMP
  );
  ```

### 5. **Traffic Source Caps**
**TrackDrive Page**: `/traffic_source_caps`

**Purpose**: Manage call volume limits per traffic source (daily/monthly)

**Features**:
- Set per-source caps
- Cap tracking dashboard
- Alerts when approaching limit
- Auto-pause source when cap hit

**Backend Requirements**:
- Add to `traffic_sources` table:
  ```sql
  daily_call_cap INTEGER,
  monthly_call_cap INTEGER,
  daily_calls_used INTEGER DEFAULT 0,
  monthly_calls_used INTEGER DEFAULT 0,
  auto_pause_on_cap BOOLEAN DEFAULT true
  ```
- Cron job to reset counters

### 6. **State Rules**
**TrackDrive Page**: `/state_rule_groups`

**Purpose**: Compliance rules per US state (TCPA, DNC, specific regulations)

**Features**:
- Define state-specific routing rules
- Block certain states for certain buyers
- State-based consent requirements
- Compliance alert system

**Backend Requirements**:
- New table `state_rules`
  ```sql
  CREATE TABLE state_rules (
    id UUID PRIMARY KEY,
    state_code VARCHAR(2),
    buyer_id UUID REFERENCES buyers(id),
    action VARCHAR(20), -- allow, block, require_consent
    consent_type VARCHAR(50), -- verbal, written, none
    notes TEXT,
    created_at TIMESTAMP
  );
  ```

### 7. **Recording Retention Policies**
**TrackDrive Page**: `/call_recording_rules`

**Purpose**: Automated recording deletion based on age, compliance requirements

**Features**:
- Set retention period (30, 60, 90 days, forever)
- Compliance-based retention (keep if disputed)
- Selective recording (record only certain campaigns)
- Bulk deletion tools

**Backend Requirements**:
- New table `recording_retention_rules`
  ```sql
  CREATE TABLE recording_retention_rules (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    retention_days INTEGER,
    always_record BOOLEAN DEFAULT true,
    exceptions JSONB, -- { "disputed": "forever", "converted": 180 }
    created_at TIMESTAMP
  );
  ```
- Cron job to delete old recordings matching rules

### 8. **Suppression Lists**
**TrackDrive Page**: `/buyer_suppressions`

**Purpose**: DNC (Do Not Call) lists per buyer, global blocklist

**Features**:
- Upload CSV of numbers to suppress
- Per-buyer suppression lists
- Global company suppression list
- Import from external DNC registries
- Search interface

**Backend Requirements**:
- New table `suppression_lists`
  ```sql
  CREATE TABLE suppression_lists (
    id UUID PRIMARY KEY,
    buyer_id UUID REFERENCES buyers(id), -- NULL for global list
    phone_number VARCHAR(50),
    reason VARCHAR(255),
    added_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    INDEX idx_phone (phone_number)
  );
  ```
- Pre-routing check: reject call if phone in suppression list

### 9. **Blacklist Management**
**TrackDrive Page**: `/contacts/` (Blacklist)

**Purpose**: Block specific callers from all campaigns

**Features**:
- Add phone numbers to blacklist
- Reason codes (spam, abuse, fraud)
- Automatic detection (high frequency calling)
- Whitelist exceptions

**Backend Requirements**:
- Extend `suppression_lists` table with `list_type` enum:
  - `buyer_suppression` - per-buyer DNC
  - `global_suppression` - company-wide DNC
  - `blacklist` - blocked numbers
  - `whitelist` - always allow

---

## 8. Premium Services (TrackDrive-Only Features)

### Features Identified
1. **AI Call Analytics** - Transcription, sentiment analysis, keyword spotting
2. **Advanced IVR Builder** - Visual IVR flow designer
3. **CRM Integrations** - Salesforce, HubSpot, Zoho sync
4. **White Label Portals** - Client-facing branded dashboards

### Implementation Priority
**Recommendation**: Focus on core functionality first. These "Premium Services" can be deferred to Phase 2 or offered as paid add-ons.

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Achieve feature parity with TrackDrive core functionality

**Backend Tasks**:
1. Extend database schema (add 50+ missing columns across tables)
2. Implement caps tracking system (conversions, revenue, calls)
3. Add tier-based routing algorithm
4. Build WebSocket infrastructure for real-time updates
5. Create bulk operation endpoints (pause/activate/delete)

**Frontend Tasks**:
1. Implement advanced filter sidebars
2. Add bulk action UI components
3. Build CSV export functionality
4. Create column customization system
5. Add real-time metric displays

**Estimate**: 160 hours backend + 120 hours frontend = **280 hours total**

### Phase 2: Enhanced Operations (Weeks 5-8)
**Goal**: Add operational efficiency features

**Backend Tasks**:
1. Scheduled callbacks system
2. Voicemail management
3. Live call monitoring WebSockets
4. Uncompleted calls analysis
5. Recurring report scheduler

**Frontend Tasks**:
1. Live calls dashboard page
2. Voicemail inbox UI
3. Callback queue management
4. Setup wizards for traffic sources/buyers
5. Calendar date range picker

**Estimate**: 120 hours backend + 100 hours frontend = **220 hours total**

### Phase 3: Advanced Features (Weeks 9-12)
**Goal**: Differentiation and premium features

**Backend Tasks**:
1. Agent management system
2. Buyer groups
3. State rules compliance
4. Recording retention automation
5. Suppression lists + blacklist

**Frontend Tasks**:
1. Agent dashboard
2. Group management UI
3. Compliance rules builder
4. Suppression list manager
5. Advanced reporting

**Estimate**: 140 hours backend + 100 hours frontend = **240 hours total**

### Phase 4: Premium Services (Weeks 13-16)
**Goal**: Revenue-generating add-ons

**Backend Tasks**:
1. AI transcription integration
2. CRM webhook system
3. White label API
4. Power dialer engine

**Frontend Tasks**:
1. AI analytics dashboard
2. CRM sync UI
3. White label builder
4. Power dialer interface

**Estimate**: 160 hours backend + 120 hours frontend = **280 hours total**

---

## Total Effort Estimate

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| Phase 1 | 160h | 120h | 280h |
| Phase 2 | 120h | 100h | 220h |
| Phase 3 | 140h | 100h | 240h |
| Phase 4 | 160h | 120h | 280h |
| **TOTAL** | **580h** | **440h** | **1020h** |

**At 40 hours/week**: ~25 weeks (~6 months) for full feature parity + premium services

**At 60 hours/week** (with team of 2-3): ~17 weeks (~4 months)

---

## Priority Matrix

### Must Have (Phase 1)
- Real-time live call counter
- Tier-based routing
- Caps tracking (conversion, revenue, call)
- Bulk operations
- CSV export
- Advanced filters
- API key per campaign

### Should Have (Phase 2)
- Live calls dashboard
- Voicemail management
- Scheduled callbacks
- Setup wizards
- Uncompleted calls analysis
- Recording playback

### Nice to Have (Phase 3)
- Agent management
- Buyer groups
- State rules
- Suppression lists
- Caller ID lookup

### Future / Premium (Phase 4)
- AI transcription
- Power dialer
- CRM integrations
- White label

---

## Conclusion

TrackDrive's maturity shows in its operational depth: 19 columns on buyers vs our 8, sophisticated caps system, real-time monitoring, bulk operations, and compliance tooling. The biggest gaps are:

1. **Caps & Limits System** (high complexity, high value)
2. **Real-Time Monitoring** (medium complexity, high value)
3. **Bulk Operations & Exports** (low complexity, high value)
4. **Setup Wizards** (medium complexity, medium value)
5. **Compliance Tools** (high complexity, variable value based on industry)

**Recommendation**: Focus on Phase 1 items first (especially caps system and real-time metrics) as these provide immediate ROI and competitive differentiation. Phase 2 and 3 can be implemented based on customer feedback and usage patterns.
