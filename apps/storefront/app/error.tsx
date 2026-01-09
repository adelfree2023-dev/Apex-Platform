'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error to console (will be replaced with Sentry)
        console.error('Storefront Error:', error);

        // TODO: Replace with Sentry when configured
        // Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    عفواً، حدث خطأ
                </h1>
                <p className="text-gray-600 mb-8">
                    نعمل على حل هذه المشكلة. يرجى المحاولة مرة أخرى.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={reset} className="w-full gap-2">
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="w-full gap-2"
                    >
                        <Home className="w-4 h-4" />
                        الصفحة الرئيسية
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 text-left text-sm text-gray-500">
                        <summary className="cursor-pointer font-medium">تفاصيل تقنية</summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-auto text-xs max-h-40">
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
