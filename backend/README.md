# DCX Backend

This directory contains the Node.js, Express, and Prisma backend for the Dependable Call Exchange.

## 1. Setup

### Prerequisites

-   Node.js (v18 or later)
-   npm
-   A running PostgreSQL database

### Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy the `.env.example` file to `.env` and fill in the required values:
    ```bash
    cp .env.example .env
    ```
    You will need to provide:
    -   `DATABASE_URL`: Your PostgreSQL connection string.
    -   `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token for webhook signature validation.
    -   `ADMIN_API_KEY`: A secure, secret key for authenticating to the admin API.

4.  **Run Database Migrations:**
    Apply the Prisma schema to your database.
    ```bash
    npx prisma migrate dev
    ```

5.  **Seed the Database:**
    Populate the database with initial test data (1 Supplier, 1 Campaign, etc.).
    ```bash
    npx prisma db seed
    ```

## 2. Running the Server

To start the backend server, run:

```bash
npm start
```

The server will start on the port specified in your `.env` file (defaults to `4000`).

## 3. Smoke Tests (Day 1 Runbook)

These cURL commands allow you to verify that all major components of the API are working correctly. Make sure to replace "your_admin_api_key" with the `ADMIN_API_KEY` you set in your `.env` file.

### A. Create a Campaign (Admin API)

```bash
curl -X POST http://localhost:4000/api/campaigns \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_admin_api_key" \
-d 
'{' \
  "name": "National Lead Gen Campaign", \
  "vertical": "Insurance" \
}'
```
> **Expected:** A `201 Created` response with the new campaign object.

### B. Check the Call Logs (Reporting API)

```bash
curl http://localhost:4000/api/calls \
-H "Authorization: Bearer your_admin_api_key"
```
> **Expected:** A `200 OK` response with a `{ "data": [], "meta": { ... } }` payload (since no calls have been made yet).

### C. Simulate an Inbound Call (Telephony Webhook)

This simulates Twilio sending a webhook to your server.

```bash
curl -X POST http://localhost:4000/twilio/voice \
-H "Content-Type: application/x-www-form-urlencoded" \
-d 'CallSid=CA123&From=+15551234567&To=+15557654321&CallStatus=ringing'
```
> **Expected:** A `200 OK` response with TwiML XML, likely containing a `<Say>` verb with "Sorry, no routes are available" since the seed data might not produce a perfect match. This still proves the endpoint is working.

### D. Post a Conversion (Conversion API)

This simulates a buyer posting back a conversion event for a call. (Note: You would need a valid `call_public_id` and `buyer_id` from a real call).

```bash
curl -X POST http://localhost:4000/api/conversions \
-H "Content-Type: application/json" \
-H "X-API-Key: a_valid_buyer_api_key" \
-d 
'{' \
  "call_public_id": "some_public_id_from_a_call", \
  "buyer_id": "a_buyer_id_from_the_call", \
  "event_type": "SALE_CONFIRMED", \
  "event_time": "2025-11-26T12:00:00Z", \
  "revenue_cents": 5000 \
}'
```
> **Expected:** A `404 Not Found` if the `call_public_id` is fake, which is the correct behavior. This proves the endpoint and its security scheme are active.