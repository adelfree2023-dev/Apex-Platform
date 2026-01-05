# 🚀 Apex Platform

Multi-tenant SaaS E-commerce Platform built with Vendure, NestJS, and Next.js.

## 🏗️ Architecture

```
┌──────────────┐             ┌──────────────┐
│   Manager    │─────────────│   Vendure    │
│   (NestJS)   │   GraphQL   │   (Engine)   │
│   :3000      │   Client    │   :3001      │
└──────┬───────┘             └──────┬───────┘
       │                            │
  ┌────▼────┐                  ┌────▼────┐
  │SaaS DB  │                  │Vendure  │
  │(Prisma) │                  │DB       │
  │:5432    │                  │:5433    │
  └─────────┘                  └─────────┘
```

## 📁 Project Structure

```
apex-platform/
├── apps/
│   ├── engine/          # Vendure E-commerce Engine (:3001)
│   └── manager/         # NestJS SaaS Manager API (:3000)
├── packages/
│   ├── database/        # Shared Prisma
│   └── types/           # Shared TypeScript types
├── docker-compose.dev.yml
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/adelfree2023-dev/Apex-Platform.git
cd Apex-Platform

# 2. Install dependencies
pnpm install

# 3. Start databases
docker-compose -f docker-compose.dev.yml up -d

# 4. Setup Manager API
cd apps/manager
cp .env.example .env
npx prisma migrate dev
npx prisma generate

# 5. Setup Vendure Engine
cd ../engine
cp .env.example .env

# 6. Start services
# Terminal 1: Vendure
cd apps/engine && pnpm run dev

# Terminal 2: Manager
cd apps/manager && pnpm run start:dev
```

### 🧪 Test Integration (Nuclear Test)

```bash
# Create a tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Store"}'

# Expected: Returns tenant + Vendure channel
```

## 📊 API Endpoints

### Manager API (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/tenants` | Create tenant |
| GET | `/api/tenants` | List all tenants |
| GET | `/api/tenants/:id` | Get tenant by ID |
| PATCH | `/api/tenants/:id` | Update tenant |
| DELETE | `/api/tenants/:id` | Delete tenant |

### Vendure Engine (Port 3001)

- Admin API: `http://localhost:3001/admin-api`
- Shop API: `http://localhost:3001/shop-api`
- Admin UI: `http://localhost:3002/admin`

## 🔐 Default Credentials

- **Vendure Admin:**
  - Username: `superadmin`
  - Password: `superadmin`

## 📝 Phase Documentation

See `docs/` folder for phase-by-phase implementation guides.

## 📄 License

Private - All rights reserved.
