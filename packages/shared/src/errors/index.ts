/**
 * ⚔️ APEX Standard Error Classes
 * ALL errors must extend AppError for consistent handling
 * 
 * Part of Operation Phoenix - Phase 2 STANDARDIZE
 */

/**
 * Base application error class
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error - for input validation failures
 */
export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, true, context);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication error - user not authenticated
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 'AUTH_ERROR', 401, true);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error - user not authorized
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 'FORBIDDEN', 403, true);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not found error - resource not found
 */
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        super(
            `${resource}${id ? ` with ID ${id}` : ''} not found`,
            'NOT_FOUND',
            404,
            true
        );
        this.name = 'NotFoundError';
    }
}

/**
 * Tenant isolation error - CRITICAL security violation
 */
export class TenantIsolationError extends AppError {
    constructor() {
        super(
            'Tenant context violation detected',
            'TENANT_VIOLATION',
            403,
            false // NOT operational - this is a bug!
        );
        this.name = 'TenantIsolationError';
    }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends AppError {
    constructor(retryAfter?: number) {
        super(
            'Too many requests, please try again later',
            'RATE_LIMIT',
            429,
            true,
            retryAfter ? { retryAfter } : undefined
        );
        this.name = 'RateLimitError';
    }
}

/**
 * External service error - third-party service failure
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, originalError?: Error) {
        super(
            `External service "${service}" failed`,
            'EXTERNAL_SERVICE_ERROR',
            502,
            true,
            originalError ? { originalMessage: originalError.message } : undefined
        );
        this.name = 'ExternalServiceError';
    }
}
