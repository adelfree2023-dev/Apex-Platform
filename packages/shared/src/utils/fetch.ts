/**
 * ⚔️ APEX MILITARY-GRADE Fetch Utilities
 * NEVER allow infinite waiting - ALL requests have timeouts
 * 
 * Part of Operation Phoenix - Phase 3 FORTIFY
 */

/**
 * Fetch with timeout - prevents UI freezing
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 */
export async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new FetchError(
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
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param baseDelayMs - Base delay between retries (default: 1000)
 */
export async function fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetchWithTimeout<T>(url, options);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on 4xx errors (client errors)
            if (error instanceof FetchError && error.statusCode >= 400 && error.statusCode < 500) {
                throw error;
            }

            if (attempt < maxRetries - 1) {
                // Exponential backoff with jitter
                const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Custom error for fetch failures
 */
export class FetchError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly url: string
    ) {
        super(message);
        this.name = 'FetchError';
    }
}

/**
 * Custom error for timeouts
 */
export class TimeoutError extends Error {
    constructor(message: string, public readonly url: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
