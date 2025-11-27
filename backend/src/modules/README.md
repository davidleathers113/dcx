# Backend Modules

This directory contains the feature-based modules for the DCX backend. Each module is responsible for a distinct domain of the application.

## Architecture

The API is organized by feature, with each module typically containing:

-   `*.controller.ts`: The Express router and handler functions for the module's HTTP endpoints. This layer is responsible for request/response handling and validation.
-   `*.service.ts`: The core business logic for the module. Services are called by controllers and are responsible for interacting with the database (via Prisma) and other services.
-   `*.types.ts` (if needed): TypeScript types and interfaces specific to that module.

## Modules

-   **/admin**: Handles the creation, updating, and listing of core configuration entities like Campaigns, Buyers, and Offers.
-   **/conversion**: Handles the ingestion of offline conversion events from buyers.
-   **/reporting**: Provides endpoints for viewing runtime data, such as call logs and phone number inventory.
-   **/routing**: Contains the internal logic for making real-time call routing decisions.
-   **/telephony**: The public-facing module that handles incoming webhooks from Twilio.
