/**
 * Sentry Error Tracking Initialization
 * 
 * This file MUST be imported FIRST in index.ts before any other imports.
 * It sets up Sentry to capture all unhandled errors and exceptions.
 * 
 * NOTE: @sentry/node must be installed: pnpm add @sentry/node
 */

// Check if Sentry is available before importing
let Sentry: any = null;

try {
    // Dynamic import to avoid build errors if @sentry/node is not installed
    Sentry = require('@sentry/node');

    Sentry.init({
        dsn: process.env.SENTRY_DSN || '',

        // Only enable if DSN is provided
        enabled: !!process.env.SENTRY_DSN,

        // Environment (production, development, staging)
        environment: process.env.NODE_ENV || 'production',

        // Sample rate for performance monitoring (1.0 = 100%)
        tracesSampleRate: 0.2, // 20% of transactions

        // Filter out noisy errors
        beforeSend(event: any, hint: any) {
            // Don't send certain errors to Sentry
            const error = hint?.originalException;
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
} catch (error) {
    // Sentry not installed or failed to initialize
    console.log('[Sentry] ⚠️ Not configured - install @sentry/node to enable');
    Sentry = {
        captureException: () => { },
        captureMessage: () => { },
    };
}

export { Sentry };
