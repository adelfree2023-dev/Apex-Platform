import { getTenantBySlug } from "@/lib/manager-client";
import { getProducts } from "@/lib/vendure-client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function ProductsPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const products = await getProducts(tenant.vendureChannelToken || "");

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>

            {products.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 mb-4">No products found in this store.</p>
                    <Link href={`/${tenantSlug}`} className="text-primary hover:underline">
                        Go back to home
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/${tenantSlug}/products/${product.slug}`}
                            className="group"
                        >
                            <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square mb-4 relative">
                                {product.featuredAsset ? (
                                    <Image
                                        src={product.featuredAsset.preview}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                                {product.name}
                            </h3>
                            {product.variants[0] && (
                                <p className="text-lg font-semibold text-primary mt-1">
                                    ${(product.variants[0].price / 100).toFixed(2)} {product.variants[0].currencyCode}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
