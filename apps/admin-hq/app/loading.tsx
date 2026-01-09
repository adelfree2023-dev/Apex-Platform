export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse space-y-6 w-full max-w-4xl p-6">
                {/* Header skeleton */}
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>

                {/* Table skeleton */}
                <div className="space-y-3">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
