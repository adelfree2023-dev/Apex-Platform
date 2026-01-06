import { getTenantBySlug } from "@/lib/manager-client";
import { getProductBySlug } from "@/lib/vendure-client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AddToCartBtn } from "@/components/products/add-to-cart-btn";

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

    // 3. Determine Price (Use first variant for MVP)
    const variant = product.variants[0];
    const price = variant ? variant.price : 0;
    const currency = variant ? variant.currencyCode : "USD";

    return (
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-start animate-fade-in">
            {/* Image Gallery (MVP: Single Main Image) */}
            <div className="relative aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                {product.featuredAsset ? (
                    <Image
                        src={product.featuredAsset.preview}
                        alt={product.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        priority
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                        No Image
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
                <div>
                    <Badge variant="secondary" className="mb-4">
                        In Stock
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {product.name}
                    </h1>
                    <div className="mt-4 flex items-baseline gap-4">
                        <span className="text-3xl font-bold text-primary">
                            {(price / 100).toFixed(2)} {currency}
                        </span>
                    </div>
                </div>

                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                    <p>{product.description}</p>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <div className="flex gap-4 items-end">
                        <div className="w-full max-w-xs">
                            {/* Advanced Add To Cart Button */}
                            <AddToCartBtn
                                product={{
                                    id: product.id,
                                    variantId: variant?.id || product.id,
                                    name: product.name,
                                    price: price,
                                    currencyCode: currency,
                                    slug: product.slug,
                                    image: product.featuredAsset?.preview
                                }}
                            />
                        </div>
                    </div>
                    <p className="mt-6 text-xs text-gray-400">
                        Free shipping on orders over $50. Secure checkout.
                    </p>
                </div>
            </div>
        </div>
    );
}
