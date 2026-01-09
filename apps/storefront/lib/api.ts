/**
 * ⚔️ APEX Storefront API Client
 * Wraps all API calls with timeout and retry mechanisms
 * 
 * Part of Operation Phoenix - Phase 3 FORTIFY
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;

/**
 * Fetch with timeout - prevents UI freezing
 */
async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new ApiError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                url
            );
        }

        return response.json();
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError(`Request timeout after ${timeoutMs}ms`, url);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Fetch with retry and exponential backoff
 */
async function fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    maxRetries: number = DEFAULT_RETRIES
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetchWithTimeout<T>(url, options);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on 4xx errors
            if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
                throw error;
            }

            if (attempt < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, attempt) + Math.random() * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * API Error class
 */
class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly url: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Timeout Error class
 */
class TimeoutError extends Error {
    constructor(message: string, public readonly url: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * API Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const VENDURE_URL = process.env.NEXT_PUBLIC_VENDURE_URL || 'http://localhost:3001';

/**
 * Storefront API Client
 */
export const api = {
    /**
     * Manager API calls
     */
    manager: {
        get: <T>(endpoint: string) =>
            fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`),

        post: <T>(endpoint: string, data: unknown) =>
            fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),

        put: <T>(endpoint: string, data: unknown) =>
            fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),

        delete: <T>(endpoint: string) =>
            fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' }),
    },

    /**
     * Vendure GraphQL calls
     */
    vendure: {
        query: async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
            const response = await fetchWithRetry<{ data: T }>(`${VENDURE_URL}/shop-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });
            return response.data;
        },
    },
};

// Export error classes for use in components
export { ApiError, TimeoutError };
