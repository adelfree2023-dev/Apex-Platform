/**
 * Sentry Error Tracking Initialization
 * 
 * This file MUST be imported FIRST in index.ts before any other imports.
 * It sets up Sentry to capture all unhandled errors and exceptions.
 */

import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: 'https://6ed6f57c9b19084330ff3dfb54c753dd@o4510677183168512.ingest.us.sentry.io/4510677188018176',

    // Environment (production, development, staging)
    environment: process.env.NODE_ENV || 'production',

    // Release version (optional - helps track issues across releases)
    // release: process.env.npm_package_version,

    // Send default PII data (IP address, etc.)
    sendDefaultPii: true,

    // Sample rate for performance monitoring (1.0 = 100%)
    tracesSampleRate: 0.2, // 20% of transactions

    // Filter out noisy errors (optional)
    beforeSend(event, hint) {
        // Don't send certain errors to Sentry
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'code' in error) {
            // Skip ECONNRESET and similar network errors
            if ((error as any).code === 'ECONNRESET' || (error as any).code === 'EPIPE') {
                return null;
            }
        }
        return event;
    },
});

console.log('[Sentry] 🛡️ Error tracking initialized');

export { Sentry };
