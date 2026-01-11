# 🕵️ Forensic Deep Dive: Admin HQ

**Target:** `apps/admin-hq`
**Role:** The "Cockpit" for Platform & Tenant Admins
**Port:** 3003

## 🏗️ Structural Anatomy
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS + Radix UI (shadcn/ui likely)
*   **State Management:** React Query (TanStack Query)

## 📂 Key Internal Directories
*   **`app/`**: Route definitions.
    *   `app/dashboard/`: The protected area.
    *   `app/login/`: Authentication entry.
*   **`components/`**: Reusable UI blocks.
    *   `ui/`: Primitive components (Buttons, Inputs) - likely auto-generated or copied from shadcn.
*   **`lib/`**: Utilities.
    *   `utils.ts`: Class name merging (clsx/tailwind-merge).
    *   `api.ts`: Axios instance configured to talk to `apps/manager`.

## 🔮 Logic Flow
1.  **User logs in:** Hits `apps/manager` auth endpoint.
2.  **Token Storage:** JWT stored in HttpOnly cookie or LocalStorage.
3.  **Data Fetching:** React Query hooks in `hooks/` fetch data from `apps/manager` and `apps/engine` separately, merging them into a unified dashboard view.

## 🛠️ Engineering Quality
*   **Modern:** Use of App Router is the current standard.
*   **Clean:** Separation of `components` (view) vs `hooks` (logic) is good practice.
