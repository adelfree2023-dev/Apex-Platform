# 🦅 Operation Gap Closer - Stage 1: The Blueprint

**Date:** 2026-01-11
**Objective:** Execute "Gap Closer" to secure and stabilize the system.
**Status:** 🚦 PENDING APPROVAL

---

## 🔍 Forensic Gap Analysis (Reconstructed)

Based on strict inspection of `apps/manager` and infrastructure:

### 1. 🛡️ Security Gap: Rate Limiting
*   **Current State:** `ThrottlerModule` uses **In-Memory Storage**.
*   **Risk:** If the app scales to multiple replicas (clustering) or restarts, limits are reset. Memory leaks possible.
*   **Strict Standard:** Must use **Redis** to persist limits across restarts/scaling.

### 2. 💸 Payment Gap: Webhook Idempotency Race Condition
*   **Current State:** "Check DB -> Process -> Save DB".
*   **Risk:** **Parallel Execution Race Condition.** If Stripe sends the same event twice simultaneously (ms apart), both pass the "Check DB", both process, and both try to save. This triggers double actions (e.g., granting 2 subscriptions).
*   **Strict Standard:** **"Lock-First" Pattern.** Attempt to insert `ProcessedWebhookEvent` with status `PENDING`. If it fails (Unique Constraint), abort immediately. Then Process. Then Update to `COMPLETED`.

### 3. 🏗️ Infrastructure Gap: Integration Trust
*   **Current State:** `tests/integration` exists but not verified recently.
*   **Risk:** Tests might be stale or failing against the current dockerized DBs.
*   **Strict Standard:** "Trust but Verify". We must run these tests against a live Docker environment.

---

## 📋 The Execution Plan

### Task 1: Redis Rate Limiting (Manager)
*   **Target:** `apps/manager/src/app.module.ts`
*   **Change:**
    *   Install `throttler-storage-redis`.
    *   Configure `ThrottlerModule` to use `ConfigService` for `REDIS_URL`.
    *   Ensure `docker-compose` Redis is accessible.

### Task 2: Atomic Webhook Idempotency (Manager)
*   **Target:** `apps/manager/src/stripe/stripe.controller.ts`
*   **Change:** Refactor `handleWebhook` logic.
    ```typescript
    // 1. Try acquire lock (Atomic Insert)
    try {
        await prisma.processedWebhookEvent.create({ data: { status: 'PENDING' ... } })
    } catch (e) {
        return res.json({ received: true }); // Already processing/processed
    }
    // 2. Process
    // 3. Update to COMPLETED
    ```
*   **Schema Change:** Add `status` field to `ProcessedWebhookEvent` (Enum: PENDING, COMPLETED, FAILED).

### Task 3: Infrastructure Verification
*   **Target:** `tests/integration/`
*   **Action:**
    *   Ensure `docker-compose.dev.yml` is UP.
    *   Run `pnpm test:e2e` (or equivalent script targeting integration folder).
    *   Report results.

---

## 🧪 Verification Strategy

| Feature | Verification Method | Pass Criteria |
|---------|---------------------|---------------|
| **Rate Limiting** | Manual `curl` flood | 11th request returns `429 Too Many Requests` + Redis keys exist. |
| **Idempotency** | Concurrent Requests (Promise.all) | Only **1** event record created, only **1** logic execution. |
| **Integration** | `npm run test:integration` | All tests pass (Green). |

---

## ⚠️ Schema Migration Required?

**YES.**

```prisma
// apps/manager/prisma/schema.prisma

enum WebhookStatus {
  PENDING
  COMPLETED
  FAILED
}

model ProcessedWebhookEvent {
  // ... existing fields
  status WebhookStatus @default(COMPLETED) // Migration will set existing to COMPLETED
}
```

---

## 🚀 Ready to Build?

**Waiting for:** `APPROVE PLAN`
