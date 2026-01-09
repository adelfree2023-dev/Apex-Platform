'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error to console (will be replaced with Sentry)
        console.error('Admin-HQ Error:', error);

        // TODO: Replace with Sentry when configured
        // Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    حدث خطأ غير متوقع
                </h1>
                <p className="text-gray-600 mb-6">
                    نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
                </p>
                <div className="space-y-3">
                    <Button
                        onClick={reset}
                        className="w-full"
                    >
                        إعادة المحاولة
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="w-full"
                    >
                        العودة للرئيسية
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 text-left text-sm text-gray-500">
                        <summary className="cursor-pointer">تفاصيل تقنية</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                            {error.message}
                            {'\n'}
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
