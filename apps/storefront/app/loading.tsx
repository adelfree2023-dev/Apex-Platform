export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header skeleton */}
            <div className="h-16 bg-white border-b animate-pulse">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="flex gap-4">
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="container mx-auto px-4 py-8 animate-pulse">
                {/* Hero skeleton */}
                <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>

                {/* Product grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-48 bg-gray-200 rounded-lg"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
