import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/manager-client";
import { getProductBySlug, Product } from "@/lib/vendure-client";
import { ProductDetails } from "@/components/products/product-details";

export default async function ProductPage({
    params,
}: {
    params: Promise<{ tenant: string; slug: string }>;
}) {
    const { tenant, slug } = await params;

    // 1. Get Tenant for Token
    const tenantData = await getTenantBySlug(tenant);
    if (!tenantData || !tenantData.vendureChannelToken) {
        notFound();
    }

    // 2. Fetch Product directly
    const product = await getProductBySlug(tenantData.vendureChannelToken, slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductDetails product={product} />
        </div>
    );
}
