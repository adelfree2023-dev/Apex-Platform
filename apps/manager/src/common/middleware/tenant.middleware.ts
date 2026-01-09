/**
 * ⚔️ APEX Tenant Middleware
 * CRITICAL SECURITY: Extracts and validates tenant context from every request
 * 
 * Part of Operation Phoenix - Phase 4 REFACTOR
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include tenant context
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            tenantSlug?: string;
        }
    }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        // Extract tenant from multiple sources (priority order)
        const tenantId = this.extractTenantId(req);
        const tenantSlug = this.extractTenantSlug(req);

        if (tenantId) {
            req.tenantId = tenantId;
            this.logger.debug(`Tenant context set: ${tenantId}`);
        }

        if (tenantSlug) {
            req.tenantSlug = tenantSlug;
        }

        next();
    }

    private extractTenantId(req: Request): string | undefined {
        // 1. From header (API calls)
        const headerTenantId = req.headers['x-tenant-id'] as string;
        if (headerTenantId) return headerTenantId;

        // 2. From JWT token (if authenticated)
        const user = (req as any).user;
        if (user?.tenantId) return user.tenantId;

        // 3. From query params (for specific endpoints)
        if (req.query.tenantId) return req.query.tenantId as string;

        // 4. From body (for create operations)
        if (req.body?.tenantId) return req.body.tenantId;

        return undefined;
    }

    private extractTenantSlug(req: Request): string | undefined {
        // From subdomain
        const host = req.headers.host;
        if (host) {
            const parts = host.split('.');
            if (parts.length > 2) {
                return parts[0]; // e.g., "tenant1" from "tenant1.apex.com"
            }
        }

        // From path (e.g., /api/tenants/:slug)
        if (req.params?.slug) return req.params.slug;

        return undefined;
    }
}
