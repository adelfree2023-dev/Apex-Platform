/**
 * ⚔️ APEX Sentry Configuration (Storefront)
 * Error monitoring and performance tracking
 * 
 * Part of Operation Phoenix - Phase 3 FORTIFY
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Disable in development if no DSN
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Ignore common non-errors
    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'Load failed',
        'ChunkLoadError',
    ],

    // Before sending error
    beforeSend(event) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
            console.debug('[Sentry] Would send:', event);
            return null;
        }
        return event;
    },
});
