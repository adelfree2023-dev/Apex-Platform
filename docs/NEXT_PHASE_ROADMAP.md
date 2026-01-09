# 📋 NEXT PHASE ROADMAP
## Technical Improvements Before Next Features

**Status:** Ready for Implementation  
**Priority:** HIGH (Database Architecture)

---

## 🔴 CRITICAL DATABASE FIXES (Do First!)

### Issue 1: Hardcoded Payment Columns ⚠️
**Problem:** `vodafoneCashNumber`, `orangeCashNumber` are hardcoded.  
**Risk:** Can't add new wallets without migration.

**Solution:**
```prisma
// BEFORE (Bad)
vodafoneCashNumber String?
orangeCashNumber String?

// AFTER (Good)
manualPaymentConfigs Json?
// or
model PaymentMethodConfig {
  id          String @id
  tenantId    String
  methodType  String  // "vodafone", "instapay", "we_cash"
  value       String  // Encrypted phone/username
  isActive    Boolean
}
```

---

### Issue 2: Missing Soft Delete ⚠️
**Problem:** No `deletedAt` field.  
**Risk:** Accidental deletions lose data forever.

**Solution:**
```prisma
// Add to: Tenant, User, Order, Product
deletedAt DateTime?

// Query pattern
where: { deletedAt: null }
```

---

### Issue 3: RBAC Limitations ⚠️
**Problem:** Fixed roles only (SUPER_ADMIN, TENANT_ADMIN, TENANT_STAFF).  
**Risk:** Can't grant granular permissions.

**Solution:**
```prisma
// Option A: JSON permissions
model TenantUser {
  permissions Json? // ["VIEW_ORDERS", "EDIT_PRODUCTS"]
}

// Option B: Full RBAC tables
model Permission {
  id   String @id
  name String @unique // "VIEW_ORDERS"
}

model RolePermission {
  roleId       String
  permissionId String
}
```

---

### Issue 4: Encryption ✅ (Already Done)
**Status:** EncryptionService created in Operation Phoenix.  
**Location:** `apps/manager/src/common/services/encryption.service.ts`

---

## 📊 UPDATED PHASE ORDER

| Priority | Phase | Description |
|----------|-------|-------------|
| **P0** | Database Fixes | JSON payments, Soft delete, RBAC |
| **P1** | Phase 03 | Storefront Foundation |
| **P2** | Phase 04 | Authentication & Users |
| **P3** | Phase 05+ | Products, Cart, Checkout |

---

## 🔧 REQUIRED INDEXES

```prisma
// Add to Order
@@index([tenantId, status])

// Add to Payment
@@index([tenantId, status])

// Add to any table with deletedAt
@@index([deletedAt])
```

---

## ⏱️ ESTIMATED TIME

| Task | Time |
|------|------|
| JSON Payment Config | 2h |
| Soft Delete | 1h |
| RBAC Enhancement | 3h |
| Indexes | 30min |
| **Total** | **6.5h** |

---

## 📝 DEVELOPER MESSAGES

### 🚦 START OF WORK:
> **"ابدأ بقراءة docs/README.md ثم نفذ الإصلاحات الثلاث في schema.prisma قبل أي ميزة جديدة."**

### 🏁 END OF WORK:
> **"تأكد من تشغيل prisma migrate dev واختبار CI محلياً قبل الـ push."**

---

*Last Updated: 2026-01-09*
