# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCX (Dependable Call Exchange) is a full-stack call routing platform built as a monorepo with three packages:
- `/backend`: Node.js + Express + TypeScript + Prisma (PostgreSQL)
- `/frontend`: Next.js 16 + Shadcn UI + TanStack Table
- `/openapi`: OpenAPI 3.1 specification defining the contract between frontend and backend

## Development Commands

### Backend (`/backend`)
```bash
# Development
npm run dev                  # Start dev server with nodemon + ts-node
npm start                    # Start production server (requires npm run build first)
npm run build                # Compile TypeScript to /dist

# Database
npx prisma migrate dev       # Apply migrations
npx prisma db seed           # Seed database with test data
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma studio            # Open Prisma Studio GUI

# Type Generation
npm run openapi:types        # Generate TypeScript types from ../openapi/dcx.yaml
```

### Frontend (`/frontend`)
```bash
# Development
npm run dev                  # Start Next.js dev server (port 3000)
npm start                    # Start production server (requires npm run build first)
npm run build                # Build for production
npm run lint                 # Run ESLint

# Type Generation
npm run openapi:types        # Generate TypeScript types from ../openapi/dcx.yaml
```

**IMPORTANT**: After modifying `/openapi/dcx.yaml`, regenerate types in BOTH backend and frontend by running `npm run openapi:types` in each directory.

## Architecture

### Backend Module Structure

All API routes are organized as self-contained Express routers in `/backend/src/modules/*`:

```
src/
├── server.ts              # Main Express app, middleware, router registration
├── config/
│   └── env.ts            # Environment validation (DATABASE_URL, ADMIN_API_KEY, etc.)
├── middleware/
│   └── auth.ts           # adminAuth() bearer token middleware
└── modules/
    ├── telephony/        # /twilio/* - Twilio webhooks (public, signature-validated)
    ├── routing/          # /internal/* - Internal routing logic
    ├── campaigns/        # /api/campaigns
    ├── buyers/           # /api/buyers
    ├── suppliers/        # /api/suppliers
    ├── numbers/          # /api/numbers
    ├── performance/      # /api/performance/*
    ├── ops/             # /api/alerts, /api/notices, /api/webhook-logs, etc.
    ├── billing/         # /api/billing/*
    ├── leads/           # /api/leads/*
    ├── sms/             # /api/sms/*
    ├── callops/         # /api/calls/* (call logs, recordings)
    ├── ringpools/       # /api/ring-pools
    ├── schedules/       # /api/schedules
    ├── traffic/         # /api/traffic-sources
    ├── settings/        # /api/settings/*
    ├── reporting/       # /api/calls, /api/numbers (reporting views)
    ├── conversion/      # /api/conversions
    └── admin/           # Additional admin routes
```

**Router Pattern**: Each module exports a router (e.g., `campaignsRouter`) registered in `server.ts` under `/api`. All `/api/*` routes require `adminAuth` middleware (Bearer token from `ADMIN_API_KEY` env var).

### Frontend Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── page.tsx            # Dashboard home (dynamic rendering)
│   ├── layout.tsx          # Root layout with sidebar + top bar
│   ├── campaigns/
│   ├── buyers/
│   ├── suppliers/
│   └── [30+ admin routes]  # All dashboard pages
├── components/
│   ├── ui/                 # Shadcn UI primitives
│   ├── layout/
│   │   ├── sidebar.tsx     # Main navigation sidebar
│   │   ├── top-bar.tsx     # Top bar with balance pill
│   │   └── navigation.ts   # Centralized nav structure
│   ├── dashboard/          # Dashboard widgets, stat cards, charts
│   └── [feature-specific]  # campaigns/, buyers/, etc.
├── lib/
│   ├── api.ts              # Typed API client (openapi-fetch)
│   ├── utils.ts            # cn() utility, shared helpers
│   └── hooks/              # usePaginatedResource, useDashboardStats
└── types/
    └── api.d.ts            # Generated from openapi/dcx.yaml
