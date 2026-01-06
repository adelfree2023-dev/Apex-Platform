# 📚 Apex Platform - دليل المطورين الشامل

> **آخر تحديث:** 2026-01-06  
> **الإصدار:** 1.0.0  
> **الحالة:** Phase 03 Complete + Critical Sync Fix Applied

---

## 🎯 نظرة عامة على المشروع

**Apex Platform** هي منصة SaaS متعددة المستأجرين (Multi-Tenant) للتجارة الإلكترونية.

### البنية الأساسية:
```
┌─────────────────────────────────────────────────────────────────┐
│                      APEX PLATFORM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Manager   │────▶│   Vendure   │     │  Storefront │        │
│  │   (NestJS)  │     │   (Engine)  │     │  (Next.js)  │        │
│  │   :3000     │     │   :3001     │     │   :3002     │        │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘        │
│         │                   │                   │               │
│    PostgreSQL          PostgreSQL          API Calls            │
│      :5432               :5433                                  │
│   (apex_saas)          (vendure)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 البنية التقنية

### الخدمات:

| الخدمة | التقنية | المنفذ | الوظيفة |
|--------|---------|--------|---------|
| **Manager API** | NestJS | 3000 | إدارة المستأجرين، المستخدمين، الرخص |
| **Vendure Engine** | Vendure v3.0.5 | 3001 | محرك التجارة الإلكترونية |
| **Storefront** | Next.js 14 | 3002 | واجهة المتجر للعملاء |
| **Admin HQ** | Next.js 14 | 3003 | لوحة تحكم Super Admin |

### قواعد البيانات:

| قاعدة البيانات | المنفذ | الاستخدام |
|----------------|--------|-----------|
| `apex_saas` | 5432 | بيانات Manager (Tenants, Users, Licenses) |
| `vendure` | 5433 | بيانات Vendure (Products, Orders, Channels) |

---

## 🔗 العلاقة بين Manager و Vendure

### ⚠️ قاعدة ذهبية:

> **كل Tenant في Manager = Channel في Vendure**
> 
> يجب إنشاء وحذف المستأجرين **فقط** عبر Manager API.

### التزامن (Sync):

```
إنشاء Tenant:
POST /api/tenants → Manager.create() → Vendure.createChannel()
                          ↓
                  يحفظ vendureChannelId في DB

حذف Tenant:
DELETE /api/tenants/:id → Manager.delete() → Vendure.deleteChannel()
                                ↓
                        يحذف من كلا القاعدتين
