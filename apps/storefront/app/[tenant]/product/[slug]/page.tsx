import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/manager-client";
import { createVendureClient, vendureApi } from "@/lib/vendure-client";
import { ProductDetails } from "@/components/products/product-details";
import { Product } from "@/types/product";

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

    // 2. Init Vendure Client
    const client = createVendureClient(tenantData.vendureChannelToken);

    // 3. Fetch Product
    const product = await vendureApi.getProduct(client, slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductDetails product={product as Product} />
        </div>
    );
}
