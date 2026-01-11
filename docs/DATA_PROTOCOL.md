# 📊 DATA_PROTOCOL.md - The Database & Types Law
## Apex Platform System Constitution - Part 1

**Version:** 1.0 (Post-Operation Phoenix)  
**Last Updated:** 2026-01-09  
**Authors:** Virtual CTO + Operation Phoenix Team

---

## 🧠 AI Context Rules

> [!CAUTION]
> **FOR AI ASSISTANTS:** Read this section BEFORE making any database changes.

1. **NEVER modify schema.prisma without running these commands after:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name <description>
   ```

2. **ALWAYS check `tenantId` is included** in every query that touches tenant data.

3. **NEVER store sensitive data in plain text.** Use `EncryptionService`.

4. **When in doubt, ask the human.** Database changes are irreversible.

---

## 🟢 DATABASE FIXES - ✅ COMPLETE (Commit de425fb)

> [!NOTE]
> **All 4 fixes were implemented on 2026-01-09**

### 1. JSON Payment Configs (Hardcoded Columns Problem)
```prisma
// CURRENT (Bad): vodafoneCashNumber, orangeCashNumber
// SOLUTION: Use JSON or separate table
manualPaymentConfigs Json?
// Example: {"vodafone":"010xxx","instapay":"user@instapay"}
```

### 2. Soft Delete Pattern
```prisma
// Add to: Tenant, User, Order, Product
deletedAt DateTime?
@@index([deletedAt])

// Query: where { deletedAt: null }
```

### 3. Flexible RBAC
```prisma
// Add to TenantUser
permissions Json? // ["VIEW_ORDERS", "EDIT_PRODUCTS"]
```

### 4. Compound Indexes
```prisma
@@index([tenantId, status]) // Order, Payment
```

---

## 🏗️ Database Architecture

### Two-Database System

```
┌────────────────────────────────────────────────────────────────┐
│                    APEX PLATFORM DATABASES                      │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   SaaS DB       │              │   Vendure DB    │          │
│  │   (Prisma)      │              │   (TypeORM)     │          │
│  │   Port: 5432    │              │   Port: 5433    │          │
│  ├─────────────────┤              ├─────────────────┤          │
│  │ • tenants       │              │ • channel       │          │
│  │ • users         │◄────────────►│ • product       │          │
│  │ • licenses      │  vendure-    │ • order         │          │
│  │ • subscriptions │  ChannelId   │ • customer      │          │
│  │ • payments      │              │ • assets        │          │
│  │ • audit_logs    │              │                 │          │
│  └─────────────────┘              └─────────────────┘          │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### Connection Strings

```bash
# SaaS DB (Manager API)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apex_saas

# Vendure DB (Engine)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=apex_vendure_db
```

---

## 📋 Core Schema Models

### Tenant Model (The Master)

```prisma
model Tenant {
  id        String       @id @default(cuid())
  slug      String       @unique        // URL-safe identifier
  name      String                      // Display name
  domain    String?      @unique        // Custom domain
  type      BusinessType @default(RETAIL)
  status    TenantStatus @default(TRIAL)

  // Vendure Integration
  vendureChannelId    String? @unique
  vendureChannelToken String? @unique

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  license          License?
  users            TenantUser[]
  emailSettings    TenantEmailSettings?
  paymentSettings  TenantPaymentSettings?
  subscription     Subscription?
  payments         Payment[]

  @@map("tenants")
}
```

### Key Enums

```prisma
enum BusinessType {
  RETAIL   // E-commerce (current)
  SERVICE  // Future: salons
  BOOKING  // Future: hotels
}

enum TenantStatus {
  ACTIVE | TRIAL | SUSPENDED | CANCELLED
}

enum UserRole {
  SUPER_ADMIN | TENANT_ADMIN | TENANT_STAFF | CUSTOMER
}

enum PlanType {
  BASIC | PRO | ENTERPRISE
}

enum PaymentMethodType {
  VISA_MASTERCARD | INSTAPAY | VODAFONE_CASH | 
  ORANGE_CASH | FAWRY | CASH_ON_DELIVERY
}
```

---

## 🔐 Security Rules

### Rule 1: Tenant Isolation

> [!WARNING]
> **EVERY query MUST include `tenantId` filter.**

```typescript
// ✅ CORRECT
const orders = await prisma.order.findMany({
  where: { tenantId: req.tenantContext.tenantId }
});

// ❌ WRONG - Data leak!
const orders = await prisma.order.findMany();
```

### Rule 2: Encryption

Use `EncryptionService` for sensitive fields:

```typescript
// apps/manager/src/common/services/encryption.service.ts

// Encrypt before storing
const encrypted = encryptionService.encrypt(apiKey);

// Decrypt when reading
const decrypted = encryptionService.decrypt(encrypted);
```

**Fields that MUST be encrypted:**
- `smtpPass` (TenantEmailSettings)
- `cardApiKey`, `cardSecretKey` (TenantPaymentSettings)
- `fawrySecretKey`
- `bankAccountNumber`, `bankIban`

### Rule 3: Prisma Error Handling

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.tenant.create({ ... });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('Already exists');
    }
  }
  throw error;
}
```

---

## 🔄 Schema Modification Protocol

### Step 1: Plan

```bash
# Check current schema
cat apps/manager/prisma/schema.prisma
```

### Step 2: Modify

Edit `schema.prisma` with new field/model.

### Step 3: Generate

```bash
cd apps/manager
npx prisma generate
```

### Step 4: Migrate

```bash
npx prisma migrate dev --name add_new_field
```

### Step 5: Verify

```bash
# Check migration was applied
npx prisma migrate status
```

### Step 6: Update Types

If adding new enums, update TypeScript types accordingly.

---

## 📊 Database Indexes

```prisma
// Already indexed (from schema):
@@index([email])           // User
@@index([role])            // User
@@index([userId])          // Session, AuditLog
@@index([tenantId])        // EmailLog, Payment, etc.
@@index([createdAt])       // AuditLog, EmailLog
@@index([token])           // Session
```

---

## 🔗 Vendure Integration

### Tenant → Channel Mapping

```
Tenant.slug → Channel.code
Tenant.vendureChannelId → Channel.id
Tenant.vendureChannelToken → Channel.token
```

### Create Tenant Flow

```
1. POST /tenants
2. Create Tenant in SaaS DB
3. Call VendureService.createChannel()
4. Update Tenant with vendureChannelId
5. Return unified response
```

---

## 📌 Quick Reference Commands

```bash
# Reset database (DESTRUCTIVE!)
npx prisma migrate reset

# View data
npx prisma studio

# Generate types
npx prisma generate

# Create migration
npx prisma migrate dev --name <name>

# Deploy to production
npx prisma migrate deploy
```

---

**Next:** [SERVER_MECHANICS.md](./SERVER_MECHANICS.md)