```

### ❌ ممنوع:
- إنشاء Channels مباشرة في Vendure Admin
- حذف Tenants من قاعدة البيانات مباشرة

---

## 📁 هيكل الملفات

```
apex-platform/
├── apps/
│   ├── manager/              # Manager API (NestJS)
│   │   ├── src/
│   │   │   ├── tenants/      # 🔥 Tenant CRUD + Vendure Sync
│   │   │   ├── vendure/      # Vendure GraphQL Client
│   │   │   └── prisma/       # Database access
│   │   └── prisma/
│   │       └── schema.prisma # Database schema
│   │
│   ├── engine/               # Vendure Engine
│   │   └── src/
│   │       └── vendure-config.ts
│   │
│   ├── storefront/           # Customer-facing store (Next.js)
│   │   ├── app/
│   │   │   └── [tenant]/     # Dynamic tenant routing
│   │   └── lib/
│   │       ├── vendure-client.ts
│   │       └── manager-client.ts
│   │
│   └── admin-hq/            # Super Admin Dashboard
│
├── scripts/
│   ├── integration-test.sh   # 🧪 Test script
│   └── cleanup-orphaned-channels.sh
│
└── docs/                     # Documentation
```

---

## 🗄️ Prisma Schema (Manager)

### Tenant Model:

```prisma
model Tenant {
  id                  String       @id @default(cuid())
  slug                String       @unique
  name                String
  domain              String?      @unique
  type                BusinessType @default(RETAIL)
  status              TenantStatus @default(TRIAL)

  // 🔥 Vendure Integration (CRITICAL)
  vendureChannelId    String?      @unique  // معرف القناة في Vendure
  vendureChannelToken String?      @unique  // Token للـ API

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}
```

---

## 🔌 API Endpoints (Manager)

### Tenants:

| Method | Endpoint | الوظيفة |
|--------|----------|---------|
| `POST` | `/api/tenants` | إنشاء tenant جديد |
| `GET` | `/api/tenants` | قائمة كل الـ tenants |
| `GET` | `/api/tenants/:id` | الحصول على tenant بالـ ID |
| `GET` | `/api/tenants/slug/:slug` | الحصول على tenant بالـ slug |
| `PATCH` | `/api/tenants/:id` | تحديث tenant |
| `DELETE` | `/api/tenants/:id` | حذف tenant (+ Vendure channel) |
| `POST` | `/api/tenants/slug/:slug/seed` | إضافة منتجات تجريبية |

### Create Tenant Request:

```json
{
  "name": "Store Name",
  "adminEmail": "admin@store.com",
  "adminPassword": "Password123!",
  "adminName": "Admin Name"
}
```

### Create Tenant Response:

```json
{
  "id": "cmk2p5sp10001r42ss80rh9rd",
  "slug": "store-name",
  "name": "Store Name",
  "status": "ACTIVE",
  "vendureChannelId": "10",      // 🔥 الآن مملوء!
  "vendureChannelToken": "store-name"
}
```

---

## 🚀 تشغيل المشروع محلياً

### 1. المتطلبات:
- Node.js 20+
- pnpm
- PostgreSQL (أو Docker)

### 2. إعداد قواعد البيانات:
```bash
# تشغيل PostgreSQL عبر Docker
docker-compose -f docker-compose.dev.yml up -d
```

### 3. تشغيل الخدمات:
```bash
# Terminal 1: Vendure
cd apps/engine
npm run dev

# Terminal 2: Manager
cd apps/manager
npm run start:dev

# Terminal 3: Storefront
cd apps/storefront
npm run dev -- -p 3002
```

### 4. إنشاء أول Tenant:
```bash
curl -X POST http://127.0.0.1:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "adminEmail": "admin@mystore.com",
    "adminPassword": "MyPass123!",
    "adminName": "Store Admin"
  }'
```

---

## 🧪 الاختبار

### تشغيل الاختبارات:
```bash
# من على السيرفر
chmod +x scripts/integration-test.sh
./scripts/integration-test.sh
```

### ما يُختبر:
- ✅ Vendure API health
- ✅ Manager API health
- ✅ Storefront accessibility
- ✅ Tenant create (with vendureChannelId)
- ✅ Tenant delete (with Vendure sync)

---

## ⚠️ الأخطاء الشائعة وحلولها

### 1. `EADDRINUSE: address already in use`
```bash
# اقتل العملية القديمة
pkill -9 node
```

### 2. `Vendure not ready, retry...`
```bash
# تأكد من تشغيل Vendure أولاً
cd apps/engine && npm run dev
```

### 3. `vendureChannelId: null`
**السبب:** الكود القديم يعمل.
**الحل:** اقتل كل العمليات وأعد التشغيل.

### 4. Channels يتيمة في Vendure
**السبب:** تم إنشاؤها مباشرة في Vendure Admin.
**الحل:** احذفها من Vendure Admin → Settings → Channels.

---

## 📋 Checklist قبل أي تعديل

```
[ ] قرأت هذا الدليل
[ ] فهمت العلاقة بين Manager و Vendure
[ ] الخدمات تعمل محلياً
[ ] لن أنشئ Channels مباشرة في Vendure
[ ] سأختبر الـ sync بعد أي تعديل
```

---

## 🔄 Git Workflow

### الفروع:
- `main` - الإنتاج (Protected)
- `develop` - التطوير
- `feature/*` - الميزات الجديدة

### قبل الـ Push:
```bash
# تأكد من عدم وجود أخطاء TypeScript
npm run type-check

# شغل الاختبارات
./scripts/integration-test.sh
```

---

## 📞 للمساعدة

**Commit الأخير:** `beb4774` - Fix: Tenant-Vendure sync
**آخر تحديث:** 2026-01-06
