import { SearchResults } from "@/components/search/search-results";
import { getTenantBySlug } from "@/lib/manager-client";
import { notFound } from "next/navigation";
import { searchProducts } from "@/lib/vendure-client";

export default async function SearchPage({
    params,
    searchParams,
}: {
    params: Promise<{ tenant: string }>;
    searchParams: Promise<{ q?: string }>;
}) {
    const { tenant: tenantSlug } = await params;
    const { q: query } = await searchParams;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const results = query
        ? await searchProducts(tenant.vendureChannelToken || "", query)
        : [];

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {query ? `Search results for "${query}"` : "Search Products"}
                </h1>
                {query && (
                    <p className="text-gray-500">
                        Found {results.length} result{results.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            <SearchResults
                results={results}
                query={query || ""}
                tenantSlug={tenantSlug}
            />
        </div>
    );
}
