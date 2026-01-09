/**
 * @apex/shared - Shared utilities for Apex Platform
 * Part of Operation Phoenix
 */

// Fetch utilities
export {
    fetchWithTimeout,
    fetchWithRetry,
    FetchError,
    TimeoutError,
    safeJsonParse,
    delay,
} from './utils/fetch';

// Error classes
export {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    TenantIsolationError,
    RateLimitError,
    ExternalServiceError,
} from './errors';
