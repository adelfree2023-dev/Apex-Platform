/**
 * ⚔️ APEX Tenant Scope Guard
 * CRITICAL SECURITY: Enforces tenant isolation on protected routes
 * 
 * Part of Operation Phoenix - Phase 4 REFACTOR
 */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SKIP_TENANT_CHECK = 'skipTenantCheck';

@Injectable()
export class TenantScopeGuard implements CanActivate {
    private readonly logger = new Logger(TenantScopeGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Check if route is marked to skip tenant check
        const skipCheck = this.reflector.getAllAndOverride<boolean>(
            SKIP_TENANT_CHECK,
            [context.getHandler(), context.getClass()],
        );

        if (skipCheck) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const user = (request as any).user;
        const requestTenantId = request.tenantId;

        // Super admin can access all tenants
        if (user?.role === 'SUPER_ADMIN') {
            this.logger.debug('Super admin access granted');
            return true;
        }

        // If no tenant context is set, deny access
        if (!requestTenantId) {
            this.logger.warn('No tenant context found in request');
            throw new ForbiddenException('Tenant context required');
        }

        // If user has a tenantId, it must match the request tenantId
        if (user?.tenantId && user.tenantId !== requestTenantId) {
            this.logger.error(
                `Tenant isolation violation: User ${user.id} (tenant: ${user.tenantId}) tried to access tenant ${requestTenantId}`,
            );
            throw new ForbiddenException('Tenant access denied');
        }

        return true;
    }
}

/**
 * Decorator to skip tenant check for specific routes
 */
import { SetMetadata } from '@nestjs/common';
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK, true);