```

**API Client**: `apiClient` from `lib/api.ts` is a type-safe wrapper around `openapi-fetch` that auto-includes the `Authorization: Bearer` header from `NEXT_PUBLIC_ADMIN_API_KEY`.

### Database Schema

Prisma schema lives in `/backend/prisma/schema.prisma`. Key models:
- `Supplier`, `Buyer`, `Campaign`, `Offer` - core business entities
- `CallSession`, `CallLeg`, `RoutingException` - call telemetry
- `ConversionEvent` - buyer postback events
- `Alert`, `Notice`, `WebhookLog`, `SystemLog` - observability
- `BillingStatement`, `Payment`, `InvoiceLineItem` - financial data
- `Team`, `TeamMember`, `SecretItem` - ops/security metadata

Run `npx prisma migrate dev` to apply schema changes, then `npx prisma generate` to regenerate the client.

## Environment Variables

### Backend (`.env`)
```bash
DATABASE_URL="postgresql://..."       # Required: PostgreSQL connection string
ADMIN_API_KEY="your_secret_key"       # Required: Bearer token for /api/* routes
TWILIO_AUTH_TOKEN="..."               # Required: For webhook signature validation
PORT=4000                             # Optional: defaults to 4000
NODE_ENV=development                  # Optional: development|test|production
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"  # Backend URL
NEXT_PUBLIC_ADMIN_API_KEY="your_secret_key"       # Same as backend ADMIN_API_KEY
```

**CRITICAL**: `env.ts` throws on startup if required variables are missing. Never commit `.env` files.

## Common Workflows

### Adding a New API Endpoint
1. Define the route in `/openapi/dcx.yaml`
2. Run `npm run openapi:types` in both `/backend` and `/frontend`
3. Create or modify a controller in `/backend/src/modules/[module]/[module].controller.ts`
4. Register the router in `/backend/src/server.ts` (if new module)
5. Use `apiClient` in frontend components to call the endpoint

### Adding a New Database Table
1. Modify `/backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name` to create migration
3. Run `npx prisma generate` to update Prisma client types
4. Update seed file (`prisma/seed.ts`) if needed for test data

### Adding a New Frontend Page
1. Create route directory in `/frontend/src/app/[route-name]/`
2. Add `page.tsx` (export `dynamic = 'force-dynamic'` if fetching from backend at build time causes issues)
3. Update navigation in `/frontend/src/components/layout/navigation.ts`
4. Create reusable components in `/frontend/src/components/[feature]/`

## Type Safety & Code Generation

- **DO** regenerate OpenAPI types after schema changes: `npm run openapi:types` in both packages
- **DO** use `apiClient` from `lib/api.ts` for all backend calls - it provides full TypeScript autocomplete
- **DO** use Prisma client for all database access - it's fully type-safe
- **DON'T** bypass the generated types with `any` casts

## Testing & Smoke Tests

Backend smoke tests (Day 1 runbook) are documented in `/backend/README.md`. Use these cURL commands to verify:
- Campaign creation (`POST /api/campaigns`)
- Call logs (`GET /api/calls`)
- Twilio webhook (`POST /twilio/voice`)
- Conversion posting (`POST /api/conversions`)

All authenticated endpoints require `Authorization: Bearer <ADMIN_API_KEY>` header.

## Build Notes

### Frontend Build Issues
Dashboard routes export `dynamic = 'force-dynamic'` to skip SSG prerendering. This prevents build failures when the backend is offline. If you need SSG, remove this flag and ensure a stable backend or mock API is reachable during `npm run build`.

### Development Dependencies
- Backend requires PostgreSQL running and accessible via `DATABASE_URL`
- Frontend requires backend running at `NEXT_PUBLIC_API_BASE_URL`
- Seed data is automatically created via `npx prisma db seed`

## Key Files to Check First
- `/backend/src/server.ts` - Router registration and middleware order
- `/backend/src/config/env.ts` - Environment variable validation
- `/backend/prisma/schema.prisma` - Database schema
- `/openapi/dcx.yaml` - API contract
- `/frontend/src/lib/api.ts` - API client setup
- `/frontend/src/components/layout/navigation.ts` - Page routing structure
