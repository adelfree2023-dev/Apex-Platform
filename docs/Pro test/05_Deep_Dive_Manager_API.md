# 🕵️ Forensic Deep Dive: Manager API

**Target:** `apps/manager`
**Role:** The "Control Plane" / SaaS Backend
**Port:** 3000

## 🏗️ Structural Anatomy
*   **Framework:** NestJS (Node.js)
*   **Language:** TypeScript
*   **Database ORM:** Prisma
*   **Auth:** JWT + Passport

## 📂 Key Internal Directories (`src/`)
*   **`main.ts`**: Entry point. Sets up the server, Swagger documentation (if enabled), and validation pipes.
*   **`app.module.ts`**: The root module. Orchestrates:
    *   `auth/`: Handles Login, Registration, JWT signing.
    *   `tenants/`: Logic for creating new SaaS tenants (e.g., "Store A", "Store B").
    *   `billing/` & `stripe/`: Handles subscriptions and payments.
    *   `users/`: Management of platform admins.
    *   `vendure/`: Likely controls the orchestration of the Vendure Engine (e.g., creating Channels in Vendure when a Tenant is created).

## 🔮 Logic Flow
1.  **Request:** POST `/api/tenants`
2.  **Controller:** `TenantsController` validates input.
3.  **Service:** `TenantsService` creates a record in `apex_saas` DB.
4.  **Side Effect:** Calls `VendureService` to create a matching "Channel" in the E-commerce Engine.
5.  **Response:** Returns the new Tenant ID + Channel Token.

## 🛠️ Engineering Quality
*   **High Cohesion:** Features are grouped by domain (Billing, Tenants).
*   **Type Safety:** Uses proper DTOs (Data Transfer Objects) and `class-validator`.
