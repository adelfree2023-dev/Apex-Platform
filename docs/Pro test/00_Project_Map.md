# 🗺️ Project Map & Key Files Analysis

**Date:** 2026-01-11
**Investigator:** Antigravity Code Assistant
**Scope:** Root Level & Architecture Map

## 1. Project Overview
The project is a **Monorepo** built using **TurboRepo**, designed for a sophisticated Multi-tenant E-commerce Platform. It clearly separates concerns into specialized applications (Microservices/Modular Monolith approach) and shared packages.

## 2. 🔑 Key Files for Understanding the Architecture

If a new developer or auditor wants to understand this project effectively, these are the **Critical Files** they must read, in this order:

### Level 1: The Blueprint (Root)
*   **`turbo.json`**: Defines the build pipeline and dependency graph between apps. It explains how `lint`, `build`, and `dev` scripts cascade across the project.
*   **`docker-compose.dev.yml`**: The "Infrastructure as Code" for local development. It maps out the backing services:
    *   `apex-saas-db` (Postgres 5432) -> For the Manager Application.
    *   `apex-vendure-db` (Postgres 5433) -> For the E-commerce Engine.
    *   `apex-redis` (Redis 6379) -> For caching and session management.
*   **`package.json`**: The root manifest. Shows the workspace definitions (`apps/*`, `packages/*`).

### Level 2: The Brains (Applications)
*   **`apps/manager/src/app.module.ts`**: The "Central Nervous System" of the SaaS Manager API. Reading the `imports` array here immediately reveals every feature capability (Auth, Billing, Tenants, Stripe, etc.).
*   **`apps/engine/src/vendure-config.ts`**: The configuration heart of the E-commerce engine. Defines database connections, authentication strategies, and installed plugins.
*   **`apps/storefront/package.json`**: Reveals the cutting-edge tech stack (Next.js 16, React 19) and key dependencies (GraphQL, Tailwind).

### Level 3: The Data & Glue (Packages)
*   **`packages/database/prisma/schema.prisma`** (Assumed location based on standard patterns): typically holds the database schema. *Note: In this project, verify if Prisma is inside `apps/manager` or `packages/database`.* Current audit shows `apps/manager/prisma` likely holds the SaaS schema.

## 3. 📂 Directory Structure Map

```text
root/
├── apps/                  # 🧠 The Application Logic
│   ├── manager/           # [Backend] NestJS API for SaaS Tenant Management (Port 3000)
│   ├── engine/            # [Backend] Vendure E-commerce Core (Port 3001)
│   ├── admin-hq/          # [Frontend] Next.js 14 Dashboard for Super/Tenant Admins (Port 3003)
│   └── storefront/        # [Frontend] Next.js 16 Customer Facing Shop (Port TBD)
├── packages/              # 📦 Shared Code Libraries
│   ├── database/          # Shared Database utilities (Prisma)
│   ├── shared/            # Shared logic/utilities
│   ├── types/             # Shared TypeScript Interfaces/DTOs
│   └── eslint-config/     # Linting standards
└── docs/                  # 📚 Documentation
```

## 4. Architectural Summary
This is a **Headless Architecture**:
*   **Backend:** Split between a Custom SaaS Manager (NestJS) and a Headless Commerce Engine (Vendure).
*   **Frontend:** Decoupled frontends (Admin HQ, Storefront) consuming APIs via REST (Manager) and GraphQL (Vendure).
*   **Infrastructure:** Dockerized databases assure environment consistency.

---
**Conclusion:** This project structure is **Professional Enterprise-Grade**. It avoids the "Spaghetti Code" trap by enforcing strict boundaries via the Monorepo structure.
