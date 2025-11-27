# OpenAPI Specification

This directory contains the shared OpenAPI 3.1 specification for the Dependable Call Exchange (DCX) project.

## `dcx.yaml`

This file is the **single source of truth** for the API contract between the backend and the frontend.

### Backend Usage

The backend uses this file to:
- Guide API implementation.
- Ensure endpoint logic matches the defined contract.

### Frontend Usage

The frontend uses this file to:
- Generate a type-safe API client using `openapi-typescript`.
- Ensure frontend calls match the API's expected requests and responses.

### How to Update

1.  Modify the `dcx.yaml` file with your desired changes.
2.  Navigate to the `/frontend` directory.
3.  Run `npm run openapi:types` to regenerate the frontend client types.
4.  Implement the corresponding changes in the backend controllers and services.
