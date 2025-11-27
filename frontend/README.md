# DCX Frontend

This directory contains the Next.js and Shadcn UI frontend for the Dependable Call Exchange admin dashboard.

## 1. Setup

### Prerequisites

-   Node.js (v18 or later)
-   npm
-   A running instance of the [DCX Backend](../backend/README.md).

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env.local` file in this directory. It tells the frontend where to find the backend API.
    ```dotenv
    NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
    ```
    You may also need to add the `ADMIN_API_KEY` from the backend's `.env` file if you are using authentication:
    ```dotenv
    NEXT_PUBLIC_ADMIN_API_KEY="your_admin_api_key_here"
    ```


4.  **Generate API Client Types:**
    This project uses `openapi-typescript` to generate a type-safe client from the shared OpenAPI specification. Run the following command to generate the types file (`src/types/api.d.ts`).
    ```bash
    npm run openapi:types
    ```
    > **Note:** You must re-run this command whenever the `openapi/dcx.yaml` file changes to keep the frontend client in sync with the backend API.

## 2. Running the Development Server

First, ensure the [backend server](../backend/README.md) is running. Then, run the frontend development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

-   The main dashboard will show the backend health status.
-   Navigate to [http://localhost:3000/campaigns](http://localhost:3000/campaigns) to see the campaigns table.

## 3. Build Notes

- Dashboard-focused routes (e.g., `/` and `/campaigns`) export `dynamic = 'force-dynamic'` so Next.js skips build-time prerender calls to the backend.
- This was manually set after repeated `npm run build` failures when prerender tried to hit `http://localhost:4000` and the API was offline.
- If you later need SSG, remove the flag and ensure a stable backend (or mock API) is reachable during builds.

## Learn More

To learn more about the tech stack, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Shadcn UI](https://ui.shadcn.com/) - component library used for the UI.
-   [TanStack Table](https://tanstack.com/table/v8) - for building data grids.
-   [openapi-typescript](https://github.com/drwpow/openapi-typescript) - for generating types from the OpenAPI spec.
