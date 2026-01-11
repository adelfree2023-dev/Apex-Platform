# 🕵️ Forensic Deep Dive: Storefront

**Target:** `apps/storefront`
**Role:** The "Face" / Customer Experience
**Port:** TBD (Dev default usually 3000/3001, likely shifted to 3004 or 4000)

## 🏗️ Structural Anatomy
*   **Framework:** Next.js 16 (Release Candidate / Bleeding Edge)
*   **Core Library:** React 19
*   **Data Fetching:** GraphQL (via `graphql-request`)

## 📂 Key Internal Directories
*   **`app/`**: App Router structure.
    *   `[slug]/`: Dynamic routing for products and collections.
*   **`lib/`**:
    *   `graphql/`: Contains `.graphql` definitions (queries/mutations) to talk to Vendure.
*   **`middleware.ts`**: Critical for routing. Likely handles:
    *   Channel detection (e.g., `store-a.apex.com` -> Channel ID 1).
    *   Localization (en/fr/ar).

## 🔮 Logic Flow
1.  **Server Side Rendering (SSR):** Most pages (Product Detail, Home) are rendered on the server for SEO.
2.  **API Communication:** The server makes GraphQL calls to `apps/engine` (Vendure) to fetch product data.
3.  **Client Interactions:** "Add to Cart" uses Server Actions or Client Components to mutate state in Vendure.

## 🛠️ Engineering Quality
*   **Bleeding Edge:** The choice of Next.js 16 and React 19 is aggressive. It offers the best performance but comes with "early adopter" risks.
*   **Headless Ready:** Completely decoupled from the backend. You could swap the backend to Shopify or Magento and keep this frontend with only data-layer changes.
