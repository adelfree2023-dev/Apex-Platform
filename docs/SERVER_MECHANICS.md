# ⚙️ SERVER_MECHANICS.md - The Backend Logic
## Apex Platform System Constitution - Part 2

**Version:** 1.0 (Post-Operation Phoenix)  
**Last Updated:** 2026-01-09  
**Authors:** Virtual CTO + Operation Phoenix Team

---

## 🧠 AI Context Rules

> [!CAUTION]
> **FOR AI ASSISTANTS:** Read this section BEFORE writing backend code.

1. **EVERY controller endpoint MUST be protected** by appropriate guards.

2. **NEVER use `console.log` in production code.** Use `Logger` instead.

3. **ALWAYS use `TenantMiddleware`** for tenant-specific routes.

4. **Error responses MUST use `AppError` classes** from `@apex/shared`.

5. **Check the Manager module structure** before creating new modules.

---

## 🏗️ NestJS Architecture

### Module Structure

```
apps/manager/src/
├── app.module.ts           # Root module
├── main.ts                 # Bootstrap
├── prisma/                 # Database
│   └── prisma.service.ts
├── auth/                   # Authentication
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── tenants/                # Tenant CRUD
│   ├── tenants.module.ts
│   ├── tenants.service.ts
│   └── tenants.controller.ts
├── vendure/                # Vendure integration
│   ├── vendure.module.ts
│   └── vendure.service.ts
├── billing/                # Subscriptions
├── email/                  # Email system
└── common/                 # Shared utilities ⭐
    ├── middleware/
    │   └── tenant.middleware.ts
    ├── guards/
    │   └── tenant-scope.guard.ts
    └── services/
        └── encryption.service.ts
```

---

## 🔐 Security Layer

### Authentication Flow

```
Request → JwtAuthGuard → TenantMiddleware → Controller
                ↓
        Validate JWT token
                ↓
        Extract user from token
                ↓
        Attach tenantContext to request
```

### Tenant Middleware (NEW in Operation Phoenix)

```typescript
// apps/manager/src/common/middleware/tenant.middleware.ts

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void {
        // Extract tenant from multiple sources
        const tenantId = this.extractTenantId(req);
        const tenantSlug = this.extractTenantSlug(req);

        // Attach to request
        req.tenantContext = {
            tenantId,
            tenantSlug,
            userId: req.user?.sub,
            roles: req.user?.roles || [],
        };

        next();
    }

    private extractTenantId(req: Request): string | null {
        // Priority: Header > JWT > Query > Body
        return (
            req.headers['x-tenant-id'] as string ||
            req.user?.tenantId ||
            req.query.tenantId as string ||
            req.body?.tenantId ||
            null
        );
    }
}
```

### Tenant Scope Guard

```typescript
// apps/manager/src/common/guards/tenant-scope.guard.ts

@Injectable()
export class TenantScopeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const tenantContext = request.tenantContext;

        if (!tenantContext?.tenantId) {
            throw new TenantIsolationError();
        }

        // Super admins can access all tenants
        if (tenantContext.roles?.includes('SUPER_ADMIN')) {
            return true;
        }

        return true;
    }
}
```

### Rate Limiting

```typescript
// Already configured in app.module.ts
ThrottlerModule.forRoot({
    ttl: 60,
    limit: 100,
}),
```

---

## 🚨 Error Handling

### Standard Error Classes (from @apex/shared)

```typescript
// packages/shared/src/errors/index.ts

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
    }
}

// Specific errors
export class ValidationError extends AppError      // 400
export class AuthenticationError extends AppError  // 401
export class AuthorizationError extends AppError   // 403
export class NotFoundError extends AppError        // 404
export class TenantIsolationError extends AppError // 403 (CRITICAL!)
export class RateLimitError extends AppError       // 429
export class ExternalServiceError extends AppError // 502
```

### Usage in Services

```typescript
import { NotFoundError, ValidationError } from '@apex/shared';

@Injectable()
export class TenantsService {
    async findBySlug(slug: string) {
        const tenant = await this.prisma.tenant.findUnique({ 
            where: { slug } 
        });
        
        if (!tenant) {
            throw new NotFoundError('Tenant', slug);
        }
        
        return tenant;
    }
}
```

---

## 📝 Controller Pattern

### Standard Controller Template

```typescript
import { 
    Controller, Get, Post, Put, Delete,
    Body, Param, UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';

@Controller('resources')
@UseGuards(JwtAuthGuard, TenantScopeGuard)
export class ResourceController {
    constructor(
        private readonly service: ResourceService,
        private readonly logger: Logger,
    ) {}

    @Post()
    async create(@Body() dto: CreateResourceDto) {
        this.logger.log(`Creating resource: ${dto.name}`);
        return this.service.create(dto);
    }

    @Get()
    async findAll(@Req() req: Request) {
        const { tenantId } = req.tenantContext;
        return this.service.findAll(tenantId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
```

---

## 📝 Service Pattern

### Standard Service Template

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from '@apex/shared';

@Injectable()
export class ResourceService {
    private readonly logger = new Logger(ResourceService.name);

    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateResourceDto) {
        this.logger.log(`Creating: ${dto.name}`);
        
        return this.prisma.resource.create({
            data: dto,
        });
    }

    async findAll(tenantId: string) {
        // ⚠️ ALWAYS filter by tenantId!
        return this.prisma.resource.findMany({
            where: { tenantId },
        });
    }

    async findOne(id: string) {
        const resource = await this.prisma.resource.findUnique({
            where: { id },
        });
        
        if (!resource) {
            throw new NotFoundError('Resource', id);
        }
        
        return resource;
    }
}
```

---

## 🔗 Vendure Integration

### GraphQL Client

```typescript
// apps/manager/src/vendure/vendure.service.ts

@Injectable()
export class VendureService {
    private client: GraphQLClient;
    
    async createChannel(slug: string, name: string) {
        await this.authenticate();
        
        const mutation = `
            mutation CreateChannel($input: CreateChannelInput!) {
                createChannel(input: $input) {
                    id
                    code
                    token
                }
            }
        `;
        
        return this.client.request(mutation, { input: { ... } });
    }
}
```

---

## 🔐 Encryption Service

```typescript
// apps/manager/src/common/services/encryption.service.ts

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(config: ConfigService) {
        const secret = config.getOrThrow<string>('ENCRYPTION_KEY');
        this.key = crypto.scryptSync(secret, 'apex-salt', 32);
    }

    encrypt(plaintext: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    }

    decrypt(ciphertext: string): string {
        const [ivB64, authTagB64, encrypted] = ciphertext.split(':');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
```

---

## 🧪 Testing

### Run Tests

```bash
cd apps/manager
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm test:cov       # Coverage
```

---

## 📌 Quick Reference

### Environment Variables (Required)

```bash
DATABASE_URL=postgresql://...
VENDURE_URL=http://localhost:3001
JWT_SECRET=your-secret
ENCRYPTION_KEY=your-32-char-key
```

### Common Commands

```bash
# Start dev
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm tsc --noEmit
```

---

**Previous:** [DATA_PROTOCOL.md](./DATA_PROTOCOL.md)  
**Next:** [UI_SYSTEM.md](./UI_SYSTEM.md)
