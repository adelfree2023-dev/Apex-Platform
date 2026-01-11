# 🚀 SERVER FORENSIC PROTOCOL: Operation Gap Closer

**Target:** `34.18.154.179`
**Branch:** `operation-gap-closer`
**Objective:** Deploy & Forensic Verify (No Lag)

---

## 🟢 PHASE 1: SURGICAL DEPLOYMENT
*Execute these commands on your local machine to connect, or paste directly into server terminal.*

```bash
# 1. Connect
ssh root@34.18.154.179

# 2. Navigate & Pull (15 seconds)
cd ~/apex
git fetch origin
git checkout operation-gap-closer
git pull origin operation-gap-closer

# 3. Surgical Rebuild (Manager Only) - Fills the gap
# We only rebuild 'manager' because that's where Redis/Throttler changed.
# UPDATE: Using 'docker compose' (v2) instead of 'docker-compose'
docker compose -f docker-compose.dev.yml up -d --build manager
```

---

## 🟡 PHASE 2: DATABASE PATCHING (Inside Container)
*We run this INSIDE the live container to guarantee environment match.*

```bash
# 1. Install Dependencies (Ensure Redis lib exists)
docker exec -it manager pnpm install

# 2. Apply Migration (The "Physical" Fix)
# This adds the 'status' column to ProcessedWebhookEvent
docker exec -it manager npx prisma migrate dev --name add_webhook_status_deploy
```

---

## 🔴 PHASE 3: FORENSIC VERIFICATION (The 15-Second Rule)
*Run each block. Expect IMMEDIATE output.*

### Test A: Redis Connection (Time: 2s)
**Command:**
```bash
docker exec -it apex-redis redis-cli ping
```
**Required Output:** `PONG`

### Test B: Rate Limiting Flood (Time: 5s)
*We hit the Health endpoint 15 times. Expect 200 OK then 429 Too Many Requests.*

**Command:**
```bash
for i in {1..12}; do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/health; done
```
**Required Output:** `200 200 200 ... 429 429` (The 429s prove Redis is blocking you).

### Test C: Webhook Lock Structure (Time: 3s)
*Verify the schema change was applied to the live DB.*

**Command:**
```bash
docker exec -it apex-saas-db psql -U postgres -d apex_saas -c "\d processed_webhook_events"
```
**Required Output:** Look for column `status` of type `webhookstatus`.
