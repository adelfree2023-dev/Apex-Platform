import { getTenantBySlug } from "@/lib/manager-client";
import { getProductBySlug } from "@/lib/vendure-client";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default async function ProductPage({
    params,
}: {
    params: Promise<{ tenant: string; slug: string }>;
}) {
    const { tenant: tenantSlug, slug } = await params;

    // 1. Get Tenant for Token
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    // 2. Get Product Details
    const product = await getProductBySlug(tenant.vendureChannelToken || "", slug);
    if (!product) notFound();

    return (
        <div className="animate-fade-in">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href={`/${tenantSlug}`} className="hover:text-primary flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/${tenantSlug}`} className="hover:text-primary">
                    Products
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium truncate max-w-[200px]">
                    {product.name}
                </span>
            </nav>

            {/* Product Detail */}
            <ProductDetailClient product={product} tenantSlug={tenantSlug} />

            {/* Related Products Section Placeholder */}
            <div className="mt-16 pt-8 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
                <p className="text-gray-500">Related products coming soon...</p>
            </div>
        </div>
    );
}
