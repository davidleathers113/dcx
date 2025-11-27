# Project DCX: Setup and Next Steps

This document provides a complete guide to setting up your local development environment for the Dependable Call Exchange (DCX) and outlines the next steps to build out the application's features.

## 1. Getting the Application Running (Local Setup)

To run the application, you must start both the **backend** and **frontend** servers in separate terminal windows.

### A. Start the Backend

The backend server is responsible for all API logic, database interactions, and communication with Twilio.

1.  **Navigate to the Backend Directory:**
    ```bash
    cd /Users/davidleathers/dcx/backend
    ```

2.  **Install Dependencies:**
    If you haven't already, install the necessary packages.
    ```bash
    npm install
    ```

3.  **Set Up Your Environment (Crucial Manual Step):**
    This is the most important step. You must provide the secret keys for the application to function.
    
    a. Copy the example file:
    ```bash
    cp .env.example .env
    ```
    b. Open the new `.env` file in a text editor and provide real values for the following:
    -   `DATABASE_URL`: The connection string for your local PostgreSQL database.
    -   `TWILIO_AUTH_TOKEN`: Your auth token from your Twilio account dashboard.
    -   `ADMIN_API_KEY`: **Invent a long, random secret** to use as a password for your API.

4.  **Prepare the Database:**
    This command connects to your database, applies the schema, and gets it ready for use.
    ```bash
    npx prisma migrate dev
    ```

5.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will start on port `4000`. If it starts successfully, you have configured it correctly.

### B. Start the Frontend

The frontend is the Next.js admin dashboard where you will manage and monitor the application.

1.  **Open a new terminal window.**

2.  **Navigate to the Frontend Directory:**
    ```bash
    cd /Users/davidleathers/dcx/frontend
    ```

3.  **Install Dependencies:**
    If you haven't already, install the necessary packages.
    ```bash
    npm install
    ```
    
4.  **Set Up Your Environment:**
    Create a file named `.env.local` and add the `ADMIN_API_KEY` you invented for the backend.
    ```dotenv
    NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
    NEXT_PUBLIC_ADMIN_API_KEY="your_secret_admin_api_key_here"
    ```
    *Note: The key must match the one in the backend's `.env` file.*

5.  **Start the Server:**
    ```bash
    npm run dev
    ```
    The server will start on port `3000`.

### C. View the Application

Once both servers are running, you can view the application in your browser:

-   **Dashboard:** [http://localhost:3000](http://localhost:3000)
-   **Campaigns Page:** [http://localhost:3000/campaigns](http://localhost:3000/campaigns)

---

## 2. What to Build Next (Development Roadmap)

The application foundation is solid, but the UI is mostly read-only and some backend logic is placeholder. Here is the path to a fully functional V1.

### Frontend Tasks (The "Steering Wheel")

-   **Build the "Calls" Page:**
    -   Create a new page at `app/calls/page.tsx`.
    -   Use the `apiClient` to fetch data from the `/api/calls` endpoint.
    -   Create a `components/calls/table.tsx` component to display the calls, including calculated "Cost," "Revenue," and "Profit" columns.

-   **Implement the "Simulate Conversion" Dialog:**
    -   In the Calls table, add a menu action on each row to open a dialog.
    -   The dialog should contain a form to submit a conversion event (e.g., revenue amount).
    -   The form submission should call `apiClient.POST('/api/conversions', ...)` and refresh the table data on success to show the updated revenue.

-   **Build Out Admin Management Pages:**
    -   Create pages and forms under `/app/admin/...` to allow for creating, updating, and deleting **Buyers**, **Offers**, and **Phone Numbers**.

### Backend Tasks (The "Engine Tuning")

-   **Implement the Routing Logic:**
    -   The `decideBestRoute` function in `backend/src/modules/routing/routing.service.ts` is currently a stub.
    -   Implement the real business logic here to query the database for active offers that match a campaign, respect buyer concurrency limits and schedules, and perform weighted selection.

-   **Create the Database Seed Script:**
    -   The file `backend/prisma/seed.ts` is currently missing or empty.
    -   Write a script that creates a realistic set of related data (e.g., 1 Supplier, 2 Campaigns, 3 Buyers, and 5-6 Offers linking them). This will make testing the routing logic much more effective.
    -   You can run the seed script with `npx prisma db seed`.

---
## 3. Project Overview

For more detailed information about the structure of each part of the application, please refer to the README files that have been created:

-   [**Root README**](./README.md)
-   [**Backend README**](./backend/README.md)
-   [**Frontend README**](./frontend/README.md)
-   [**OpenAPI README**](./openapi/README.md)
