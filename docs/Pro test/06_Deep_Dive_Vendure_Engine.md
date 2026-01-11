# 🕵️ Forensic Deep Dive: Vendure Engine

**Target:** `apps/engine`
**Role:** The "Commerce Kernel" / Headless Backend
**Port:** 3001 (API), 3002 (Admin UI)

## 🏗️ Structural Anatomy
*   **Framework:** Vendure (Built on NestJS)
*   **Database:** Postgres (via TypeORM internal to Vendure)

## 📂 Key Internal Components
Unlike `apps/manager`, this application is primarily a **Configuration Wrapper**.
*   **`src/vendure-config.ts`**: The most critical file. It defines:
    *   **AuthOptions:** How users log in.
    *   **DBConnection:** Credentials for `apex-vendure-db`.
    *   **Plugins:** The list of active extensions (e.g., `AdminUiPlugin`, `AssetServerPlugin`).
*   **`src/plugins/`**: Custom logic specific to your business rules that override default Vendure behavior.

## 🔮 Logic Flow
*   This app "sits and waits" for API requests to `/shop-api` (from Storefront) or `/admin-api` (from Admin/Manager).
*   It does **not** handle SaaS billing. It assumes the request context provides the "Channel Token" to know which store is being accessed.

## 🛠️ Engineering Quality
*   **Standardized:** Uses the official Vendure structure, making it easy for any certified Vendure developer to take over.
*   **Extensible:** The existence of a `plugins` folder suggests correct architectural thinking—don't modify the core, extend it.
